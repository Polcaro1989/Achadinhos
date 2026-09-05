import asyncio
import json
import os
import time
import uuid
from pathlib import Path
from urllib.parse import urlparse

from playwright.async_api import async_playwright
from supabase import create_client


SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_SERVICE_ROLE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
NOVNC_URL = os.environ["NOVNC_URL"]
VNC_PASSWORD = os.environ["VNC_PASSWORD"]
GITHUB_RUN_ID = int(os.environ.get("GITHUB_RUN_ID", "0") or 0)
START_URL = os.environ.get("SHOPEE_START_URL", "https://affiliate.shopee.com.br/")
PROFILE_DIR = os.environ.get("SHOPEE_PROFILE_DIR", "/tmp/shopee-playwright-profile")

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)


def require_https(url: str) -> str:
    parsed = urlparse(url)
    if parsed.scheme != "https" or not parsed.netloc:
        raise ValueError("Only absolute HTTPS URLs are allowed")
    return url


def bounded_wait(value) -> int:
    try:
        value = int(value)
    except Exception:
        value = 1000
    return max(0, min(value, 10000))


def shorten(value, limit=30000):
    if value is None:
        return None
    text = value if isinstance(value, str) else json.dumps(value, ensure_ascii=False)
    if len(text) <= limit:
        return text
    return text[:limit] + "\n...[truncated]"


async def active_page(context):
    pages = [page for page in context.pages if not page.is_closed()]
    if not pages:
        return await context.new_page()
    return pages[-1]


async def page_meta(page):
    title = ""
    try:
        title = await page.title()
    except Exception:
        pass
    return {"current_url": page.url, "page_title": title}


async def snapshot(page):
    body_text = ""
    try:
        body_text = await page.locator("body").inner_text(timeout=5000)
    except Exception:
        pass

    elements = await page.locator("a,button,input,textarea,select,[role='button']").evaluate_all(
        """els => els.slice(0, 250).map((el, index) => ({
          index,
          tag: el.tagName.toLowerCase(),
          text: (el.innerText || el.value || el.getAttribute('aria-label') || el.getAttribute('placeholder') || '').trim().slice(0, 240),
          href: el.href || null,
          type: el.getAttribute('type'),
          name: el.getAttribute('name'),
          id: el.id || null,
          role: el.getAttribute('role'),
          disabled: !!el.disabled
        }))"""
    )
    return {
        "url": page.url,
        "title": await page.title(),
        "text": shorten(body_text),
        "elements": elements,
    }


async def execute_command(context, action, payload):
    page = await active_page(context)
    timeout = int(payload.get("timeout_ms", 15000))
    timeout = max(1000, min(timeout, 30000))

    if action == "snapshot":
        return await snapshot(page)

    if action == "goto":
        url = require_https(payload["url"])
        await page.goto(url, wait_until="domcontentloaded", timeout=30000)
        return await snapshot(page)

    if action == "click_text":
        text = str(payload["text"])
        exact = bool(payload.get("exact", False))
        locator = page.get_by_text(text, exact=exact).first
        await locator.click(timeout=timeout)
        await page.wait_for_timeout(700)
        return await snapshot(await active_page(context))

    if action == "click_role":
        role = str(payload["role"])
        name = payload.get("name")
        locator = page.get_by_role(role, name=name).first if name else page.get_by_role(role).first
        await locator.click(timeout=timeout)
        await page.wait_for_timeout(700)
        return await snapshot(await active_page(context))

    if action == "click_selector":
        selector = str(payload["selector"])
        await page.locator(selector).first.click(timeout=timeout)
        await page.wait_for_timeout(700)
        return await snapshot(await active_page(context))

    if action == "fill":
        selector = str(payload["selector"])
        value = str(payload.get("value", ""))
        await page.locator(selector).first.fill(value, timeout=timeout)
        return {"filled": True, **(await page_meta(page))}

    if action == "press":
        key = str(payload["key"])
        selector = payload.get("selector")
        if selector:
            await page.locator(str(selector)).first.press(key, timeout=timeout)
        else:
            await page.keyboard.press(key)
        await page.wait_for_timeout(500)
        return await snapshot(await active_page(context))

    if action == "wait":
        ms = bounded_wait(payload.get("ms", 1000))
        await page.wait_for_timeout(ms)
        return {"waited_ms": ms, **(await page_meta(page))}

    if action == "save_storage":
        state = await context.storage_state()
        return {"storage_state": state, **(await page_meta(page))}

    raise ValueError(f"Unsupported action: {action}")


