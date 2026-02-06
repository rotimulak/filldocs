#!/bin/bash
set -e

# Run this once on fresh VPS to setup environment
# Usage: ssh root@VPS_IP 'bash -s' < deploy/setup-server.sh

echo "==> Installing Docker..."
curl -fsSL https://get.docker.com | sh

echo "==> Installing Nginx & Certbot..."
apt-get update
apt-get install -y nginx certbot python3-certbot-nginx

echo "==> Creating app directory..."
mkdir -p /opt/filldocs

echo "==> Setup complete!"
echo "Now run /deploy to deploy the application"
