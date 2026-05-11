# Deployment Guide

## Prerequisites

- VPS with Docker and Docker Compose installed
- Nginx and Certbot installed (see `deploy/setup-server.sh`)
- Domain `filldocs.ru` pointing to the VPS IP
- Subdomain `dashboard.filldocs.ru` pointing to the same VPS IP (for Umami analytics)

## Initial Server Setup

```bash
ssh root@VPS_IP 'bash -s' < deploy/setup-server.sh
```

This installs Docker, Nginx, and Certbot.

## Application Deployment

### 1. Configure Environment

Copy `.env.example` to `.env` in the project root and fill in the secrets:

```bash
# Root .env (used by docker-compose for Umami)
UMAMI_DB_PASSWORD=<strong-random-password>
UMAMI_APP_SECRET=<strong-random-secret>
```

Copy `backend/.env.example` to `backend/.env` and configure:

```bash
FILLDOCS_LLM_API_KEY=<your-anthropic-api-key>
FILLDOCS_LLM_MODEL=claude-sonnet-4-20250514
```

### 2. Start Services

```bash
cd /opt/filldocs
docker compose up -d
```

This starts: backend, frontend (port 4000), umami-db (PostgreSQL), umami (port 3000).

### 3. Configure Nginx

#### Main site (filldocs.ru)

```bash
sudo cp deploy/nginx-host.conf /etc/nginx/sites-available/filldocs.ru
sudo ln -sf /etc/nginx/sites-available/filldocs.ru /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

#### Umami dashboard (dashboard.filldocs.ru)

```bash
sudo cp deploy/nginx-dashboard.conf /etc/nginx/sites-available/dashboard.filldocs.ru
sudo ln -sf /etc/nginx/sites-available/dashboard.filldocs.ru /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### 4. SSL Certificates (Certbot)

```bash
# Main site
sudo certbot --nginx -d filldocs.ru -d www.filldocs.ru

# Umami dashboard
sudo certbot --nginx -d dashboard.filldocs.ru
```

Certbot will automatically modify the Nginx configs to add SSL directives and set up auto-renewal.

### 5. Configure Umami

1. Open `https://dashboard.filldocs.ru` in your browser.
2. Log in with default credentials: `admin` / `umami`.
3. **Change the admin password immediately.**
4. Go to Settings > Websites > Add website.
5. Enter `filldocs.ru` as the name and URL.
6. Copy the generated `Website ID`.
7. Set `VITE_UMAMI_WEBSITE_ID=<copied-id>` in `frontend/.env.production`.
8. Rebuild and redeploy the frontend:

```bash
docker compose up -d --build frontend
```

## Updating

**ВАЖНО:** Деплой ТОЛЬКО через git pull. Никогда не копировать файлы через scp/rsync — это ломает git-состояние на VPS (stash, staged conflicts, потерянные изменения).

```bash
# 1. Мерж PR в main (локально)
gh pr merge <N> --squash --delete-branch

# 2. На VPS: pull и rebuild
ssh -p 443 root@153.80.251.203 'cd /opt/filldocs && git pull origin main && docker compose build --no-cache frontend && docker compose up -d frontend'

# 3. Если изменился nginx конфиг
ssh -p 443 root@153.80.251.203 'cp /opt/filldocs/deploy/nginx-host.conf /etc/nginx/sites-available/filldocs && nginx -t && systemctl reload nginx'
```

## Troubleshooting

- **Umami not accessible**: Check that `dashboard.filldocs.ru` DNS points to the VPS, Nginx config is linked and loaded, and the umami container is running (`docker compose logs umami`).
- **SSL certificate issues**: Run `sudo certbot renew --dry-run` to test renewal. Certbot auto-renews via systemd timer.
- **Frontend not tracking**: Verify `VITE_UMAMI_WEBSITE_ID` is set in `.env.production` and the frontend was rebuilt after the change.
