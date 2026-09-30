#!/bin/bash
# ==============================================================================
# FreshCart EC2 Server Provisioning & Setup Script
# Target OS: Ubuntu 22.04 / 24.04 LTS
# ==============================================================================

set -e

echo "=========================================="
echo " Starting FreshCart EC2 Environment Setup "
echo "=========================================="

# 1. Update OS packages
echo "--> Updating system packages..."
sudo apt-get update -y && sudo apt-get upgrade -y
sudo apt-get install -y curl git ufw nginx redis-server build-essential certbot python3-certbot-nginx

# 2. Install Node.js 20 LTS (NodeSource)
echo "--> Installing Node.js 20 LTS..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

echo "Node version: $(node -v)"
echo "NPM version:  $(npm -v)"

# 3. Install PM2 globally
echo "--> Installing PM2 process manager..."
sudo npm install -g pm2

# 4. Prepare directory layout & logging
echo "--> Setting up directory structure..."
sudo mkdir -p /var/www/freshcart
sudo mkdir -p /var/log/pm2
sudo chown -R $USER:$USER /var/www/freshcart
sudo chown -R $USER:$USER /var/log/pm2

# 5. Enable Redis service
echo "--> Configuring Redis..."
sudo systemctl enable redis-server
sudo systemctl start redis-server

# 6. Configure UFW Firewall
echo "--> Configuring basic firewall rules..."
sudo ufw allow 22/tcp comment 'SSH'
sudo ufw allow 80/tcp comment 'HTTP'
sudo ufw allow 443/tcp comment 'HTTPS'
# Enable UFW non-interactively
echo "y" | sudo ufw enable || true

# 7. Apply Linux OS socket optimizations for high concurrency (5,000+ CCU)
echo "--> Applying kernel socket optimizations..."
sudo tee -a /etc/sysctl.d/99-freshcart.conf > /dev/null << 'EOF'
fs.file-max = 2097152
net.core.somaxconn = 65535
net.ipv4.tcp_max_syn_backlog = 65535
net.core.netdev_max_backlog = 65535
net.ipv4.ip_local_port_range = 1024 65535
net.ipv4.tcp_tw_reuse = 1
net.ipv4.tcp_fin_timeout = 15
EOF
sudo sysctl --system > /dev/null 2>&1 || true

echo "=========================================="
echo " System Provisioning Complete!"
echo " Next steps:"
echo " 1. Clone repository to /var/www/freshcart"
echo " 2. Configure backend/.env"
echo " 3. Run deploy/ec2-deploy.sh"
echo "=========================================="
