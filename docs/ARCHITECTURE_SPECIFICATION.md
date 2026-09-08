# High-Performance Single-Vendor E-Commerce Platform
## Production System Architecture & Engineering Specification

**Stack**: MERN (MongoDB, Express.js, React, Node.js) + Amazon Web Services (AWS) + Redis + Razorpay  
**Scale Target**: 20,000 Concurrent Shoppers | Peak Throughput: 4,000 RPS  
**Latency Budget**: &le; 10ms Edge TTFB | Dynamic Mutation P99 &le; 65ms  
**Target AWS Region**: `ap-south-1` (Mumbai)  

---

## 1. Executive Summary & Capacity Planning (20,000 Users Scale)

### 1.1 Traffic Modeling & Sizing Calculations
* **Active Users:** 20,000 concurrent sessions during flash sales.
* **Request Behavior:** 1 request every 5 seconds &rarr; **4,000 Requests/Second (RPS)** peak traffic.
* **CloudFront Edge Offloading:** Static assets (WebP/AVIF images, CSS/JS bundles) and catalog listing JSON (PLP/PDP) are served with stale-while-revalidate headers.
  * **Edge Cache Hit Ratio:** 88% - 92% (served in &le; 10ms).
* **Origin Load (EC2 Node.js Fleet):** Receives 10%-12% dynamic traffic &rarr; **400 to 480 RPS** (Cart mutations, Stock reservations, Checkout, Account mutations).
* **Database Load (MongoDB Atlas M30 3-Node Replica Set):** 95% read operations are offloaded to Redis in-memory cache. MongoDB handles ~50-80 raw read RPS and 80-120 transactional write RPS at peak.

| Metric | Target | Notes |
| :--- | :--- | :--- |
| **Target Concurrency** | 20,000 | Simultaneous active shoppers |
| **Edge Cache Target** | &le; 10 ms | TTFB for static assets & cached catalog APIs |
| **Peak Throughput** | 4,000 RPS | Edge: ~3,500 RPS \| Origin: ~400-500 RPS |
| **Checkout Dynamic P99** | &le; 65 ms | Orders, distributed stock locks & payments |

---

## 2. High-Level Design (HLD) & AWS Infrastructure

```
                                 [ CUSTOMER DEVICE (Web / Mobile) ]
                                                 │
                                                 ▼ (HTTPS / TLS 1.3 Anycast)
                                        [ AWS Route 53 DNS ]
                                                 │
                                                 ▼
                                  [ AWS CloudFront CDN Edge POPs ]
                                  ├── (Cache Hit: Static/Catalog JSON) ──► Return in ≤ 10ms
                                  └── (Cache Miss / Mutation / Auth)
                                                 │
                                                 ▼
                                        [ AWS WAF (Security) ]
                                                 │
                                 [ Application Load Balancer (ALB) ]
                                                 │ (Private Subnets)
                  ┌──────────────────────────────┼──────────────────────────────┐
                  ▼                              ▼                              ▼
         [ EC2 Instance 1 ]             [ EC2 Instance 2 ]             [ EC2 Instance 3 ]
         c6i.xlarge (4 vCPU)            c6i.xlarge (4 vCPU)            c6i.xlarge (4 vCPU)
         PM2 Clustered Node             PM2 Clustered Node             PM2 Clustered Node
                  │                              │                              │
                  └───────────────────────┬──────┴──────────────────────────────┘
                                          │
                     ┌────────────────────┴────────────────────┐
                     ▼                                         ▼
        [ Amazon ElastiCache Redis ]               [ MongoDB Atlas Replica Set ]
        - Hot Catalog & PDP Cache                  - Primary: Atomic Writes & Orders
        - Redis Lua Stock Locks (15-min TTL)       - Secondary: Read Pool & Reporting
        - Cart & Session Store                     - RAM Resident Compound Indexes
                     │                                         │
                     └────────────────────┬────────────────────┘
                                          ▼
                             [ BullMQ Async Task Workers ]
                             - Razorpay Webhook Deduplication
                             - Tax Invoice PDF Generation & S3 Push
                             - Courier (Shiprocket/Delhivery) AWB API
```

