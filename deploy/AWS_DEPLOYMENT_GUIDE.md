# AWS Production Deployment Guide

This guide details the complete deployment process for the FreshCart Single-Vendor E-Commerce Platform on AWS infrastructure.

---

## Architecture Topology
```text
                         CUSTOMER
                            │
                            ▼
                     ┌─────────────┐
                     │  Route 53   │
                     │   Domain    │
                     └──────┬──────┘
                            │
                            ▼
                     ┌─────────────┐
                     │     ALB     │
                     │Load Balancer│
                     └──────┬──────┘
                            │
                            ▼
                     ┌─────────────┐
                     │     EC2     │
                     │             │
                     │  Next.js    │
                     │  Node.js API│
                     │  Nginx      │
                     │  PM2        │
                     └──────┬──────┘
                            │
             ┌──────────────┼──────────────┐
             ▼              ▼              ▼
        ┌─────────┐   ┌───────────┐   ┌─────────────┐
        │ MongoDB │   │   Redis   │   │     S3      │
        │ Atlas   │   │  Cache    │   │             │
        │ Products│   │ Sessions  │   │ Product     │
        │ Orders  │   │ Cart      │   │ Images      │
        │ Users   │   │           │   │ Videos      │
        └─────────┘   └───────────┘   └─────────────┘
```

---

## 1. Route 53 DNS Setup
1. Create a **Public Hosted Zone** for your domain (e.g., `freshcart.com`).
2. Point your domain registrar nameservers to AWS Route 53 NS records.
3. Create an **Alias A Record** pointing to your AWS Application Load Balancer (ALB) dualstack DNS name.
4. Issue a free SSL/TLS certificate via **AWS Certificate Manager (ACM)** for `freshcart.com` and `*.freshcart.com`.

---

## 2. Application Load Balancer (ALB)
1. **Target Group**: Create a Target Group (Type: Instance / IP) with HTTP Port 80, Health check path `/api/health`.
2. **Listener 443 (HTTPS)**: Default action forwards to the Target Group, with the ACM certificate attached.
3. **Listener 80 (HTTP)**: HTTP to HTTPS automatic 301 redirect.

---

## 3. EC2 Instance Provisioning
- **OS**: Ubuntu 22.04 / 24.04 LTS (t3.medium or higher recommended).
- **Security Group**:
  - Inbound Port 80 & 443 allowed **only** from the ALB Security Group.
  - Inbound Port 22 (SSH) allowed only from your administrative IP.
- **Install Core Packages**:
  ```bash
  sudo apt update && sudo apt install -y curl git nginx nodejs npm redis-server
  sudo npm install -g pm2
  ```

---

## 4. AWS S3 Bucket Setup
1. Create an S3 Bucket: `freshcart-production-assets` in region `ap-south-1`.
2. Configure Folder Layout:
   ```text
   freshcart-production-assets/
   ├── products/
   ├── categories/
   ├── banners/
   └── uploads/
   ```
3. Attach IAM User Policy granting `s3:PutObject`, `s3:GetObject`, `s3:DeleteObject`.
4. Configure CORS on the S3 bucket to permit frontend browser access.

---

## 5. MongoDB Atlas Cluster
1. Create an M10 or serverless cluster in AWS `ap-south-1`.
2. Add EC2 Elastic IP to MongoDB Atlas Network Access whitelist.
3. Configure connection string:
   ```ini
   MONGODB_URI=mongodb+srv://<user>:<password>@freshcart.mongodb.net/shop?retryWrites=true&w=majority
   ```

---

