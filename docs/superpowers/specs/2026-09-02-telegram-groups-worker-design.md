# Telegram Groups Worker Design

## Goal
Add an isolated Telegram publishing worker that reads products from the existing `achadinhos_produtos` Supabase table and posts them, using the owner's authenticated Telegram user account, only to explicitly configured groups.

## Isolation
- Do not modify `index.html` or the existing social-network flows.
- All runtime code lives under `telegram-worker/`.
- Existing `achadinhos_produtos` is read-only for this worker.
- Posting history is stored in a new `telegram_posts` table.
- Telegram session files and secrets stay outside Git.

## Data flow
1. Read the oldest active product from `achadinhos_produtos` that has not been sent to every configured Telegram group.
2. Build a short message containing product name, current price and affiliate URL.
3. Send image + caption when `imagem_url` exists, otherwise send text only.
4. Wait a configurable delay between groups.
5. Insert one `telegram_posts` row per successful group delivery.
6. Never send a product again to a group when a successful history row already exists.

## Configuration
Runtime configuration comes only from environment variables: `TELEGRAM_API_ID`, `TELEGRAM_API_HASH`, `TELEGRAM_PHONE`, `TELEGRAM_GROUP_IDS`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, and optional delay settings. Group IDs form an explicit allowlist.

## Safety
- `.env`, `*.session`, and `*.session-journal` must not be committed.
- No automatic joining of groups.
- No broadcast to dialogs outside `TELEGRAM_GROUP_IDS`.
- Flood-wait errors are respected rather than bypassed.
- Failed sends are not recorded as successful.

## Scheduling
The worker performs one product batch per invocation. A cron/systemd timer can invoke it every four hours on the Oracle VM. This keeps scheduling outside the website and avoids coupling to GitHub Pages.

## Testing
Unit tests cover message formatting, group-id parsing, product selection and duplicate filtering without requiring live Telegram or Supabase credentials. Live authentication and delivery remain explicit operational steps.