### 2.1 AWS Infrastructure Mapping
* **DNS & Edge:** Route 53 + CloudFront CDN with Global Edge POPs in Mumbai, Delhi, Bangalore, Chennai, Hyderabad.
* **WAF Layer:** AWS WAF with IP rate limits on checkout endpoints (15 req/min/IP) and DDoS mitigation.
* **Compute:** Auto Scaling Group of 3x to 6x `c6i.xlarge` (4 vCPU, 8 GB RAM) running Node.js in PM2 Cluster Mode.
* **Cache:** Amazon ElastiCache Redis (`cache.m6g.large` Multi-AZ) for sub-ms caching and distributed locks.
* **Database:** MongoDB Atlas Dedicated M30 Cluster (3-Node Replica Set) with VPC Peering.
* **Object Storage:** Private Amazon S3 with CloudFront Origin Access Control (OAC).
* **Async Workers:** BullMQ worker instance for invoice PDFs, webhook processing, and courier integrations.

---

## 3. The 10-Millisecond Latency Engineering Blueprint

### 3.1 Latency Budget Breakdown
* **Edge Hit (CloudFront CDN):** 0.5ms edge lookup + 8ms last-mile round-trip = **~8.5ms - 10ms TTFB**.
* **Dynamic Read Hit (ElastiCache Redis in same VPC AZ):** 0.8ms Redis execution + 2.2ms Express serialization + 6ms network = **~9ms total response**.
* **Dynamic DB Mutation (Atomic Mongo Order Placement):** 14ms WiredTiger commit + 18ms network = **~32ms (P99 ≤ 65ms)**.

### 3.2 Optimization Principles
1. **Edge Cache Headers:**
   * Immutable assets: `Cache-Control: public, max-age=31536000, immutable`
   * Catalog / PDP: `Cache-Control: public, max-age=60, s-maxage=300, stale-while-revalidate=86400`
2. **Node.js Zero-Allocation Tuning:**
   * Strict `.lean()` queries on all read paths to bypass Mongoose document hydration.
   * Offload Gzip/Brotli compression to ALB/CloudFront.
   * `UV_THREADPOOL_SIZE=64` to prevent thread starvation during crypto/bcrypt operations.
3. **Automated Media Optimization:** S3 upload triggers Lambda for WebP/AVIF generation at 80% quality.

---

## 4. Low-Level Design (LLD): Database Schemas

### 4.1 User Schema (`User.js`)
* Complete address subdocuments with regex validation for Indian 10-digit phones and 6-digit pincodes.
* Role-based access control: `CUSTOMER`, `STAFF_FULFILLMENT`, `STAFF_SUPPORT`, `SUPERADMIN`.
* Risk engine flags: `codBlocked: { type: Boolean, default: false }`.

### 4.2 Product Schema (`Product.js`)
* SKU variant matrix supporting size, color, pricing, and stock tracking.
* Dual stock tracking: `stockOnHand` (physical units) and `stockAllocated` (reserved in checkout).
* Virtual field: `availableToSell = max(0, stockOnHand - stockAllocated)`.
* Indian GST compliance: `hsnCode` and `taxRatePercent`.

### 4.3 Order Schema (`Order.js`)
* Complete financial audit snapshots (subtotal, discounts, shipping, CGST/SGST/IGST).
* State machine: `UNFULFILLED` &rarr; `PACKED` &rarr; `MANIFESTED` &rarr; `IN_TRANSIT` &rarr; `OUT_FOR_DELIVERY` &rarr; `DELIVERED` &rarr; `RTO_INITIATED` &rarr; `RETURNED` &rarr; `CANCELLED`.
* Logistics tracking: Courier name, AWB code, label URL, tracking history timeline.

---

## 5. High-Concurrency Inventory Locking Engine