async def update_session(session_id, **values):
    values["updated_at"] = "now()"
    # PostgREST treats strings literally, so use an explicit ISO timestamp.
    values["updated_at"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    supabase.table("shopee_browser_sessions").update(values).eq("id", session_id).execute()


async def bridge_loop(context, session_id):
    last_heartbeat = 0.0
    while True:
        now = time.time()
        if now - last_heartbeat >= 10:
            page = await active_page(context)
            meta = await page_meta(page)
            await update_session(
                session_id,
                status="ready",
                heartbeat_at=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                **meta,
            )
            last_heartbeat = now

        response = (
            supabase.table("shopee_browser_commands")
            .select("id,action,payload")
            .eq("session_id", session_id)
            .eq("status", "pending")
            .order("id")
            .limit(1)
            .execute()
        )
        rows = response.data or []
        if not rows:
            await asyncio.sleep(1.5)
            continue

        command = rows[0]
        command_id = command["id"]
        claimed = (
            supabase.table("shopee_browser_commands")
            .update({
                "status": "running",
                "started_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            })
            .eq("id", command_id)
            .eq("status", "pending")
            .execute()
        )
        if not (claimed.data or []):
            continue

        try:
            result = await execute_command(context, command["action"], command.get("payload") or {})
            supabase.table("shopee_browser_commands").update({
                "status": "success",
                "result": result,
                "error": None,
                "finished_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            }).eq("id", command_id).execute()
        except Exception as exc:
            error = f"{type(exc).__name__}: {exc}"
            supabase.table("shopee_browser_commands").update({
                "status": "error",
                "error": shorten(error, 5000),
                "finished_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            }).eq("id", command_id).execute()
            await update_session(session_id, last_error=shorten(error, 5000))


async def main():
    session_id = str(uuid.uuid4())
    now = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    supabase.table("shopee_browser_sessions").insert({
        "id": session_id,
        "github_run_id": GITHUB_RUN_ID,
        "status": "starting",
        "novnc_url": NOVNC_URL,
        "vnc_password": VNC_PASSWORD,
        "heartbeat_at": now,
    }).execute()

    Path(PROFILE_DIR).mkdir(parents=True, exist_ok=True)

    try:
        async with async_playwright() as playwright:
            context = await playwright.chromium.launch_persistent_context(
                PROFILE_DIR,
                headless=False,
                viewport={"width": 1365, "height": 720},
                args=["--no-sandbox", "--disable-dev-shm-usage"],
            )
            page = await active_page(context)
            if page.url == "about:blank":
                try:
                    await page.goto(require_https(START_URL), wait_until="domcontentloaded", timeout=30000)
                except Exception:
                    pass
            meta = await page_meta(page)
            await update_session(session_id, status="ready", **meta)
            print(f"SESSION_ID={session_id}", flush=True)
            await bridge_loop(context, session_id)
    except asyncio.CancelledError:
        raise
    except KeyboardInterrupt:
        pass
    except Exception as exc:
        await update_session(session_id, status="failed", last_error=shorten(f"{type(exc).__name__}: {exc}", 5000))
        raise
    finally:
        try:
            await update_session(session_id, status="stopped")
        except Exception:
            pass


if __name__ == "__main__":
    asyncio.run(main())
