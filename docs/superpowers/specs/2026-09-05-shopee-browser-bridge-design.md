# Shopee Browser Bridge Design

## Goal

Provide a temporary, visual browser session that the user can open from a phone or computer to log in to the Shopee Affiliate portal, while allowing ChatGPT to continue controlling the same authenticated browser through commands stored in Supabase.

## Architecture

GitHub Actions starts an Ubuntu runner, Xvfb, noVNC, a short-lived Cloudflare Quick Tunnel, and a headed Playwright Chromium session. The browser session is visible to the user through noVNC. A small Python bridge owns the Playwright browser and polls Supabase for browser commands.

The user performs only interactive authentication steps such as password, SMS/2FA, or CAPTCHA. After login, ChatGPT sends structured commands to Supabase and the bridge executes them in the already-authenticated Playwright page.

## Components

- `.github/workflows/shopee-browser.yml`: starts the temporary browser environment and keeps it alive for up to 5 hours.
- `shopee-browser/bridge.py`: launches Playwright, registers the session in Supabase, polls commands, executes supported browser actions, and stores results.
- `shopee_browser_sessions`: records the active browser session, noVNC URL, ephemeral VNC password, current URL/title, status, and timestamps.
- `shopee_browser_commands`: queue of structured browser commands and their results.

## Supported Commands

- `snapshot`: return current URL, title, visible text, links, buttons, and form controls.
- `goto`: navigate to an HTTPS URL.
- `click_text`: click a visible element by text.
- `click_selector`: click an element by CSS selector.
- `fill`: fill a CSS-selected form control.
- `press`: send a keyboard key to a CSS-selected element or the page.
- `wait`: wait for a bounded number of milliseconds.
- `save_storage`: return Playwright storage state for later encrypted persistence.

Arbitrary JavaScript execution is intentionally not supported.

## Security

- Shopee credentials are never stored in the repository or requested in chat.
- Supabase service-role credentials remain GitHub Secrets.
- Supabase tables use RLS with no anonymous policies; only service-role access is used.
- noVNC is protected by a random, short-lived VNC password. The tunnel URL alone is insufficient to access the desktop.
- The browser runner expires automatically.
- CAPTCHA, SMS, 2FA, and other anti-abuse challenges are completed manually by the user and are never bypassed.

## Initial Flow

1. Start the GitHub Actions browser session.
2. Return the noVNC URL and ephemeral password through Supabase.
3. User opens the browser and logs in to `https://affiliate.shopee.com.br/`.
4. User tells ChatGPT login is complete.
5. ChatGPT issues `snapshot` and navigation commands to inspect the Affiliate Showcase.
6. ChatGPT lists existing collections/items before destructive cleanup.
7. After the user's already-given instruction to clear the showcase is confirmed against the live inventory, ChatGPT removes the existing showcase content through browser commands.

## Failure Handling

The bridge records command failures in Supabase and continues polling. Browser crashes or workflow expiration mark the session as stopped/failed where possible. Destructive actions are executed one at a time so failures are observable and resumable.
