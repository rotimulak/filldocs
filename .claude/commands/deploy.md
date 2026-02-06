# Deploy FillDocs to VPS

Deploy the application to the production server using Docker.

## Instructions

Read the `.env` file to get VPS credentials (VPS_HOST, VPS_USER, DOMAIN).

Then execute the following deployment steps:

### 1. Sync files to VPS
```bash
rsync -avz --exclude 'node_modules' --exclude '.git' --exclude '__pycache__' \
  -e "ssh -o StrictHostKeyChecking=no" \
  ./ $VPS_USER@$VPS_HOST:/opt/filldocs/
```

### 2. SSH to VPS and deploy
```bash
ssh $VPS_USER@$VPS_HOST << 'DEPLOY'
cd /opt/filldocs

# Build and start containers
docker compose down || true
docker compose build --no-cache
docker compose up -d

# Setup nginx if not exists
if [ ! -f /etc/nginx/sites-enabled/filldocs ]; then
  cp deploy/nginx-host.conf /etc/nginx/sites-available/filldocs
  ln -sf /etc/nginx/sites-available/filldocs /etc/nginx/sites-enabled/
  nginx -t && systemctl reload nginx
fi

# Show status
docker compose ps
DEPLOY
```

### 3. (First time only) Setup HTTPS
```bash
ssh $VPS_USER@$VPS_HOST "certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos -m admin@$DOMAIN"
```

## After deployment
Report the deployment status and the URL: https://$DOMAIN
