# Shopee Browser Bridge Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Start a temporary visual Shopee browser from GitHub Actions so the user can authenticate manually and ChatGPT can control the same browser through Supabase commands.

**Architecture:** A headed Playwright Chromium instance runs on Xvfb in GitHub Actions. noVNC is exposed through a password-protected Cloudflare Quick Tunnel, while a Python bridge polls Supabase for structured browser commands and writes results back.

**Tech Stack:** GitHub Actions, Python 3.12, Playwright, Supabase/Postgres, Xvfb, x11vnc, noVNC, cloudflared.

**Spec:** `docs/superpowers/specs/2026-09-05-shopee-browser-bridge-design.md`

## Global Constraints

- Do not store Shopee credentials, cookies, or user passwords in the repository.
- Do not bypass CAPTCHA, SMS, 2FA, rate limits, or other Shopee controls.
- Supabase service-role credentials stay in GitHub Secrets.
- Browser commands are structured; arbitrary JavaScript execution is not supported.
- The temporary browser session must expire automatically within the GitHub-hosted runner limit.

---

### Task 1: Supabase browser session and command queue

**Files:**
- Database only: `public.shopee_browser_sessions`, `public.shopee_browser_commands`

**Interfaces:**
- Produces session rows keyed by UUID.
- Produces command rows with `action`, `payload`, `status`, and `result`.

- [ ] **Step 1:** Create the two tables with timestamps, status fields, JSON payload/result fields, and foreign-key command-to-session relationship.
- [ ] **Step 2:** Enable RLS on both tables without anonymous policies.
- [ ] **Step 3:** Query `information_schema` and both tables to verify the schema exists and is initially usable by service-role SQL.

### Task 2: Browser bridge

**Files:**
- Create: `shopee-browser/bridge.py`
- Create: `shopee-browser/requirements.txt`

**Interfaces:**
- Consumes environment variables `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `NOVNC_URL`, `VNC_PASSWORD`, and `GITHUB_RUN_ID`.
- Produces a `shopee_browser_sessions` row and updates it while alive.
- Consumes pending `shopee_browser_commands` rows for its session.

- [ ] **Step 1:** Implement a Playwright persistent Chromium context opening `https://affiliate.shopee.com.br/` in headed mode.
- [ ] **Step 2:** Register the session in Supabase with the noVNC URL and ephemeral password.
- [ ] **Step 3:** Poll the command table and claim one pending command at a time.
- [ ] **Step 4:** Implement `snapshot`, `goto`, `click_text`, `click_selector`, `fill`, `press`, `wait`, and `save_storage`.
- [ ] **Step 5:** Store structured success/error results and current URL/title after each command.
- [ ] **Step 6:** Keep the bridge alive until the workflow terminates, updating heartbeat timestamps.

### Task 3: Temporary visual browser workflow

**Files:**
- Create: `.github/workflows/shopee-browser.yml`

**Interfaces:**
- Consumes existing GitHub Secrets `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.
- Starts Xvfb, x11vnc, noVNC, cloudflared, and the Python bridge.

- [ ] **Step 1:** Install Xvfb, x11vnc, noVNC, websockify, cloudflared, Python dependencies, and Playwright Chromium.
- [ ] **Step 2:** Generate a random ephemeral VNC password without printing it to public logs.
- [ ] **Step 3:** Start Xvfb, x11vnc, and noVNC.
- [ ] **Step 4:** Start a Cloudflare Quick Tunnel and extract its HTTPS URL.
- [ ] **Step 5:** Launch `bridge.py` with URL/password supplied only through environment variables.
- [ ] **Step 6:** Keep the workflow alive up to 300 minutes and terminate cleanly.

### Task 4: Live login verification

**Files:**
- No additional files.

**Interfaces:**
- Reads the latest active Supabase session.
- Writes structured commands to the command table.

- [ ] **Step 1:** Verify the workflow created an active session with a noVNC URL.
- [ ] **Step 2:** Give the user the current noVNC link and ephemeral password.
- [ ] **Step 3:** After the user logs in, enqueue `snapshot`.
- [ ] **Step 4:** Verify the result shows an authenticated Shopee Affiliate page before making showcase changes.
