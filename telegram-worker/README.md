# Telegram Groups Worker

Serviço isolado para publicar produtos de `achadinhos_produtos` em uma allowlist de grupos do Telegram usando a conta autenticada do proprietário. Ele não altera o site nem os fluxos existentes de outras redes.

## 1. Preparar ambiente

```bash
cd telegram-worker
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Crie `api_id` e `api_hash` em https://my.telegram.org e preencha o `.env`. Use uma chave de servidor do Supabase apenas nessa VM; nunca coloque `SUPABASE_SERVICE_KEY`, `TELEGRAM_API_HASH` ou arquivos `.session` no Git.

## 2. Criar tabela de histórico

Execute `sql/001_telegram_posts.sql` no SQL Editor do Supabase. A tabela é separada e não altera `achadinhos_produtos`.

## 3. Autenticar a conta

```bash
python login.py
```

Na primeira execução o Telegram solicitará o código da conta. O arquivo de sessão fica local e está ignorado pelo Git.

## 4. Descobrir os IDs dos dois grupos

Entre manualmente nos grupos com a conta e execute:

```bash
python list_groups.py
```

Copie somente os IDs desejados para `TELEGRAM_GROUP_IDS`. O worker nunca envia para grupos fora dessa lista.

## 5. Testar sem publicar

```bash
pytest tests -q
python -m compileall .
```

## 6. Publicar um lote

```bash
python worker.py
```

Cada execução escolhe no máximo um produto e o envia apenas aos grupos que ainda não receberam aquele produto. Um envio só entra em `telegram_posts` depois que o Telegram retorna sucesso.

## 7. Agendar na Oracle VM

Os arquivos em `systemd/` mostram uma execução a cada quatro horas. Ajuste `/opt/achadinhos` e o usuário `achadinhos` conforme o servidor, copie os units para `/etc/systemd/system/`, então use:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now achadinhos-telegram.timer
systemctl list-timers achadinhos-telegram.timer
```

## Observação sobre limites

O worker respeita `FloodWaitError`: ele encerra a execução e não tenta contornar a limitação. O intervalo entre grupos é configurável por `TELEGRAM_MIN_DELAY_SECONDS` e `TELEGRAM_MAX_DELAY_SECONDS`.