## 6. PM2 & Nginx Deployment
```bash
# Clone repo
git clone <repository_url> /var/www/freshcart
cd /var/www/freshcart

# Install & Build Frontend
cd client
npm install
npm run build

# Install Backend
cd ../backend
npm install --production

# Start with PM2 Cluster
pm2 start ../deploy/ecosystem.config.js
pm2 save
pm2 startup

# Configure Nginx
sudo cp ../deploy/nginx.conf /etc/nginx/sites-available/freshcart.conf
sudo ln -s /etc/nginx/sites-available/freshcart.conf /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

---

## 7. High-Concurrency Production Sizing (5,000 Concurrent Users)

To reliably serve **5,000 simultaneous active users** during peak flash sales or marketing campaigns without downtime or degraded response times, the infrastructure must be architected for **1,250 to 2,500 Requests Per Second (RPS)**.

### 7.1 Traffic & Sizing Matrix

| Component | Minimum Sizing (5,000 CCU) | Recommended High-Availability Setup |
| :--- | :--- | :--- |
| **Peak Concurrent Users (CCU)** | 5,000 active shoppers | 5,000 to 10,000 concurrent sessions |
| **Peak Throughput** | 1,500 RPS | 2,500+ RPS |
| **EC2 Compute Cluster** | 2 x `c6i.xlarge` (4 vCPU, 8 GB RAM) | Auto Scaling Group (2 to 6 x `c6i.xlarge` or `c6i.2xlarge`) |
| **Node.js PM2 Workers** | 8 workers (4 per instance) | 16 workers (cluster mode across ASG) |
| **Redis In-Memory Cache** | `cache.m6g.large` (6.38 GB RAM) | Multi-AZ ElastiCache Redis Cluster (`cache.m6g.xlarge`) |
| **MongoDB Atlas** | **M30** (8 GB RAM, 2 vCPU, 1,500 max conns) | **M40** (16 GB RAM, 4 vCPU, 3,000 max conns) |
| **Edge CDN** | AWS CloudFront (S3 + ALB origin) | CloudFront with Brotli/Gzip edge compression |

---

### 7.2 Why 5,000 Users Scale Effortlessly

1. **Redis Read Offloading (85%+ Cache Hit Ratio)**:
   - Over 80% of consumer traffic is read-heavy (`/api/catalog/search`, `/api/catalog/categories`, `/api/banners`, `/api/products/:slug`).
   - Redis serves these requests in **< 1 millisecond** directly from memory, insulating MongoDB from spike volume.
2. **CloudFront CDN Edge Termination**:
   - All static frontend bundles (`.js`, `.css`), WebP images, and category icons are served from 450+ CloudFront edge points of presence.
   - Zero compute or memory load on EC2 for static media.
3. **Mongoose Hot Connection Pooling**:
   - `maxPoolSize: 100` and `minPoolSize: 25` per PM2 worker.
   - Connections remain pre-warmed, eliminating handshake and SSL reconnection latencies.
4. **15-Minute Concurrency Holds**:
   - High-demand SKUs are protected against overselling through atomic MongoDB TTL reservation holds (`/api/checkout/reserve`).

---

### 7.3 Linux OS Kernel Optimization (EC2)

Apply these settings to `/etc/sysctl.conf` on your EC2 instances to handle 10,000+ open socket connections:

```ini
# Maximum open file handles
fs.file-max = 2097152

# Socket backlog & connection queuing
net.core.somaxconn = 65535
net.ipv4.tcp_max_syn_backlog = 65535
net.core.netdev_max_backlog = 65535

# Ephemeral port range for outbound connections
net.ipv4.ip_local_port_range = 1024 65535

# TCP connection reuse
net.ipv4.tcp_tw_reuse = 1
net.ipv4.tcp_fin_timeout = 15

# TCP socket buffers
net.ipv4.tcp_rmem = 4096 87380 16777216
net.ipv4.tcp_wmem = 4096 65536 16777216
```

Reload sysctl immediately:
```bash
sudo sysctl -p
```

Set system-wide user file limits in `/etc/security/limits.conf`:
```text
* soft nofile 65535
* hard nofile 65535
nginx soft nofile 65535
nginx hard nofile 65535
```

---

### 7.4 Load Testing Command (Simulate 5,000 Virtual Users)

Run an automated stress test using **k6** or **Autocannon**:

```bash
# Using Autocannon (Node.js)
npx autocannon -c 5000 -d 60 -p 10 http://localhost:3000/api/catalog/search

# Using k6
k6 run --vus 5000 --duration 1m - << 'EOF'
import http from 'k6/http';
import { check } from 'k6';

export default function () {
  let res = http.get('http://localhost:3000/api/catalog/search');
  check(res, { 'status is 200': (r) => r.status === 200 });
}
EOF
```