### 5.1 Atomic Stock Reservation Pattern (Redis Lua)
```lua
-- KEYS[1] = "stock:sku:VAR123", KEYS[2] = "reserve:sku:VAR123"
-- ARGV[1] = requestedQty (e.g. 1)

local stock = tonumber(redis.call('get', KEYS[1]) or '0')
local reserved = tonumber(redis.call('get', KEYS[2]) or '0')
local requested = tonumber(ARGV[1])

if (stock - reserved) >= requested then
    redis.call('incrby', KEYS[2], requested)
    return 1 -- SUCCESS: Stock reserved
else
    return 0 -- REJECT: Out of stock
end
```
* Holds a temporary key `lock:{orderId}:{sku}` with a **15-minute TTL**.
* On payment success, physical stock is decremented in MongoDB and the Redis lock is removed.
* On payment failure or timeout, the Redis TTL expires and stock is released back to available inventory.

---

## 6. Razorpay End-to-End Financial Core

1. **Server-Side Price Canonicalization:** Client sends only SKUs and quantities; backend recalculates total in Paise (`INR * 100`).
2. **Order Creation:** Calls `razorpay.orders.create` with receipt order number and notes.
3. **HMAC-SHA256 Signature Verification:** Verified server-side via `crypto.createHmac('sha256', secret)`.
4. **Distributed Webhook Idempotency:** Redis `SETNX` distributed lock on `webhook:lock:{payment_id}` with 60s TTL prevents duplicate processing.
5. **Cash on Delivery (COD) Anti-Fraud Engine:**
   * Mandatory 6-digit SMS OTP verification.
   * Real-time courier pincode serviceability check.
   * Automated COD blocking for accounts with &ge; 2 previous RTOs.

---

## 7. Complete Page & View Directory

### Storefront Pages (14 Views)
1. `GET /` &mdash; Landing / Home Page
2. `GET /category/:slug` &mdash; Catalog / PLP
3. `GET /search?q=...` &mdash; Instant Search Flyout & Results
4. `GET /product/:slug` &mdash; Product Detail Page (PDP)
5. `GET /cart` &mdash; Slide-Over Cart Drawer & Page
6. `POST /checkout` &mdash; Single-Page Checkout Funnel
7. `GET /order/success/:id` &mdash; Payment Success & Receipt
8. `POST /auth/*` &mdash; Customer Authentication (OTP + Password)
9. `GET /account` &mdash; Account Dashboard
10. `GET /account/orders` &mdash; Order History
11. `GET /account/track/:id` &mdash; Live Order Tracking
12. `POST /account/returns/new` &mdash; RMA Return Request Portal
13. `GET /account/addresses` &mdash; Delivery Address Book
14. `GET /account/wishlist` &mdash; Saved Wishlist

### Superadmin Backoffice Suite (12 Modules)
1. **Executive Dashboard:** Real-time GMV, hourly velocity, stock warnings.
2. **Product Catalog:** Variant matrix generator, direct S3 media uploads.
3. **Inventory Control:** Physical Stock vs. Reserved Stock vs. ATS.
4. **Order Fulfillment:** Kanban fulfillment board, 1-click AWB generation.
5. **Post-Purchase & RMA:** Review return tickets, automated reverse courier booking.
6. **CRM & Customer 360:** Customer lifetime spend, order history, COD risk toggling.
7. **Coupon & Promotions:** Cart discount rules, flash sale countdowns.
8. **Review Moderation:** UGC moderation and verified buyer badges.
9. **Financials & Tax:** GSTR-1 compliant tax reports, invoice regeneration.
10. **Staff & RBAC:** Sub-admin accounts with role permissions.
11. **Store Settings:** Payment gateway keys, warehouse addresses, tax rates.
12. **CMS & Banners:** Hero banner slides and store promotional announcements.

---

## 8. Deployment, CI/CD & Operations

* **PM2 Cluster Config:** `deploy/ecosystem.config.js` runs across all vCPUs with zero-downtime rolling reload (`pm2 reload`).
* **S3 Direct Uploads:** Presigned URLs with 60-second expiration bypass Node.js memory buffers.
* **Disaster Recovery (DR):**
  * MongoDB Atlas PITR (RPO < 1 min, RTO < 15 min).
  * S3 Cross-Region Replication (CRR) from Mumbai to Singapore.
  * Redis automated snapshots with Multi-AZ automatic failover (< 15s).
