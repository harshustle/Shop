#!/bin/bash
# ==============================================================================
# FreshCart Zero-Downtime EC2 Deployment / Update Script
# Usage: ./deploy/ec2-deploy.sh
# ==============================================================================

set -e

APP_DIR="/var/www/freshcart"

echo "=========================================="
echo " Deploying FreshCart on EC2 "
echo "=========================================="

cd $APP_DIR

# 1. Pull latest code (if in git repo)
if [ -d ".git" ]; then
    echo "--> Pulling latest git changes..."
    git pull origin main || git pull origin master || true
fi

# 2. Check for backend/.env
if [ ! -f "backend/.env" ]; then
    echo "WARNING: backend/.env not found!"
    echo "Creating backend/.env from template backend/.env.example..."
    cp backend/.env.example backend/.env
    echo "PLEASE EDIT backend/.env with your production credentials."
fi

# 3. Install & Build Client Frontend
echo "--> Installing & building client..."
cd $APP_DIR/client
npm ci --legacy-peer-deps || npm install --legacy-peer-deps
npm run build

# 4. Install Backend Dependencies
echo "--> Installing backend dependencies..."
cd $APP_DIR/backend
npm ci --only=production || npm install --production

# 5. Ensure uploads directory exists
mkdir -p $APP_DIR/backend/uploads

# 6. Configure & Reload Nginx
echo "--> Verifying Nginx configuration..."
sudo cp $APP_DIR/deploy/nginx.conf /etc/nginx/sites-available/freshcart.conf
sudo ln -sf /etc/nginx/sites-available/freshcart.conf /etc/nginx/sites-enabled/freshcart.conf
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx

# 7. Start or Reload PM2 Cluster
echo "--> Reloading PM2 Cluster..."
cd $APP_DIR
if pm2 describe freshcart-api > /dev/null 2>&1; then
    pm2 reload deploy/ecosystem.config.js --update-env
else
    pm2 start deploy/ecosystem.config.js
    pm2 save
    pm2 startup | tail -n 1 | bash || true
fi

echo "=========================================="
echo " FreshCart Successfully Deployed! "
echo " Check status: pm2 status "
echo " Check logs:   pm2 logs freshcart-api "
echo " Check health: curl http://localhost/api/health "
echo "=========================================="
