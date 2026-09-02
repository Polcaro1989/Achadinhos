# Telegram Groups Worker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an isolated Telegram user-session worker that publishes Supabase products only to configured Telegram groups without changing existing site/social flows.

**Architecture:** A new `telegram-worker/` Python package owns configuration, formatting, selection, delivery and posting history. The existing `achadinhos_produtos` table is read-only; a new `telegram_posts` table records successful deliveries. Scheduling is external to the site.

**Tech Stack:** Python 3.11+, Telethon, supabase-py, pytest, python-dotenv

**Spec:** `docs/superpowers/specs/2026-09-02-telegram-groups-worker-design.md`

## Global Constraints
- Do not modify `index.html` or existing social-network flows.
- `achadinhos_produtos` is read-only for this worker.
- Only group IDs in `TELEGRAM_GROUP_IDS` may receive messages.
- Secrets and Telegram session files must never be committed.
- One invocation processes at most one product batch.

---

### Task 1: Pure worker core

**Files:**
- Create: `telegram-worker/tests/test_core.py`
- Create: `telegram-worker/core.py`

**Interfaces:**
- Produces: `parse_group_ids(raw: str) -> list[int]`, `format_product_message(product: dict) -> str`, `pending_group_ids(group_ids: list[int], sent_group_ids: set[int]) -> list[int]`

- [ ] **Step 1: Write failing tests** for parsing, message formatting and duplicate filtering.
- [ ] **Step 2: Run** `pytest telegram-worker/tests/test_core.py -q` and verify failure because `core` is missing.
- [ ] **Step 3: Implement minimal pure functions** in `core.py`.
- [ ] **Step 4: Run** `pytest telegram-worker/tests/test_core.py -q` and verify pass.

### Task 2: Supabase selection and history repository

**Files:**
- Create: `telegram-worker/tests/test_repository.py`
- Create: `telegram-worker/repository.py`
- Create: `telegram-worker/sql/001_telegram_posts.sql`

**Interfaces:**
- Produces: `select_next_product(products: list[dict], history: list[dict], group_ids: list[int]) -> tuple[dict | None, list[int]]`, `TelegramRepository.fetch_candidate_products()`, `TelegramRepository.fetch_history(product_id)`, `TelegramRepository.record_success(...)`

- [ ] **Step 1: Write failing tests** proving oldest eligible product selection and per-group duplicate prevention.
- [ ] **Step 2: Run** `pytest telegram-worker/tests/test_repository.py -q` and verify failure.
- [ ] **Step 3: Implement selection logic and thin Supabase repository**.
- [ ] **Step 4: Add idempotent SQL migration** for `telegram_posts` with unique `(produto_id, grupo_id)`.
- [ ] **Step 5: Run repository tests** and verify pass.

### Task 3: Telegram delivery and executable worker

**Files:**
- Create: `telegram-worker/tests/test_delivery.py`
- Create: `telegram-worker/delivery.py`
- Create: `telegram-worker/worker.py`
- Create: `telegram-worker/login.py`
- Create: `telegram-worker/list_groups.py`
- Create: `telegram-worker/config.py`

**Interfaces:**
- Produces: `send_product(client, group_id, product) -> int`, executable `worker.py`

- [ ] **Step 1: Write failing tests** for text-only and image delivery using a fake client.
- [ ] **Step 2: Run delivery tests** and verify failure.
- [ ] **Step 3: Implement delivery** using Telethon-compatible client methods.
- [ ] **Step 4: Implement configuration validation and one-batch orchestration**.
- [ ] **Step 5: Run all Telegram worker tests**.

### Task 4: Runtime packaging and documentation

**Files:**
- Create: `telegram-worker/requirements.txt`
- Create: `telegram-worker/.env.example`
- Create: `telegram-worker/README.md`
- Create: `telegram-worker/systemd/achadinhos-telegram.service`
- Create: `telegram-worker/systemd/achadinhos-telegram.timer`
- Create: `.gitignore` only if the repository does not already protect `.env` and `*.session`.

- [ ] **Step 1: Add pinned-compatible dependency floors and safe example config**.
- [ ] **Step 2: Document login, group discovery, SQL migration, test run and service installation**.
- [ ] **Step 3: Add a 4-hour systemd timer example**.
- [ ] **Step 4: Run `pytest telegram-worker/tests -q` and `python -m compileall telegram-worker`**.
- [ ] **Step 5: Compare branch to `main` and confirm no existing application files changed**.