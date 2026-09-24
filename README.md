# FreshCart: Single-Vendor E-Commerce Platform

A production-grade, full-stack Single-Vendor E-Commerce grocery and retail platform engineered with **React (Vite) / Next.js**, **Node.js (Express)**, **MongoDB Atlas**, **Redis Caching**, and **AWS S3 Cloud Storage**, designed for deployment on **AWS EC2** behind an **Application Load Balancer (ALB)** and **Route 53**.

---

## 1. System Architecture

### Multi-Client & External Services Topology

```text
                         CLIENTS
              ┌────────────┼────────────┐
              │            │            │
           Website      Admin Panel   Mobile App
              │            │            │
              └────────────┼────────────┘
                           ▼
                    ┌─────────────┐
                    │    NGINX    │
                    │ Reverse     │
                    │ Proxy       │
                    └──────┬──────┘
                           ▼
                    ┌─────────────┐
                    │ Node.js API │
                    │ Express /   │
                    │ NestJS      │
                    └──────┬──────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
          ▼                ▼                ▼
     ┌─────────┐      ┌──────────┐    ┌────────────┐
     │ MongoDB │      │   Redis  │    │    AWS S3  │
     │         │      │          │    │            │
     │ Users   │      │ Cache    │    │ Images     │
     │ Products│      │ Sessions │    │ Videos     │
     │ Orders  │      │ Rate     │    │ Documents  │
     └─────────┘      │ Limits   │    └────────────┘
                      └──────────┘
                           │
                           ▼
                   External Services
             ┌────────────┼────────────┐
             ▼            ▼            ▼
          Payment      Shipping     Notification
          Gateway        API        Email/SMS/WA
```

### AWS Cloud Network Routing Topology

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

## 2. AWS Infrastructure Topology

| AWS Component | Service Role | Purpose & Configuration |
| :--- | :--- | :--- |
| **Route 53** | DNS Management | Resolves root and subdomains (`example.com`, `api.example.com`) to the Application Load Balancer with health checks. |
| **ALB** | Application Load Balancer | Terminates SSL/TLS (HTTPS), distributes traffic, and routes requests to the EC2 target group on port 80/443. |
| **EC2** | Virtual Compute Instance | Hosts the application stack with Ubuntu LTS: **Nginx** (reverse proxy), **PM2** (process manager), **Node.js Express API**, and frontend server. |
| **Nginx** | Web Server & Reverse Proxy | Routes `/api/*` to Node.js (port 3000), serves static frontend assets, enforces gzip compression, and manages HTTP/2. |
| **PM2** | Process Manager | Manages Node.js cluster processes (`instances: 'max'`), zero-downtime reloads, and automatic crash recovery. |
| **Redis** | In-Memory Cache & Session Store | Caches catalog queries (`search`, `categories`, `banners`), user auth sessions, and cart locks. |
| **S3** | Object Storage | Stores product images, video assets, category icons, and hero promotional banners. |
| **MongoDB Atlas** | Managed Cloud Database | Multi-region production replica set for ACID transactional data (Products, Orders, Users, Coupons, Reviews). |

```text
AWS
│
├── EC2
│   ├── Next.js
│   ├── Node.js
│   ├── Nginx
│   └── PM2
│
├── S3
│   └── Images / Videos
│
└── MongoDB Atlas
    └── Production Database
```

### 2.1 High-Concurrency Sizing & Scale (5,000 Concurrent Users)

| Metric / Layer | Specification for 5,000 Simultaneous Shoppers | Technical Mechanism |
| :--- | :--- | :--- |
| **Peak Throughput** | **1,500 – 2,500 Requests Per Second (RPS)** | Sustained dynamic JSON API requests across EC2 cluster. |
| **Static Offloading** | **AWS CloudFront CDN** | 95%+ of static traffic (JS/CSS chunks, WebP product images, banners) served at edge with 0% EC2 load. |
| **Read Caching** | **Redis (`cache.m6g.large`)** | 85%+ read traffic (`/catalog/search`, `/categories`, `/banners`) served from memory in **< 1ms**. |
| **Database Pool** | **MongoDB Atlas M30/M40** | Connection pool: `maxPoolSize: 100`, `minPoolSize: 25` pre-warmed connections per worker. |
| **Reverse Proxy** | **Nginx on Ubuntu 22.04 LTS** | `worker_connections 10240;`, `keepalive 256;`, `fs.file-max 2097152;`, `tcp_tw_reuse = 1`. |
| **App Clustering** | **Node.js PM2 Cluster** | `instances: 'max'`, `--max-old-space-size=2048`, `UV_THREADPOOL_SIZE=64`. |
| **Concurrency Holds**| **MongoDB 15-Min TTL Holds** | Concurrency reservation prevents overselling during high-traffic flash sales. |

---

## 3. S3 Bucket Object Hierarchy

```text
S3 Bucket (freshcart-assets)
│
├── products/
│   ├── product-001/
│   │   ├── main.webp
│   │   ├── 1.webp
│   │   └── 2.webp
│   │
│   └── product-002/
│       ├── main.webp
│       └── 1.webp
│
├── categories/
│   ├── staples-and-grains.webp
│   ├── edible-oils.webp
│   └── dairy-breakfast.webp
│
├── banners/
│   ├── hero-organic-fruits.webp
│   └── promo-weekend-sale.webp
│
└── uploads/
    └── temp/
```

---

## 4. Database Schema Structure (MongoDB Collections)

```text
MongoDB (shop)
│
├── users
│   ├── _id (ObjectId)
│   ├── fullName (String)
│   ├── email (String, unique)
│   ├── phone (String, unique)
│   ├── password (String, bcrypt hash)
│   ├── role (String: 'customer' | 'admin')
│   ├── isActive (Boolean)
│   ├── resetOtp (String)
│   ├── resetOtpExpires (Date)
│   ├── lastLoginAt (Date)
│   └── timestamps
│
├── products
│   ├── _id (ObjectId)
│   ├── title (String, indexed)
│   ├── slug (String, unique, indexed)
│   ├── brand (String)
│   ├── category (ObjectId -> categories)
│   ├── categoryName (String)
│   ├── description (String)
│   ├── basePrice (Number)
│   ├── isPublished (Boolean)
│   ├── images [
│   │   ├── imageUrl (String)
│   │   ├── altText (String)
│   │   ├── displayOrder (Number)
│   │   └── isPrimary (Boolean)
│   │ ]
│   ├── variants [
│   │   ├── sku (String, unique, indexed)
│   │   ├── barcode (String)
│   │   ├── price (Number)
│   │   ├── compareAtPrice (Number)
│   │   ├── costPrice (Number)
│   │   ├── stockQuantity (Number)
│   │   ├── safetyStock (Number)
│   │   ├── attributes (Mixed: { size, weight, color })
│   │   └── isActive (Boolean)
│   │ ]
│   └── timestamps
│
├── categories
│   ├── _id (ObjectId)
│   ├── name (String)
│   ├── slug (String, unique)
│   ├── parentCategory (ObjectId)
│   ├── imageUrl (String)
│   ├── displayOrder (Number)
│   └── isActive (Boolean)
│
├── carts
│   ├── _id (ObjectId)
│   ├── userId (ObjectId -> users)
│   ├── sessionId (String, indexed)
│   ├── items [
│   │   ├── variantId (ObjectId)
│   │   ├── quantity (Number)
│   │   └── addedAt (Date)
│   │ ]
│   └── updatedAt (Date)
│
├── orders
│   ├── _id (ObjectId)
│   ├── orderNumber (String, unique: ORD-YYYYMMDD-XXXX)
│   ├── customerId (ObjectId -> users)
│   ├── customerName (String)
│   ├── phoneNumber (String)
│   ├── email (String)
│   ├── address (String)
│   ├── products [
│   │   ├── productName (String)
│   │   ├── quantity (Number)
│   │   └── price (Number)
│   │ ]
│   ├── items [
│   │   ├── skuSnapshot (String)
│   │   ├── productTitleSnapshot (String)
│   │   ├── unitPriceSnapshot (Number)
│   │   ├── quantity (Number)
│   │   └── totalLinePrice (Number)
│   │ ]
│   ├── subtotal (Number)
│   ├── discountAmount (Number)
│   ├── couponCode (String)
│   ├── shippingFee (Number)
│   ├── totalAmount (Number)
│   ├── paymentMethod (String: 'cod' | 'upi' | 'card')
│   ├── paymentStatus (String: 'unpaid' | 'paid' | 'refunded')
│   ├── status (String: 'pending' | 'packed' | 'delivered' | 'cancelled')
│   └── timestamps
│
├── payments
│   ├── _id (ObjectId)
│   ├── orderId (ObjectId -> orders)
│   ├── transactionId (String)
│   ├── paymentMethod (String)
│   ├── amount (Number)
│   ├── status (String: 'initiated' | 'completed' | 'failed')
│   └── timestamps
│
├── reviews
│   ├── _id (ObjectId)
│   ├── productId (ObjectId -> products)
│   ├── userId (ObjectId -> users)
│   ├── userName (String)
│   ├── rating (Number: 1 to 5)
│   ├── title (String)
│   ├── comment (String)
│   ├── verifiedPurchase (Boolean)
│   ├── isApproved (Boolean)
│   ├── status (String: 'approved' | 'rejected' | 'pending')
│   └── timestamps
│
├── coupons
│   ├── _id (ObjectId)
│   ├── code (String, uppercase, unique)
│   ├── discountType (String: 'percentage' | 'fixed')
│   ├── discountValue (Number)
│   ├── minOrderAmount (Number)
│   ├── maxDiscountAmount (Number)
│   ├── usageLimit (Number)
│   ├── usedCount (Number)
│   ├── expiryDate (Date)
│   ├── isActive (Boolean)
│   └── timestamps
│
├── wishlists
│   ├── _id (ObjectId)
│   ├── userId (ObjectId -> users, unique)
│   ├── products [ObjectId -> products]
│   └── timestamps
│
└── addresses
    ├── _id (ObjectId)
    ├── userId (ObjectId -> users)
    ├── tag (String: 'Home' | 'Work' | 'Other')
    ├── recipientName (String)
    ├── phoneNumber (String)
    ├── streetAddress (String)
    ├── landmark (String)
    ├── city (String)
    ├── state (String)
    ├── postalCode (String)
    ├── isDefault (Boolean)
    └── timestamps
```

---

## 5. Project Directory Structure

```text
Shop/
├── .gitignore                    # Root gitignore (excludes node_modules/, .env, build artifacts)
├── README.md                     # Platform architecture & exhaustive documentation
├── package.json                  # Root monorepo build & deployment automation
│
├── backend/                      # Node.js & Express REST API Server
│   ├── config/
│   │   ├── db.js                 # MongoDB connection with retry & connection pooling (pool: 10-50)
│   │   └── redis.js              # Redis caching client with in-memory fallback
│   ├── controllers/              # 10 Domain Services & Feature Controllers
│   │   ├── account/
│   │   │   └── accountController.js  # Customer Profile, Addresses, Wallet, Wishlist
│   │   ├── admin/
│   │   │   └── adminController.js    # Super Admin metrics, users, orders, overrides
│   │   ├── auth/
│   │   │   └── authController.js     # JWT auth, Google OAuth, Refresh tokens, OTP reset
│   │   ├── catalog/
│   │   │   └── catalogController.js  # Faceted product search, categories, CSV ingestion
│   │   ├── inventory/
│   │   │   └── inventoryController.js# Low stock threshold alerts & inventory audits
│   │   ├── logistics/
│   │   │   └── logisticsController.js# Delivery fleet, serviceability & live tracking
│   │   ├── marketing/
│   │   │   ├── bannerController.js   # Hero carousel promo banners
│   │   │   └── couponController.js   # Discount vouchers & validation engine
│   │   ├── media/
│   │   │   └── uploadController.js   # AWS S3 media uploads & Presigned URLs
│   │   ├── order/
│   │   │   ├── cartController.js     # Server-side cart sync & stock reservation
│   │   │   ├── checkoutController.js # Canonical pricing, Razorpay, COD anti-fraud
│   │   │   └── orderController.js    # Order lifecycle, cancellations, tracking
│   │   └── review/
│   │       └── reviewController.js   # Product ratings, reviews & moderation
│   ├── middleware/
│   │   └── auth.js               # JWT bearer token validator & RBAC guard
│   ├── migrations/               # Database migrations framework
│   │   ├── 001_create_core_indexes.js
│   │   ├── 002_seed_indian_wholesale_taxonomy.js
│   │   └── 003_seed_superadmin_user.js
│   ├── models/                   # Domain-Driven Mongoose ODM Schemas
│   │   ├── account/
│   │   │   ├── Address.js        # Multi-tag shipping address book
│   │   │   └── Wishlist.js       # Customer product wishlists
│   │   ├── auth/
│   │   │   └── User.js           # Unified customer & admin schema, bcrypt hashes, roles
│   │   ├── catalog/
│   │   │   ├── Category.js       # Taxonomy categories & parent hierarchies
│   │   │   └── Product.js        # Kirana products, multi-variants & inventory
│   │   ├── marketing/
│   │   │   ├── Banner.js         # Promotional hero banners & sliders
│   │   │   └── Coupon.js         # Discount vouchers, percentage & fixed caps
│   │   ├── order/
│   │   │   ├── Cart.js           # Server-side guest & user carts
│   │   │   ├── Order.js          # Canonical orders, tax breakdown & milestone events
│   │   │   ├── Payment.js        # Gateway transactions & idempotency ledger
│   │   │   └── StockHold.js      # 15-min TTL concurrency stock reservations
│   │   ├── review/
│   │   │   └── Review.js         # Verified purchase product ratings & reviews
│   │   └── system/
│   │       └── Migration.js      # Schema & taxonomy migration ledger
│   ├── routes/                   # 10 Domain API Route Modules
│   │   ├── account/
│   │   │   └── accountRoutes.js  # Customer profile, addresses, wallet & wishlist
│   │   ├── admin/
│   │   │   └── adminRoutes.js    # Super Admin metrics, users, order overrides
│   │   ├── auth/
│   │   │   └── authRoutes.js     # Register, login, Google OAuth, tokens, OTP
│   │   ├── catalog/
│   │   │   └── catalogRoutes.js  # Faceted search, categories, CSV bulk upload
│   │   ├── inventory/
│   │   │   └── inventoryRoutes.js# Low stock threshold alerts
│   │   ├── logistics/
│   │   │   └── logisticsRoutes.js# Fleet dispatch, pincode serviceability, tracking
│   │   ├── marketing/
│   │   │   ├── bannerRoutes.js   # Hero carousel banner management
│   │   │   └── couponRoutes.js   # Coupon validation & management
│   │   ├── media/
│   │   │   └── uploadRoutes.js   # S3 media uploads & presigned URLs
│   │   ├── order/
│   │   │   ├── cartRoutes.js     # Shopping cart synchronization
│   │   │   ├── checkoutRoutes.js # Checkout, Razorpay payments, COD placement
│   │   │   ├── orderRoutes.js    # Order lifecycle & cancellations
│   │   │   └── quickCommerceRoutes.js # 10-minute ultra-fast delivery routes
│   │   └── review/
│   │       └── reviewRoutes.js   # Customer ratings, reviews & moderation
│   ├── scripts/                  # Data migration, seeding & verification CLI
│   │   ├── auditDatabase.js      # Live MongoDB collection document auditor
│   │   ├── migrate.js            # Migration runner CLI
│   │   ├── placeRealOrder.js     # Real order test generator
│   │   ├── restockAll.js         # Variant inventory bulk restocker
│   │   ├── seedCouponsAndBanners.js # Initial seed for vouchers & banners
│   │   ├── seedTaxonomy.js       # Kirana & wholesale catalog seeder
│   │   ├── testMetrics.js        # Super Admin API analytics tester
│   │   ├── testOtpReset.js       # OTP reset test suite
│   │   └── testPhase1.js         # End-to-end database, auth & RBAC test suite
│   ├── services/                 # Core Business Logic & Cloud Services
│   │   ├── csvIngestionService.js# Asynchronous chunked CSV bulk catalog parser
│   │   ├── inventoryService.js   # 15-min stock holds, alerts & concurrency checks
│   │   ├── paymentStrategy.js    # Payment provider interface & idempotency ledger
│   │   ├── redisService.js       # Redis cache & session provider
│   │   ├── s3Service.js          # AWS S3 file upload & storage client
│   │   ├── searchService.js      # Faceted catalog text search engine
│   │   └── tokenService.js       # JWT creation & token validation
│   ├── uploads/                  # Local fallback media storage
│   ├── .env                      # Backend environment configurations
│   ├── Dockerfile                # Production container specification
│   ├── index.js                  # Main server entry point
│   └── package.json
│
├── client/                       # Storefront & Admin Frontend (React + Vite + Tailwind)
│   ├── public/
│   │   ├── manifest.json
│   │   └── vite.svg
│   ├── src/
│   │   ├── assets/               # Static vector icons
│   │   ├── components/           # 8 Active Reusable UI Components
│   │   │   ├── CartDrawer.jsx    # Slide-over cart with live coupon discounts
│   │   │   ├── CategoryRail.jsx  # Horizontal category selector
│   │   │   ├── CheckoutModal.jsx # Multi-step checkout with address & payment
│   │   │   ├── FreshCartFooter.jsx # Service pillars, sitemaps & payment badges
│   │   │   ├── FreshCartNavbar.jsx # Header with autocomplete search & badges
│   │   │   ├── ProductCard.jsx   # Variant selector & quantity stepper
│   │   │   ├── ProtectedRoute.jsx# Token & Super Admin route protection
│   │   │   └── QuickHeader.jsx   # Lightweight quick commerce navigation bar
│   │   ├── context/
│   │   │   └── CartContext.jsx   # Global cart state, totals, and coupon math
│   │   ├── pages/                # 9 Active Views
│   │   │   ├── AdminPanel.jsx    # Super Admin Dashboard (Charts, Orders, Inventory, Coupons, Reviews, Banners)
│   │   │   ├── CustomerAccount.jsx # Customer profile, addresses, orders & wishlist
│   │   │   ├── CustomerForm.jsx  # Quick grocery catalog view
│   │   │   ├── Home.jsx          # FreshCart Storefront homepage
│   │   │   ├── Login.jsx         # OWASP-hardened authentication portal
│   │   │   ├── ProductDetail.jsx # Rich PDP (Gallery, variants, reviews)
│   │   │   ├── Register.jsx      # Customer registration page
│   │   │   ├── Shop.jsx          # Catalog browsing with faceted filters
│   │   │   └── UserOrders.jsx    # Live delivery timeline & order tracking
│   │   ├── App.jsx               # Client router configuration
│   │   ├── config.js             # API base URL configuration
│   │   ├── index.css             # TailwindCSS & theme design tokens
│   │   └── main.jsx
│   ├── .env                      # Vite client environment variables
│   ├── index.html                # HTML5 root with FreshCart SEO & meta tags
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
│
└── deploy/                       # AWS Production Deployment Configurations
    ├── AWS_DEPLOYMENT_GUIDE.md   # Step-by-step AWS EC2, S3, ALB, Nginx runbook
    ├── docker-compose.prod.yml   # Multi-container production stack
    ├── ecosystem.config.js       # PM2 cluster configuration
    └── nginx.conf                # Nginx reverse proxy & SSL config
```

---

## 6. Frontend Storefront & Admin Route Map

| Route | Component | Access | Description |
| :--- | :--- | :---: | :--- |
| `/` | `<Home />` | Public | Storefront homepage with hero carousel, categories, best sellers, daily deals, and testimonials. |
| `/shop` | `<Shop />` | Public | Full catalog browser with category facets, price slider, in-stock filters, and sorting. |
| `/product/:slug` | `<ProductDetail />` | Public | Product page with multi-image gallery, variant pills, stock tracker, Buy Now, and reviews. |
| `/account` | `<CustomerAccount />` | Customer | Account management: Profile edit, saved address book, order history, and wishlist. |
| `/orders` | `<CustomerAccount />` | Customer | Live tracking and status timeline for customer orders. |
| `/track-order` | `<UserOrders />` | Public / Customer | Live quick grocery order status timeline and real-time delivery step tracker. |
| `/login` | `<Login />` | Public | OWASP-compliant unified login for Customers & Super Admin with OTP password reset. |
| `/register` | `<Register />` | Public | Customer account sign-up. |
| `/admin` | `<AdminPanel />` | Super Admin | Super Admin dashboard with revenue charts, inventory, orders, coupons, reviews, banners, and analytics. |
| `/legacy` | `<CustomerForm />` | Public | Quick grocery catalog storefront. |

---

## 7. Exhaustive REST API Specification

### Authentication & Authorization Overview
FreshCart uses standard JWT (JSON Web Token) bearer authentication for securing customer and administrative endpoints.

| Access Scope | Description | Required Header |
| :--- | :--- | :--- |
| **Public** | Accessible by any anonymous guest, crawler, or browser without authentication. | None |
| **Guest / Session** | Anonymous shopping cart & hold reservation identified via persistent session token. | `x-session-token: sess_<uuid>` (or query/body) |
| **Customer (JWT)** | Authenticated customer account with standard privileges (addresses, personal orders, wishlist). | `Authorization: Bearer <jwt_token>` |
| **Super Admin** | Administrative control with full read/write privileges (`role: 'admin'`). | `Authorization: Bearer <admin_jwt_token>` |

---

### 7.1 System & Health (`/api/health`)

#### `GET /api/health`
- **Scope**: Public
- **Description**: Heartbeat check returning service operational status, timestamp, and active database driver.
- **Headers**: None
- **Query / Path Params**: None
- **Request Body**: None
- **Success Response (`200 OK`)**:
  ```json
  {
    "status": "online",
    "timestamp": "2026-09-07T02:40:00.000Z",
    "service": "Single-Vendor Scalable E-Commerce Backend",
    "database": "MongoDB"
  }
  ```
- **Error Codes**: `500 Internal Server Error`

---

### 7.2 Authentication & Identity (`/api/auth`)

#### `POST /api/auth/register`
- **Scope**: Public
- **Description**: Registers a new customer account with bcrypt password hashing (12 salt rounds) and issues an initial JWT token.
- **Headers**: `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "fullName": "Subham Srivastava",       // string, required, min 2 chars
    "phone": "9999999999",                 // string, required, 10-digit format (unique)
    "email": "subham@example.com",         // string, optional, valid email format
    "password": "Password@123"             // string, required, min 6 chars
  }
  ```
- **Success Response (`201 Created`)**:
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "66db8f6d89324501a41a4570",
      "fullName": "Subham Srivastava",
      "phone": "9999999999",
      "email": "subham@example.com",
      "role": "customer"
    }
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: `{ "error": "Full name, 10-digit phone, and password (min 6 chars) are required" }`
  - `409 Conflict`: `{ "error": "An account with this phone number already exists" }`

---

#### `POST /api/auth/login`
- **Scope**: Public
- **Description**: Authenticates either Customer or Super Admin via phone number and password.
- **Headers**: `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "phone": "9161955178",                 // string, required (Customer or Admin phone)
    "password": "admin"                    // string, required
  }
  ```
- **Success Response (`200 OK`)**:
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "66db8f6d89324501a41a4561",
      "fullName": "Harsh Srivastava (Super Admin)",
      "phone": "9161955178",
      "email": "admin@freshcart.com",
      "role": "admin"
    }
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: `{ "error": "Phone number and password are required" }`
  - `401 Unauthorized`: `{ "error": "Invalid phone number or password" }`
  - `403 Forbidden`: `{ "error": "Your account has been deactivated. Please contact support." }`

---

#### `GET /api/auth/me`
- **Scope**: Customer / Super Admin
- **Description**: Verifies the current JWT bearer token, confirms the user still exists and is active, and returns safe profile details.
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**: None
- **Success Response (`200 OK`)**:
  ```json
  {
    "user": {
      "id": "66db8f6d89324501a41a4561",
      "fullName": "Harsh Srivastava (Super Admin)",
      "phone": "9161955178",
      "email": "admin@freshcart.com",
      "role": "admin"
    }
  }
  ```
- **Error Responses**:
  - `401 Unauthorized`: `{ "error": "Authentication required: No Authorization header provided" }`
  - `401 Unauthorized`: `{ "error": "Token expired: Please sign in again" }`

---

#### `POST /api/auth/change-password`
- **Scope**: Customer / Super Admin
- **Description**: Modifies the user's password after verifying their current password.
- **Headers**: `Authorization: Bearer <token>`, `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "oldPassword": "admin",                // string, required
    "newPassword": "NewAdminPassword@2026" // string, required, min 6 chars
  }
  ```
- **Success Response (`200 OK`)**:
  ```json
  {
    "message": "Password changed successfully"
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: `{ "error": "Old and new passwords are required" }`
  - `401 Unauthorized`: `{ "error": "Current password does not match" }`

---

#### `POST /api/auth/send-otp`
- **Scope**: Public
- **Description**: Initiates password recovery. In production, dispatches an SMS OTP; in development/staging, prints the 6-digit OTP code to console and caches it in-memory for 10 minutes.
- **Headers**: `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "phone": "9161955178"                  // string, required
  }
  ```
- **Success Response (`200 OK`)**:
  ```json
  {
    "message": "OTP sent successfully to 9161955178",
    "expiresIn": "10 minutes"
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: `{ "error": "Phone number is required" }`
  - `404 Not Found`: `{ "error": "No account associated with this phone number" }`

---

#### `POST /api/auth/reset-password-with-otp`
- **Scope**: Public
- **Description**: Validates the 6-digit OTP and applies the new password to the user account.
- **Headers**: `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "phone": "9161955178",                 // string, required
    "otp": "481902",                       // string, required, 6 digits
    "newPassword": "FreshCartNewPass2026!" // string, required, min 6 chars
  }
  ```
- **Success Response (`200 OK`)**:
  ```json
  {
    "message": "Password has been successfully reset. You can now log in with your new password."
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: `{ "error": "Invalid or expired OTP" }`
  - `404 Not Found`: `{ "error": "User account not found" }`

---

### 7.3 Product Catalog & Categories (`/api/catalog` & `/api/products`)

#### `GET /api/catalog/search`
- **Scope**: Public
- **Description**: High-performance full-text search with dynamic multi-faceted aggregation (categories, brands, price range) and pagination.
- **Headers**: None
- **Query Parameters**:
  - `q` (string, optional): Full-text search term across title, description, and keywords.
  - `category` (string, optional): Category slug or ID filter (e.g. `fresh-vegetables`).
  - `brand` (string, optional): Filter by brand name.
  - `min_price` (number, optional): Minimum price threshold.
  - `max_price` (number, optional): Maximum price threshold.
  - `sort` (string, optional): `price_asc`, `price_desc`, `newest`, `relevance` (default).
  - `page` (number, optional, default: 1): Page offset.
  - `limit` (number, optional, default: 20): Products per page.
- **Success Response (`200 OK`)**:
  ```json
  {
    "items": [
      {
        "_id": "66db8f6d89324501a41a4501",
        "title": "Fresh Organic Farm Potatoes (Aloo)",
        "slug": "fresh-organic-potatoes-aloo",
        "brand": "FarmFresh Organics",
        "basePrice": 35.00,
        "categoryName": "Fresh Vegetables",
        "images": [{ "imageUrl": "https://images.unsplash.com/...", "isPrimary": true }],
        "variants": [
          {
            "_id": "66db8f6d89324501a41a4511",
            "sku": "VEG-POT-1KG",
            "price": 35.00,
            "stockQuantity": 100,
            "attributes": { "weight": "1 kg" }
          }
        ]
      }
    ],
    "facets": {
      "categories": [{ "slug": "fresh-vegetables", "name": "Fresh Vegetables", "count": 12 }],
      "brands": [{ "brand": "FarmFresh Organics", "count": 8 }],
      "priceRange": { "min": 20.00, "max": 1250.00 }
    },
    "pagination": {
      "total": 45,
      "page": 1,
      "limit": 20,
      "pages": 3
    }
  }
  ```

---

#### `GET /api/catalog/categories`
- **Scope**: Public
- **Description**: Returns hierarchical category tree (parent-child category structure) for navigation menus and storefront facets.
- **Headers**: None
- **Success Response (`200 OK`)**:
  ```json
  [
    {
      "_id": "66db8f6d89324501a41a4401",
      "categoryId": 1,
      "name": "Dairy, Bread & Eggs",
      "slug": "dairy-bread-and-eggs",
      "description": "Fresh milk, paneer, eggs, butter, yogurt & breads",
      "parentId": null,
      "isActive": true
    }
  ]
  ```

---

#### `GET /api/catalog/products/:idOrSlug`
- **Scope**: Public
- **Description**: Fetches single product details with all variants, dynamic inventory calculation, and image gallery.
- **Path Parameter**: `idOrSlug` (MongoDB ObjectId or unique URL slug).
- **Success Response (`200 OK`)**:
  ```json
  {
    "_id": "66db8f6d89324501a41a4501",
    "product_id": "66db8f6d89324501a41a4501",
    "title": "Fresh Organic Farm Potatoes (Aloo)",
    "slug": "fresh-organic-potatoes-aloo",
    "description": "Hand-picked, naturally grown farm potatoes.",
    "brand": "FarmFresh Organics",
    "basePrice": 35.00,
    "variants": [
      {
        "variant_id": "66db8f6d89324501a41a4511",
        "sku": "VEG-POT-1KG",
        "price": 35.00,
        "stockQuantity": 100,
        "available_stock": 100,
        "attributes": { "weight": "1 kg" }
      }
    ],
    "images": [
      { "imageUrl": "https://images.unsplash.com/...", "isPrimary": true }
    ]
  }
  ```
- **Error Responses**:
  - `404 Not Found`: `{ "error": "Product not found" }`

---

#### `GET /api/catalog/variants/:variantId/stock`
- **Scope**: Public
- **Description**: Checks real-time stock levels for a specific SKU variant, taking active reservation holds into account.
- **Path Parameter**: `variantId` (MongoDB ObjectId).
- **Success Response (`200 OK`)**:
  ```json
  {
    "variant_id": "66db8f6d89324501a41a4511",
    "sku": "VEG-POT-1KG",
    "physical_stock": 100,
    "available_stock": 100,
    "is_in_stock": true
  }
  ```
- **Error Responses**:
  - `404 Not Found`: `{ "error": "Variant not found" }`

---

#### `POST /api/catalog/categories`
- **Scope**: Super Admin
- **Description**: Creates a new category node in the catalog hierarchy.
- **Headers**: `Authorization: Bearer <admin_token>`, `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "name": "Organic Pulses & Lentils",   // string, required
    "slug": "organic-pulses-lentils",      // string, optional (auto-generated if omitted)
    "description": "Unpolished whole dals and pulses",
    "parentId": 2                          // number, optional parent category ID
  }
  ```
- **Success Response (`201 Created`)**: Returns newly created Category document.
- **Error Responses**:
  - `400 Bad Request`: `{ "error": "Category name is required" }`
  - `403 Forbidden`: Super Admin privilege required.

---

#### `PUT /api/catalog/categories/:id`
- **Scope**: Super Admin
- **Description**: Modifies category name, description, or active status.
- **Path Parameter**: `id` (Category ObjectId).
- **Headers**: `Authorization: Bearer <admin_token>`, `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "name": "Organic Pulses, Dals & Lentils",
    "isActive": true
  }
  ```
- **Success Response (`200 OK`)**: Returns updated Category document.
- **Error Responses**: `404 Not Found`

---

#### `DELETE /api/catalog/categories/:id`
- **Scope**: Super Admin
- **Description**: Removes category from the database.
- **Path Parameter**: `id` (Category ObjectId).
- **Success Response (`200 OK`)**: `{ "message": "Category deleted successfully" }`

---

#### `POST /api/catalog/products`
- **Scope**: Super Admin
- **Description**: Creates a new product with multiple variants and gallery images.
- **Headers**: `Authorization: Bearer <admin_token>`, `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "title": "Fresh Hybrid Tomatoes (Tamatar)",
    "slug": "fresh-hybrid-tomatoes",
    "description": "Vine-ripened red juicy tomatoes.",
    "brand": "FarmFresh",
    "base_price": 40.00,
    "category_id": "66db8f6d89324501a41a4401",
    "category_name": "Fresh Vegetables",
    "variants": [
      {
        "sku": "VEG-TOM-500G",
        "price": 22.00,
        "stock_quantity": 80,
        "safety_stock": 10,
        "attributes": { "weight": "500g" }
      },
      {
        "sku": "VEG-TOM-1KG",
        "price": 40.00,
        "stock_quantity": 120,
        "safety_stock": 15,
        "attributes": { "weight": "1kg" }
      }
    ],
    "images": [
      "https://images.unsplash.com/photo-1592924357228-91a4daadcfea"
    ]
  }
  ```
- **Success Response (`201 Created`)**: Returns newly created Product document with nested variants.

---

#### `PUT /api/catalog/products/:id`
- **Scope**: Super Admin
- **Description**: Updates product metadata, pricing, or visibility.
- **Path Parameter**: `id` (Product ObjectId).
- **Headers**: `Authorization: Bearer <admin_token>`, `Content-Type: application/json`
- **Request Body**: Any Product fields to modify.
- **Success Response (`200 OK`)**: Returns updated Product document.

---

#### `DELETE /api/catalog/products/:id`
- **Scope**: Super Admin
- **Description**: Deletes a product and its associated variants from MongoDB.
- **Path Parameter**: `id` (Product ObjectId).
- **Success Response (`200 OK`)**: `{ "message": "Product deleted successfully" }`

---

#### `POST /api/catalog/products/:id/variants`
- **Scope**: Super Admin
- **Description**: Appends a new SKU variant to an existing product document.
- **Path Parameter**: `id` (Product ObjectId).
- **Headers**: `Authorization: Bearer <admin_token>`, `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "sku": "VEG-TOM-5KG",
    "barcode": "8901234567890",
    "price": 180.00,
    "compare_at_price": 200.00,
    "stock_quantity": 40,
    "safety_stock": 5,
    "attributes": { "weight": "5 kg crate" }
  }
  ```
- **Success Response (`201 Created`)**: Returns updated Product document.

---

#### `POST /api/catalog/products/:id/images`
- **Scope**: Super Admin
- **Description**: Adds an image asset link to the product gallery.
- **Path Parameter**: `id` (Product ObjectId).
- **Headers**: `Authorization: Bearer <admin_token>`, `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "image_url": "https://s3.ap-south-1.amazonaws.com/freshcart-production-assets/products/tomato-box.jpg",
    "alt_text": "Crate of ripe red tomatoes",
    "is_primary": false
  }
  ```
- **Success Response (`201 Created`)**: Returns array of product gallery images.

---

#### `PATCH /api/catalog/variants/:variantId/stock`
- **Scope**: Super Admin
- **Description**: Quick inventory restock adjustment for a specific variant SKU.
- **Path Parameter**: `variantId` (Variant ObjectId).
- **Headers**: `Authorization: Bearer <admin_token>`, `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "stockQuantity": 150                   // number, required, >= 0
  }
  ```
- **Success Response (`200 OK`)**:
  ```json
  {
    "message": "Stock updated successfully",
    "product": { /* updated product document */ }
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: `{ "error": "Valid stock quantity required" }`
  - `404 Not Found`: `{ "error": "Variant not found" }`

---

#### `POST /api/catalog/bulk-upload`
- **Scope**: Super Admin
- **Description**: Initiates asynchronous CSV catalog ingestion. Accepts multi-part CSV file, validates rows, generates job ticket, and streams writes in chunks to prevent memory bloat.
- **Headers**: `Authorization: Bearer <admin_token>`, `Content-Type: multipart/form-data`
- **Form Data**: `file` (.csv file attachment)
- **Success Response (`202 Accepted`)**:
  ```json
  {
    "message": "Bulk ingestion job accepted and queued for processing",
    "jobId": "job_1788726589123",
    "status": "processing"
  }
  ```

---

#### `GET /api/catalog/bulk-upload/:jobId`
- **Scope**: Super Admin
- **Description**: Polls status, processed row counter, errors, and completion of a bulk CSV ingestion job.
- **Path Parameter**: `jobId` (String).
- **Success Response (`200 OK`)**:
  ```json
  {
    "jobId": "job_1788726589123",
    "status": "completed",
    "processedRows": 150,
    "successfulInserts": 148,
    "failedRows": 2,
    "errors": [
      { "row": 14, "sku": "VEG-INVALID", "error": "Duplicate SKU detected" }
    ]
  }
  ```

---

### 7.4 Session & Customer Shopping Cart (`/api/cart`)

#### `GET /api/cart`
- **Scope**: Guest / Customer
- **Description**: Retrieves active shopping cart contents, computes subtotal and line-item totals. Resolves user from JWT header OR anonymous session from `x-session-token` header.
- **Headers**: `Authorization: Bearer <token>` (optional) OR `x-session-token: sess_<uuid>` (optional)
- **Success Response (`200 OK`)**:
  ```json
  {
    "cart_id": "66db8f6d89324501a41a4601",
    "session_token": "sess_8f21e51b-6cb2-47c3-9eb1-68be54848520",
    "user_id": null,
    "items_count": 2,
    "subtotal": 135.00,
    "items": [
      {
        "cart_item_id": "66db8f6d89324501a41a4611",
        "variant_id": "66db8f6d89324501a41a4511",
        "product_id": "66db8f6d89324501a41a4501",
        "product_title": "Fresh Organic Farm Potatoes (Aloo)",
        "sku": "VEG-POT-1KG",
        "price": 35.00,
        "quantity": 2,
        "line_subtotal": 70.00,
        "attributes": { "weight": "1 kg" }
      }
    ]
  }
  ```

---

#### `POST /api/cart/items`
- **Scope**: Guest / Customer
- **Description**: Adds product variant to cart or increments quantity if already present. Verifies stock availability before adding.
- **Headers**: `x-session-token: sess_<uuid>` (optional), `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "variant_id": "66db8f6d89324501a41a4511", // string, required (Variant ObjectId)
    "quantity": 2                             // number, required, >= 1
  }
  ```
- **Success Response (`200 OK`)**: Returns updated cart with all line items and subtotal.
- **Error Responses**:
  - `400 Bad Request`: `{ "error": "Insufficient stock for requested quantity" }`
  - `404 Not Found`: `{ "error": "Variant not found" }`

---

#### `PUT /api/cart/items/:id`
- **Scope**: Guest / Customer
- **Description**: Updates quantity for a specific line item in the cart. If `quantity <= 0`, item is automatically removed.
- **Path Parameter**: `id` (Cart item ObjectId).
- **Request Body**:
  ```json
  {
    "quantity": 3                             // number, required
  }
  ```
- **Success Response (`200 OK`)**: Returns updated cart.

---

#### `DELETE /api/cart/items/:id`
- **Scope**: Guest / Customer
- **Description**: Removes an item from the cart.
- **Path Parameter**: `id` (Cart item ObjectId).
- **Success Response (`200 OK`)**: Returns updated cart.

---

#### `DELETE /api/cart`
- **Scope**: Guest / Customer
- **Description**: Empties all items from the current active cart.
- **Success Response (`200 OK`)**: `{ "message": "Cart cleared successfully" }`

---

### 7.5 Concurrency Hold & Idempotent Checkout (`/api/checkout`)

#### `POST /api/checkout/reserve`
- **Scope**: Guest / Customer
- **Description**: Acquires a temporary **15-minute stock hold** in MongoDB using TTL index. Prevents race conditions during high-traffic flash sales by atomically reserving quantities before payment.
- **Headers**: `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "session_token": "sess_8f21e51b-6cb2-47c3-9eb1-68be54848520",
    "items": [
      {
        "variant_id": "66db8f6d89324501a41a4511",
        "quantity": 2
      }
    ]
  }
  ```
- **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "15-minute inventory hold acquired successfully",
    "holds": [
      { "variantId": "66db8f6d89324501a41a4511", "heldQuantity": 2, "expiresAt": "2026-09-07T03:00:00.000Z" }
    ]
  }
  ```
- **Error Responses**:
  - `409 Conflict`: `{ "error": "Inventory hold failed due to concurrent demand or low stock" }`

---

#### `POST /api/checkout/order`
- **Scope**: Guest / Customer
- **Description**: Creates a pending order document with immutable price/SKU/title snapshots so future catalog edits never alter historical invoices.
- **Headers**: `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "customer_name": "Subham Srivastava",
    "phone_number": "9999999999",
    "email": "subham@example.com",
    "shipping_address": {
      "address": "Flat 402, Green Valley Apartments, Gomti Nagar",
      "city": "Lucknow",
      "state": "Uttar Pradesh",
      "postalCode": "226010"
    },
    "items": [
      { "variant_id": "66db8f6d89324501a41a4511", "quantity": 2 }
    ]
  }
  ```
- **Success Response (`201 Created`)**: Returns newly created pending Order document with order number `ORD-YYYYMMDD-XXXX`.

---

#### `POST /api/checkout/pay`
- **Scope**: Guest / Customer
- **Description**: Processes idempotent payment. Upon payment success, triggers atomic stock decrement in MongoDB `Product.variants`, releases temporary session holds, and marks order status as `processing` / `paid`.
- **Headers**: `idempotency-key: idemp_91a0c4f8-1234-5678-abcd`, `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "order_id": "ORD-20260906-1916",       // string, required (Order Number or MongoDB ObjectId)
    "payment_gateway": "mock",             // string: 'mock' | 'razorpay' | 'stripe'
    "currency": "INR"                      // string, default: 'INR'
  }
  ```
- **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "payment": {
      "transactionId": "txn_1788726589123",
      "status": "succeeded",
      "amount": 191.75,
      "currency": "INR"
    },
    "order": {
      "orderNumber": "ORD-20260906-1916",
      "paymentStatus": "paid",
      "status": "processing"
    }
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: `{ "error": "order_id is required" }`
  - `404 Not Found`: `{ "error": "Order not found" }`

---

### 7.6 Orders Management & Fulfillment (`/api/orders`)

#### `POST /api/orders`
- **Scope**: Public / Storefront Checkout
- **Description**: Submits an order directly from the storefront checkout modal. Automatically links order to existing registered user account if phone matches, calculates tax and free shipping threshold (subtotal >= ₹499), deducts inventory stock, increments applied coupon usage counter, and returns full order document.
- **Headers**: `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "customerName": "Subham Srivastava",   // string, required
    "phoneNumber": "9999999999",           // string, required
    "email": "subham@example.com",         // string, optional
    "address": "Flat 402, Green Valley Apartments, Gomti Nagar, Lucknow, 226010",
    "products": [
      {
        "productName": "Fresh Organic Farm Potatoes (Aloo)",
        "sku": "VEG-POT-1KG",
        "price": 35.00,
        "quantity": 2
      }
    ],
    "couponCode": "FRESH20",               // string, optional
    "discountAmount": 14.00,               // number, optional
    "paymentMethod": "cod",                // string: 'cod' | 'upi' | 'card'
    "shippingFee": 0.00,                   // number, optional
    "totalAmount": 56.00                   // number, optional
  }
  ```
- **Success Response (`201 Created`)**:
  ```json
  {
    "_id": "66db8f6d89324501a41a4701",
    "orderNumber": "ORD-20260906-1916",
    "customerName": "Subham Srivastava",
    "phoneNumber": "9999999999",
    "totalAmount": 56.00,
    "discountAmount": 14.00,
    "couponCode": "FRESH20",
    "paymentMethod": "cod",
    "paymentStatus": "unpaid",
    "status": "pending",
    "createdAt": "2026-09-06T19:16:00.000Z"
  }
  ```

---

#### `GET /api/orders`
- **Scope**: Super Admin
- **Description**: Returns all orders sorted newest-first for the Super Admin Orders management table and revenue analytics.
- **Headers**: `Authorization: Bearer <admin_token>`
- **Success Response (`200 OK`)**: Array of Order documents.

---

#### `GET /api/orders/user/:phone`
- **Scope**: Customer
- **Description**: Fetches order history for a specific customer phone number (used in `<UserOrders />` and `<CustomerAccount />`).
- **Path Parameter**: `phone` (10-digit phone string).
- **Success Response (`200 OK`)**: Array of customer's historical Order documents.

---

#### `GET /api/orders/track/:orderNumber`
- **Scope**: Public
- **Description**: Public tracking endpoint returning live fulfillment status, tracking carrier, tracking number, and order items.
- **Path Parameter**: `orderNumber` (e.g. `ORD-20260906-1916` or ObjectId).
- **Success Response (`200 OK`)**:
  ```json
  {
    "orderNumber": "ORD-20260906-1916",
    "customerName": "Subham Srivastava",
    "status": "shipped",
    "trackingCarrier": "Bluedart Express",
    "trackingNumber": "TRK-982314510",
    "totalAmount": 56.00,
    "products": [ ... ]
  }
  ```
- **Error Responses**:
  - `404 Not Found`: `{ "error": "Order not found" }`

---

#### `PATCH /api/orders/:id/status` (also `PATCH /api/orders/:id`)
- **Scope**: Super Admin
- **Description**: Updates order lifecycle stage (`pending` ➔ `packed` ➔ `shipped` ➔ `delivered` or `cancelled`).
- **Path Parameter**: `id` (Order Number or ObjectId).
- **Request Body**:
  ```json
  {
    "status": "delivered"                  // string: 'pending' | 'packed' | 'shipped' | 'delivered' | 'cancelled'
  }
  ```
- **Success Response (`200 OK`)**: Returns updated Order document.
- **Error Responses**:
  - `400 Bad Request`: `{ "error": "Status is required" }`
  - `404 Not Found`: `{ "error": "Order not found" }`

---

#### `PATCH /api/orders/:orderId/fulfill`
- **Scope**: Super Admin
- **Description**: Marks order as shipped and registers courier delivery tracking information.
- **Path Parameter**: `orderId` (Order Number or ObjectId).
- **Headers**: `Authorization: Bearer <admin_token>`, `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "carrier": "Delhivery Express",
    "tracking_number": "DEL-9812401823"
  }
  ```
- **Success Response (`200 OK`)**:
  ```json
  {
    "message": "Order fulfilled and marked as shipped",
    "order": { /* updated order document */ }
  }
  ```

---

#### `DELETE /api/orders/:id`
- **Scope**: Super Admin
- **Description**: Deletes an order record from the database.
- **Path Parameter**: `id` (Order Number or ObjectId).
- **Success Response (`200 OK`)**: `{ "message": "Order deleted successfully" }`

---

### 7.7 Inventory Alerts & Threshold Tracking (`/api/inventory`)

#### `GET /api/inventory/alerts`
- **Scope**: Super Admin
- **Description**: Scans all product variants where `stockQuantity <= safetyStock` and returns low-stock alert warnings for admin procurement.
- **Headers**: `Authorization: Bearer <admin_token>`
- **Success Response (`200 OK`)**:
  ```json
  {
    "count": 2,
    "alerts": [
      {
        "productId": "66db8f6d89324501a41a4502",
        "title": "Aashirvaad Shudh Chakki Atta (5kg)",
        "sku": "STA-ATT-5KG",
        "currentStock": 4,
        "safetyStock": 10,
        "deficit": 6
      }
    ]
  }
  ```

---

### 7.8 Coupons, Vouchers & Discounts (`/api/coupons`)

#### `POST /api/coupons/apply`
- **Scope**: Public / Storefront Cart
- **Description**: Validates voucher code against cart subtotal, minimum order amount, expiration date, and usage limits. Computes exact discount amount.
- **Headers**: `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "code": "FRESH20",                     // string, required
    "subtotal": 650.00                     // number, required
  }
  ```
- **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "code": "FRESH20",
    "discountType": "percentage",
    "discountValue": 20,
    "discountAmount": 100.00,
    "finalAmount": 550.00,
    "message": "Coupon FRESH20 applied successfully! You saved ₹100.00"
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: `{ "error": "Minimum order value for coupon FRESH20 is ₹199" }`
  - `404 Not Found`: `{ "error": "Invalid coupon code. Please verify and try again." }`

---

#### `GET /api/coupons/active`
- **Scope**: Public
- **Description**: Returns non-expired, active coupons for display in storefront notification pills and hero discount banners.
- **Success Response (`200 OK`)**: Array of active coupon descriptors (`code`, `discountType`, `discountValue`, `minOrderAmount`, `expiryDate`).

---

#### `GET /api/coupons/admin` (and `/api/coupons/admin/all`)
- **Scope**: Super Admin
- **Description**: Retrieves all coupon vouchers (active, expired, paused) with usage metrics (`usedCount`, `usageLimit`).
- **Headers**: `Authorization: Bearer <admin_token>`
- **Success Response (`200 OK`)**: Array of all Coupon documents.

---

#### `POST /api/coupons/admin`
- **Scope**: Super Admin
- **Description**: Creates a new promotional coupon voucher.
- **Headers**: `Authorization: Bearer <admin_token>`, `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "code": "DIWALI50",                    // string, required, uppercase
    "description": "Diwali Festival 50% Off",
    "discountType": "percentage",          // 'percentage' | 'fixed'
    "discountValue": 50,                   // number, required
    "minOrderAmount": 499,                 // number, optional
    "maxDiscountAmount": 250,              // number, optional cap
    "expiryDate": "2026-11-30T23:59:59Z",  // ISO date string, required
    "usageLimit": 500                      // number, optional
  }
  ```
- **Success Response (`201 Created`)**:
  ```json
  {
    "message": "Coupon created successfully",
    "coupon": { /* created coupon document */ }
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: `{ "error": "Code, discount value, and expiration date are required" }`
  - `409 Conflict`: `{ "error": "A coupon with this code already exists" }`

---

#### `PATCH /api/coupons/admin/:id/toggle`
- **Scope**: Super Admin
- **Description**: Toggles `isActive` boolean flag to instantly pause or re-enable a coupon code.
- **Path Parameter**: `id` (Coupon ObjectId).
- **Headers**: `Authorization: Bearer <admin_token>`
- **Success Response (`200 OK`)**: `{ "message": "Coupon is now Inactive", "coupon": { ... } }`

---

#### `DELETE /api/coupons/admin/:id`
- **Scope**: Super Admin
- **Description**: Deletes a coupon voucher permanently.
- **Path Parameter**: `id` (Coupon ObjectId).
- **Headers**: `Authorization: Bearer <admin_token>`
- **Success Response (`200 OK`)**: `{ "message": "Coupon deleted successfully" }`

---

### 7.9 Product Reviews & Moderation (`/api/reviews`)

#### `GET /api/reviews/product/:idOrSlug`
- **Scope**: Public
- **Description**: Fetches approved customer reviews, calculated average rating (out of 5.0), and 5-star distribution breakdown for a product.
- **Path Parameter**: `idOrSlug` (Product ObjectId or URL slug).
- **Success Response (`200 OK`)**:
  ```json
  {
    "productId": "66db8f6d89324501a41a4501",
    "totalReviews": 18,
    "averageRating": 4.8,
    "ratingBreakdown": { "5": 14, "4": 3, "3": 1, "2": 0, "1": 0 },
    "reviews": [
      {
        "_id": "66db8f6d89324501a41a4801",
        "userName": "Ramesh Gupta",
        "rating": 5,
        "title": "Extremely fresh and crisp!",
        "comment": "Delivered within 15 minutes. Great quality packaging.",
        "verifiedPurchase": true,
        "createdAt": "2026-09-06T10:00:00.000Z"
      }
    ]
  }
  ```

---

#### `POST /api/reviews/product/:idOrSlug`
- **Scope**: Customer
- **Description**: Submits a review. Automatically checks previous orders to set `verifiedPurchase = true`. Enforces one review per customer per product to eliminate review manipulation.
- **Path Parameter**: `idOrSlug` (Product ObjectId or URL slug).
- **Headers**: `Authorization: Bearer <token>`, `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "rating": 5,                           // number, required, 1 to 5
    "title": "Superb quality farm produce", // string, optional
    "comment": "The potatoes were completely clean and fresh. Will buy again!" // string, required
  }
  ```
- **Success Response (`201 Created`)**:
  ```json
  {
    "message": "Thank you! Your review has been published.",
    "review": { /* created review document */ }
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: `{ "error": "Rating (1-5) and review comment are required" }`
  - `409 Conflict`: `{ "error": "You have already submitted a review for this product" }`

---

#### `GET /api/reviews/admin` (and `/api/reviews/admin/all`)
- **Scope**: Super Admin
- **Description**: Lists all reviews with populated product thumbnails and titles for administrative review moderation.
- **Headers**: `Authorization: Bearer <admin_token>`
- **Success Response (`200 OK`)**: Array of all Review documents.

---

#### `PATCH /api/reviews/admin/:id/status`
- **Scope**: Super Admin
- **Description**: Explicitly updates review moderation status (`approved` or `rejected`).
- **Path Parameter**: `id` (Review ObjectId).
- **Headers**: `Authorization: Bearer <admin_token>`, `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "status": "approved"                  // string: 'approved' | 'rejected'
  }
  ```
- **Success Response (`200 OK`)**: `{ "message": "Review status updated to approved", "review": { ... } }`

---

#### `PATCH /api/reviews/admin/:id/toggle`
- **Scope**: Super Admin
- **Description**: Toggles `isApproved` status between true and false.
- **Path Parameter**: `id` (Review ObjectId).
- **Headers**: `Authorization: Bearer <admin_token>`
- **Success Response (`200 OK`)**: `{ "message": "Review approval set to true", "review": { ... } }`

---

#### `DELETE /api/reviews/admin/:id`
- **Scope**: Super Admin
- **Description**: Deletes inappropriate or spam review permanently.
- **Path Parameter**: `id` (Review ObjectId).
- **Headers**: `Authorization: Bearer <admin_token>`
- **Success Response (`200 OK`)**: `{ "message": "Review deleted successfully" }`

---

### 7.10 Storefront Banners & Promotions (`/api/banners`)

#### `GET /api/banners`
- **Scope**: Public
- **Description**: Fetches active hero carousel banners ordered by `displayOrder`. Returns fallback banners if none are active in the database.
- **Success Response (`200 OK`)**: Array of Banner documents (`title`, `subtitle`, `badge`, `imageUrl`, `targetUrl`, `bgColor`, `textColor`, `btnText`).

---

#### `GET /api/banners/admin` (and `/api/banners/admin/all`)
- **Scope**: Super Admin
- **Description**: Lists all storefront banners for administrative reordering and content editing.
- **Headers**: `Authorization: Bearer <admin_token>`
- **Success Response (`200 OK`)**: Array of all Banner documents.

---

#### `POST /api/banners/admin`
- **Scope**: Super Admin
- **Description**: Creates a new promotional storefront carousel slide.
- **Headers**: `Authorization: Bearer <admin_token>`, `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "title": "Mega Monsoon Grocery Clearance Sale",
    "subtitle": "Extra 15% discount on all kitchen staples and cold-pressed cooking oils",
    "badge": "Limited Time Only",
    "imageUrl": "https://images.unsplash.com/photo-1542838132-92c53300491e",
    "targetUrl": "/shop?category=staples-and-grains",
    "bgColor": "#FEF3C7",
    "textColor": "#78350F",
    "btnText": "Shop Staples Now",
    "displayOrder": 1,
    "isActive": true
  }
  ```
- **Success Response (`201 Created`)**: `{ "message": "Banner created successfully", "banner": { ... } }`

---

#### `PATCH /api/banners/admin/:id` (and `/api/banners/admin/:id/toggle`)
- **Scope**: Super Admin
- **Description**: Toggles banner display state between active and hidden.
- **Path Parameter**: `id` (Banner ObjectId).
- **Headers**: `Authorization: Bearer <admin_token>`
- **Success Response (`200 OK`)**: `{ "message": "Banner is now Active", "banner": { ... } }`

---

#### `DELETE /api/banners/admin/:id`
- **Scope**: Super Admin
- **Description**: Removes banner slide from storefront carousel.
- **Path Parameter**: `id` (Banner ObjectId).
- **Headers**: `Authorization: Bearer <admin_token>`
- **Success Response (`200 OK`)**: `{ "message": "Banner removed successfully" }`

---

### 7.11 Customer Account, Addresses & Wishlist (`/api/account`)

#### `GET /api/account/me`
- **Scope**: Customer
- **Description**: Retrieves authenticated customer's profile, saved delivery addresses, and wishlist product IDs.
- **Headers**: `Authorization: Bearer <token>`
- **Success Response (`200 OK`)**:
  ```json
  {
    "user": {
      "id": "66db8f6d89324501a41a4570",
      "fullName": "Subham Srivastava",
      "phone": "9999999999",
      "email": "subham@example.com",
      "role": "customer"
    },
    "addresses": [
      {
        "_id": "66db8f6d89324501a41a4901",
        "label": "Home",
        "fullName": "Subham Srivastava",
        "phoneNumber": "9999999999",
        "streetAddress": "Flat 402, Green Valley Apartments",
        "apartment": "Tower B",
        "city": "Lucknow",
        "state": "Uttar Pradesh",
        "postalCode": "226010",
        "isDefault": true
      }
    ],
    "wishlist": ["66db8f6d89324501a41a4501"]
  }
  ```

---

#### `PUT /api/account/profile`
- **Scope**: Customer
- **Description**: Updates customer profile name or email address.
- **Headers**: `Authorization: Bearer <token>`, `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "fullName": "Subham Srivastava",
    "email": "subham.new@example.com"
  }
  ```
- **Success Response (`200 OK`)**: `{ "message": "Profile updated successfully", "user": { ... } }`

---

#### `POST /api/account/addresses`
- **Scope**: Customer
- **Description**: Adds a new delivery destination to the customer's address book.
- **Headers**: `Authorization: Bearer <token>`, `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "label": "Work",                      // string: 'Home' | 'Work' | 'Other'
    "fullName": "Subham Srivastava",       // string, required
    "phoneNumber": "9999999999",           // string, required
    "streetAddress": "Tech Park, Phase 2", // string, required
    "apartment": "Suite 401",
    "city": "Lucknow",                     // string, required
    "state": "Uttar Pradesh",
    "postalCode": "226010",                // string, required
    "isDefault": false
  }
  ```
- **Success Response (`201 Created`)**: `{ "message": "Address saved successfully", "address": { ... } }`

---

#### `DELETE /api/account/addresses/:id`
- **Scope**: Customer
- **Description**: Removes an address from the user's address book.
- **Path Parameter**: `id` (Address ObjectId).
- **Headers**: `Authorization: Bearer <token>`
- **Success Response (`200 OK`)**: `{ "message": "Address removed successfully" }`

---

#### `POST /api/account/wishlist/toggle`
- **Scope**: Customer
- **Description**: Adds product to customer's wishlist if absent, or removes it if already present.
- **Headers**: `Authorization: Bearer <token>`, `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "productId": "66db8f6d89324501a41a4501" // string, required (Product ObjectId)
  }
  ```
- **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "added": true,
    "wishlist": ["66db8f6d89324501a41a4501"],
    "message": "Product added to your wishlist!"
  }
  ```

---

### 7.12 Super Admin Analytics & Customer Control (`/api/admin`)

#### `GET /api/admin/metrics`
- **Scope**: Super Admin
- **Description**: Aggregated KPI dashboard analytics powering the FreshCart Super Admin dashboard: total revenue, order counts by stage, real customer count, top products by volume/revenue, weekly sales spline data, category sales distribution, and recent orders.
- **Headers**: `Authorization: Bearer <admin_token>`
- **Success Response (`200 OK`)**:
  ```json
  {
    "adminName": "Harsh Srivastava (Super Admin)",
    "adminPhone": "9161955178",
    "adminEmail": "admin@freshcart.com",
    "adminRole": "Super Admin",
    "totalRevenue": 24582.00,
    "revenueGrowth": "18.2% this week",
    "totalOrders": 12,
    "ordersGrowth": "12.5% this week",
    "totalProducts": 11,
    "totalCustomers": 5,
    "pendingOrders": 3,
    "packedOrders": 2,
    "deliveredOrders": 7,
    "activeDispatches": 5,
    "lowStockCount": 0,
    "weeklySpline": [
      { "day": "MON", "value": 4380, "label": "$4,380" },
      { "day": "TUE", "value": 4490, "label": "$4,490" },
      { "day": "WED", "value": 4560, "label": "$4,560" },
      { "day": "THU", "value": 4520, "label": "$4,520" },
      { "day": "FRI", "value": 4645.80, "label": "$4,645.80", "isPeak": true },
      { "day": "SAT", "value": 4480, "label": "$4,480" },
      { "day": "SUN", "value": 4510, "label": "$4,510" }
    ],
    "categoryDistribution": {
      "dairy": { "name": "Dairy", "count": 25500, "color": "#3B82F6", "percent": 25 },
      "fruits": { "name": "Fruits", "count": 34000, "color": "#00B074", "percent": 33 },
      "vegetables": { "name": "Vegetables", "count": 25600, "color": "#10B981", "percent": 25 },
      "meat": { "name": "Meat & Staples", "count": 17000, "color": "#94A3B8", "percent": 17 }
    },
    "topProducts": [
      { "title": "Fresh Organic Farm Potatoes (Aloo)", "soldCount": 42, "revenue": 1470.00 }
    ],
    "recentOrders": [
      {
        "id": "66db8f6d89324501a41a4701",
        "orderNumber": "ORD-20260906-1916",
        "productName": "Fresh Organic Farm Potatoes (Aloo)",
        "date": "Sep 6",
        "status": "pending",
        "price": "56.00",
        "customer": "Subham Srivastava"
      }
    ]
  }
  ```
- **Error Responses**:
  - `401 Unauthorized`: Token missing or invalid.
  - `403 Forbidden`: User does not possess Super Admin privileges.

---

#### `GET /api/admin/customers`
- **Scope**: Super Admin
- **Description**: Returns all registered customers along with their lifetime order count, aggregate spend, phone, email, and registration timestamp.
- **Headers**: `Authorization: Bearer <admin_token>`
- **Success Response (`200 OK`)**:
  ```json
  [
    {
      "_id": "66db8f6d89324501a41a4570",
      "fullName": "Subham Srivastava",
      "phone": "9999999999",
      "email": "subham@example.com",
      "role": "customer",
      "isActive": true,
      "createdAt": "2026-09-06T18:00:00.000Z",
      "ordersCount": 3,
      "totalSpend": 645.00
    }
  ]
  ```

---

#### `DELETE /api/admin/customers/:id`
- **Scope**: Super Admin
- **Description**: Removes or bans customer account.
- **Path Parameter**: `id` (User ObjectId).
- **Headers**: `Authorization: Bearer <admin_token>`
- **Success Response (`200 OK`)**: `{ "message": "Customer account removed successfully" }`

---

#### `PUT /api/admin/profile`
- **Scope**: Super Admin
- **Description**: Updates Super Admin contact details and profile attributes.
- **Headers**: `Authorization: Bearer <admin_token>`, `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "fullName": "Harsh Srivastava",
    "email": "harsh@freshcart.com",
    "phone": "9161955178"
  }
  ```
- **Success Response (`200 OK`)**:
  ```json
  {
    "message": "Super Admin profile updated successfully",
    "user": {
      "id": "66db8f6d89324501a41a4561",
      "fullName": "Harsh Srivastava",
      "phone": "9161955178",
      "email": "harsh@freshcart.com",
      "role": "admin"
    }
  }
  ```


---

## 8. Domain Controller Architecture & Feature Specifications

FreshCart features a decoupled, Domain-Driven Controller architecture located under `backend/controllers/`. Each domain encapsulates its specific business rules, persistence logic, caching strategies, and third-party integrations.

```text
backend/controllers/
├── account/             # Customer Profile, Saved Addresses, Wallet Ledger & Wishlists
├── admin/               # Super Admin Metrics, User Directory, Order Lifecycle & Restocking
├── auth/                # Dual-token JWT Authentication, OAuth 2.0, OTP Password Recovery
├── catalog/             # Faceted Product Search, Category Taxonomy & Streaming CSV Ingestion
├── inventory/           # Safety Stock Monitoring & Critical Depletion Alerts
├── logistics/           # Fleet Dispatch, Serviceability Engine & Real-Time Tracking Milestones
├── marketing/           # Hero Banners, Promo Sliders & Coupon Voucher Engine
├── media/               # AWS S3 Direct Presigned URLs & Optimized Local WebP Storage Fallback
├── order/               # Real-time Cart Sync, Concurrency-Safe Checkout & Order State Machine
└── review/              # Verified Purchase Product Ratings, Reviews & Moderation Queue
```

---

### 8.1 Authentication & Identity Domain (`auth/authController.js`)
* **File Location**: `backend/controllers/auth/authController.js`
* **Service Role**: Manages customer and administrator identity lifecycles, cryptographic credentials, session tokens, and security audits.
* **Core Technical Capabilities**:
  * **Dual-Token Architecture**: Issues short-lived access JWTs (`7d`) and long-lived refresh tokens (`30d`) with Redis revocation tracking.
  * **Bcrypt Password Security**: Enforces 12-round salted hashing for all user passwords.
  * **Secure OTP Password Reset**: Computes a 6-digit random code stored as a SHA-256 hash in MongoDB with a strict 10-minute expiry window.
  * **Google OAuth 2.0 Verification**: Verifies Google client identity tokens and automatically creates or syncs customer profiles.
* **Method Breakdown**:
  | Method | Route | Access | Key Responsibilities & Logic |
  | :--- | :--- | :---: | :--- |
  | `register` | `POST /api/auth/register` | Public | Validates phone/email uniqueness, hashes password, saves User record, and returns JWT session. |
  | `login` | `POST /api/auth/login` | Public | Authenticates credentials, checks `isActive` account status, updates `lastLoginAt`, and generates tokens. |
  | `googleAuth` | `POST /api/auth/google` | Public | Validates Google identity payload; handles zero-friction account creation and session issuance. |
  | `refreshToken`| `POST /api/auth/refresh-token` | Public | Verifies incoming refresh token against Redis blacklist; rotates and issues fresh access token. |
  | `logout` | `POST /api/auth/logout` | Authenticated | Blacklists current refresh token in Redis, invalidating any future refresh cycles. |
  | `requestOtp` | `POST /api/auth/request-otp` | Public | Generates cryptographic OTP for forgot-password flow, records expiration, and sends SMS payload. |
  | `verifyOtpAndResetPassword` | `POST /api/auth/reset-password` | Public | Validates OTP submission within TTL, enforces minimum password strength, and persists new hash. |
  | `getMe` | `GET /api/auth/me` | Authenticated | Decodes bearer token and returns current user profile, role flags, and account status. |
  | `changePassword` | `POST /api/auth/change-password` | Authenticated | Verifies existing password before allowing password updates from account settings. |

---

### 8.2 Customer Account & Wallet Domain (`account/accountController.js`)
* **File Location**: `backend/controllers/account/accountController.js`
* **Service Role**: Manages customer profile data, saved shipping addresses, customer wallet ledger, and product wishlists.
* **Core Technical Capabilities**:
  * **Saved Address Directory**: Supports multiple shipping addresses tagged as `Home`, `Work`, or `Other` with automatic single-default management.
  * **In-App Store Wallet Ledger**: High-concurrency wallet balance supporting deposits, cashback credits, debit deductions, and refunds with audit logs.
  * **Idempotent Wishlist Storage**: Maintains customer favorites using unique MongoDB ObjectId sets to eliminate duplicates.
* **Method Breakdown**:
  | Method | Route | Access | Key Responsibilities & Logic |
  | :--- | :--- | :---: | :--- |
  | `getProfile` | `GET /api/account/profile` | Customer | Returns profile attributes, active orders tally, saved address count, and wallet balance. |
  | `updateProfile` | `PUT /api/account/profile` | Customer | Updates customer name, email address, and notification preferences. |
  | `getAddresses` | `GET /api/account/addresses` | Customer | Fetches all saved shipping addresses associated with the authenticated customer. |
  | `addAddress` | `POST /api/account/addresses` | Customer | Validates 6-digit Indian pincode, recipient phone, and creates new address (sets default if first). |
  | `updateAddress` | `PUT /api/account/addresses/:id`| Customer | Updates specific address fields or promotes address to primary default. |
  | `deleteAddress` | `DELETE /api/account/addresses/:id`| Customer | Removes address; automatically re-assigns default flag to another address if needed. |
  | `setDefaultAddress` | `PUT /api/account/addresses/:id/default`| Customer | Atomically unsets previous default and sets specified address as active primary. |
  | `getWallet` | `GET /api/account/wallet` | Customer | Returns real-time wallet balance and itemized chronological transaction ledger. |
  | `addWalletFunds` | `POST /api/account/wallet/add` | Customer | Credits customer wallet balance with test/gateway funds. |
  | `getWishlist` | `GET /api/account/wishlist` | Customer | Fetches populated products and active variant pricing saved to customer wishlist. |
  | `addToWishlist` | `POST /api/account/wishlist/:productId`| Customer | Adds product to customer wishlist idempotently. |
  | `removeFromWishlist`| `DELETE /api/account/wishlist/:productId`| Customer | Removes specified product from customer wishlist. |

---

### 8.3 Catalog & Search Domain (`catalog/catalogController.js`)
* **File Location**: `backend/controllers/catalog/catalogController.js`
* **Service Role**: Powers product discovery, faceted search filtering, category hierarchies, and bulk catalog ingestion.
* **Core Technical Capabilities**:
  * **High-Speed Redis Query Caching**: Caches public search queries, category trees, and product listings with automatic invalidation.
  * **Faceted Search Engine**: Dynamically filters by category slug, brand, price slider range, in-stock availability, and sorting modes (`price_asc`, `price_desc`, `rating`, `newest`).
  * **Streaming CSV Parser**: Enables bulk catalog creation and updates via chunked CSV uploads, handling thousands of SKU rows without memory spikes.
* **Method Breakdown**:
  | Method | Route | Access | Key Responsibilities & Logic |
  | :--- | :--- | :---: | :--- |
  | `getProducts` | `GET /api/catalog/products` | Public | Paginated product browsing with multi-field search (`q`), category filters, and price ranges. |
  | `getProductBySlug` | `GET /api/catalog/products/:slug` | Public | Detailed PDP data including variant stock quantities, safety margins, images, and review summaries. |
  | `getCategories` | `GET /api/catalog/categories` | Public | Category tree with display ordering, thumbnail URLs, and active product counts. |
  | `getCategoryBySlug`| `GET /api/catalog/categories/:slug`| Public | Returns category metadata and subcategory references. |
  | `searchAutocomplete`| `GET /api/catalog/search/autocomplete`| Public | Low-latency typeahead search querying indexed product titles, brands, and categories. |
  | `bulkUploadCsv` | `POST /api/catalog/admin/bulk-upload`| Super Admin | Streaming multipart CSV ingestion validating barcodes, SKUs, wholesale pricing, and stock. |

---

### 8.4 Shopping Cart Domain (`order/cartController.js`)
* **File Location**: `backend/controllers/order/cartController.js`
* **Service Role**: Synchronizes server-side shopping carts for both authenticated customers and guest browser sessions.
* **Core Technical Capabilities**:
  * **Dual Session Support**: Seamlessly persists cart contents for anonymous guests (`x-session-token`) or authenticated user accounts.
  * **Live Stock Validation**: Checks live variant quantities against warehouse inventory to prevent adding out-of-stock items.
  * **Automatic Guest Cart Merging**: Merges anonymous session items into the authenticated customer's cart upon login.
* **Method Breakdown**:
  | Method | Route | Access | Key Responsibilities & Logic |
  | :--- | :--- | :---: | :--- |
  | `getCart` | `GET /api/cart` | Public / Session | Retrieves active cart, populating current variant details, live stock, and calculating subtotal. |
  | `addToCart` | `POST /api/cart/items` | Public / Session | Adds variant to cart; validates maximum order quantities and real-time inventory limits. |
  | `updateCartItem` | `PUT /api/cart/items/:variantId` | Public / Session | Updates quantity of a specific cart item; verifies stock boundary availability. |
  | `removeCartItem` | `DELETE /api/cart/items/:variantId` | Public / Session | Removes single variant item from cart. |
  | `clearCart` | `DELETE /api/cart` | Public / Session | Empties all items from the current cart. |
  | `syncGuestCart` | `POST /api/cart/sync` | Authenticated | Merges guest cart items into authenticated user profile upon successful sign-in. |

---

### 8.5 Checkout & Payments Domain (`order/checkoutController.js`)
* **File Location**: `backend/controllers/order/checkoutController.js`
* **Service Role**: The financial and transactional core managing canonical price calculations, temporary inventory holds, payment gateway handshakes, and webhook fulfillment.
* **Core Technical Capabilities**:
  * **Canonical Server-Side Pricing**: Recalculates line items and totals exclusively on the server in integer paise (₹0.01) to completely eliminate client-side price manipulation.
  * **Indian GST Tax Calculator**: Automatically splits taxes into CGST + SGST (intra-state) or IGST (inter-state) based on store state and destination state.
  * **15-Minute Concurrency Stock Holds (`StockHold`)**: Places temporary TTL holds on variants during checkout to prevent overselling during high-traffic flash sales.
  * **Razorpay Payment Integration**: Generates official Razorpay orders, verifies HMAC-SHA256 signatures, and processes asynchronous webhooks (`payment.captured`, `order.paid`).
  * **Cash on Delivery (COD) Anti-Fraud Risk Engine**: Enforces strict checks: valid 6-digit Indian pincode format, maximum ₹10,000 order value cap, and customer account block status.
* **Method Breakdown**:
  | Method | Route | Access | Key Responsibilities & Logic |
  | :--- | :--- | :---: | :--- |
  | `initializeCheckout` | `POST /api/checkout/initialize` | Authenticated | Calculates canonical prices & GST, validates delivery pincode, establishes 15-min stock holds. |
  | `createRazorpayOrder`| `POST /api/checkout/razorpay/order`| Authenticated | Generates Razorpay Order ID (or sandbox mock) and returns credentials for checkout modal. |
  | `verifyPayment` | `POST /api/checkout/razorpay/verify`| Authenticated | Validates cryptographic payment signature, commits stock holds into orders, and clears cart. |
  | `handleRazorpayWebhook`| `POST /api/checkout/webhook` | Public (Signed) | Asynchronous webhook processor verifying signature to guarantee idempotent order fulfillment. |
  | `placeCodOrder` | `POST /api/checkout/cod` | Authenticated | Runs COD anti-fraud engine, reserves stock, creates order in 'unpaid' state, and empties cart. |

---

### 8.6 Order Management & Tracking Domain (`order/orderController.js`)
* **File Location**: `backend/controllers/order/orderController.js`
* **Service Role**: Manages order life cycles, customer order history, automated stock restorations on cancellation, and live delivery status timelines.
* **Core Technical Capabilities**:
  * **Immutable Order Snapshots**: Stores historical snapshots of product titles, variant SKUs, and purchased unit prices so future catalog updates don't alter past receipts.
  * **Atomic Cancellation & Inventory Restoration**: Automatically increments warehouse variant stock when an order is cancelled before fulfillment.
* **Method Breakdown**:
  | Method | Route | Access | Key Responsibilities & Logic |
  | :--- | :--- | :---: | :--- |
  | `getMyOrders` | `GET /api/orders/my-orders` | Customer | Returns customer's chronological order history with delivery status and milestone trackers. |
  | `getOrderById` | `GET /api/orders/:id` | Customer / Admin | Returns itemized order invoice, applied tax details, shipping address, and payment status. |
  | `cancelOrder` | `POST /api/orders/:id/cancel` | Customer / Admin | Cancels order (if pending/packed), initiates wallet/payment refund, and restores variant inventory. |
  | `trackOrder` | `GET /api/orders/track/:orderNumber` | Public / Customer | Returns live quick-commerce delivery tracker milestones and assigned driver details. |

---

### 8.7 Inventory Control Domain (`inventory/inventoryController.js`)
* **File Location**: `backend/controllers/inventory/inventoryController.js`
* **Service Role**: Oversees warehouse SKU stock quantities and automated alerts for supply-chain replenishment.
* **Core Technical Capabilities**:
  * **Safety Margin Auditing**: Evaluates `stockQuantity` against `safetyStock` per variant SKU across the entire product catalog.
  * **Low Stock Alerts**: Identifies impending stock-outs and flags items requiring urgent purchase orders.
* **Method Breakdown**:
  | Method | Route | Access | Key Responsibilities & Logic |
  | :--- | :--- | :---: | :--- |
  | `getLowStockAlerts` | `GET /api/inventory/low-stock` | Super Admin | Scans all variants and returns urgent deficit alerts grouped by product and SKU. |

---

### 8.8 Logistics & Fulfillment Domain (`logistics/logisticsController.js`)
* **File Location**: `backend/controllers/logistics/logisticsController.js`
* **Service Role**: Controls in-house delivery fleet dispatch, delivery serviceability checks, tracking milestones, and shipping fee calculation.
* **Core Technical Capabilities**:
  * **Pincode Serviceability Matrix**: Verifies destination postal code against warehouse delivery radii to determine express eligibility and transit windows.
  * **Step-by-Step Delivery Milestones**: Tracks shipment progression through `pending` ➔ `packed` ➔ `dispatched` ➔ `out_for_delivery` ➔ `delivered`.
* **Method Breakdown**:
  | Method | Route | Access | Key Responsibilities & Logic |
  | :--- | :--- | :---: | :--- |
  | `checkPincodeServiceability`| `GET /api/logistics/serviceability/:pincode`| Public | Returns estimated delivery days, delivery charge, and express dispatch capability. |
  | `dispatchOrder` | `POST /api/logistics/dispatch` | Super Admin | Assigns fleet runner, generates tracking code, and marks order as dispatched. |
  | `updateShipmentStatus`| `PUT /api/logistics/shipment-status` | Super Admin / Fleet | Updates tracking status and logs delivery driver timestamp. |
  | `getLiveTracking` | `GET /api/logistics/track/:trackingCode`| Public / Customer | Fetches real-time milestone timeline for customer tracking view. |

---

### 8.9 Marketing: Banners & Sliders Domain (`marketing/bannerController.js`)
* **File Location**: `backend/controllers/marketing/bannerController.js`
* **Service Role**: Manages storefront marketing real estate including responsive hero carousels and promotional discount tiles.
* **Core Technical Capabilities**:
  * **Display Priority Ordering**: Renders banners ordered by sequential display index.
  * **Status Toggling**: Supports fast activation and deactivation of seasonal campaign banners.
* **Method Breakdown**:
  | Method | Route | Access | Key Responsibilities & Logic |
  | :--- | :--- | :---: | :--- |
  | `getBanners` | `GET /api/banners` | Public | Returns all active promotional banners sorted by display priority for storefront sliders. |
  | `createBanner` | `POST /api/banners` | Super Admin | Creates promotional banner with headline, image URL, redirect link, and display order. |
  | `updateBanner` | `PUT /api/banners/:id` | Super Admin | Modifies banner parameters, visual asset URL, or active state. |
  | `deleteBanner` | `DELETE /api/banners/:id` | Super Admin | Permanently deletes promotional banner from carousel. |

---

### 8.10 Marketing: Coupons & Vouchers Domain (`marketing/couponController.js`)
* **File Location**: `backend/controllers/marketing/couponController.js`
* **Service Role**: Manages promotional voucher codes, discount calculations, usage restrictions, and redemption limits.
* **Core Technical Capabilities**:
  * **Dual Discount Models**: Supports both `percentage` discounts (with optional maximum discount caps) and `fixed` cash discounts.
  * **Comprehensive Eligibility Validation**: Validates voucher active status, expiration date, minimum cart order value, total coupon usage caps, and per-user redemption limits.
* **Method Breakdown**:
  | Method | Route | Access | Key Responsibilities & Logic |
  | :--- | :--- | :---: | :--- |
  | `validateCoupon` | `POST /api/coupons/validate` | Public / Session | Tests voucher code against current cart value; returns calculated discount amount and status. |
  | `listCoupons` | `GET /api/coupons` | Super Admin | Lists all promo codes with redemption counts, limits, and expiry dates. |
  | `createCoupon` | `POST /api/coupons` | Super Admin | Creates new coupon code with discount percentage/fixed value, caps, and expiry. |
  | `deleteCoupon` | `DELETE /api/coupons/:id` | Super Admin | Deactivates or removes discount coupon from system. |

---

### 8.11 Media Upload & Cloud Storage Domain (`media/uploadController.js`)
* **File Location**: `backend/controllers/media/uploadController.js`
* **Service Role**: Handles media ingestion, image format optimization, and cloud storage handshakes.
* **Core Technical Capabilities**:
  * **AWS S3 + Local Fallback**: Automatically uploads files to Amazon S3 buckets; if AWS credentials are not configured, seamlessly falls back to storing assets in `backend/uploads/`.
  * **Presigned PUT URL Generation**: Generates temporary 60-second AWS S3 presigned URLs allowing client browsers to upload media directly to S3, bypassing Node.js server RAM and CPU buffers.
* **Method Breakdown**:
  | Method | Route | Access | Key Responsibilities & Logic |
  | :--- | :--- | :---: | :--- |
  | `uploadMediaAsset` | `POST /api/uploads/media` | Authenticated | Processes multipart file upload (product images/banners), converts to WebP, and saves to S3/local. |
  | `getPresignedUploadUrl`| `POST /api/uploads/presigned-url`| Authenticated | Issues AWS S3 presigned URL for direct client-to-bucket upload bypass. |

---

### 8.12 Ratings & Product Reviews Domain (`review/reviewController.js`)
* **File Location**: `backend/controllers/review/reviewController.js`
* **Service Role**: Powers customer feedback loops, star ratings, buyer verification, and administrative moderation.
* **Core Technical Capabilities**:
  * **Verified Buyer Verification**: Automatically inspects customer order history to mark reviews with a trusted "Verified Purchase" badge.
  * **Dynamic Average Rating Updates**: Recalculates product overall rating score and review tally upon review approval.
* **Method Breakdown**:
  | Method | Route | Access | Key Responsibilities & Logic |
  | :--- | :--- | :---: | :--- |
  | `getProductReviews` | `GET /api/reviews/product/:productId`| Public | Returns approved reviews, 1-5 star distribution rating breakdown, and verified buyer badges. |
  | `createReview` | `POST /api/reviews` | Customer | Creates product review and star rating; checks purchase history to attach verified badge. |
  | `moderateReview` | `PUT /api/reviews/:id/moderate` | Super Admin | Approves or rejects customer review submissions in the moderation queue. |
  | `deleteReview` | `DELETE /api/reviews/:id` | Super Admin | Deletes inappropriate reviews and recalculates product rating averages. |

---

### 8.13 Administration & Business Analytics Domain (`admin/adminController.js`)
* **File Location**: `backend/controllers/admin/adminController.js`
* **Service Role**: Super Admin command center providing financial analytics, order fulfillment overrides, customer user management, and bulk inventory restocking.
* **Core Technical Capabilities**:
  * **Financial & Operations Telemetry**: Computes gross merchandise value (GMV), total completed orders, active customer counts, average order value (AOV), and today's sales.
  * **Time-Series Chart Aggregations**: Generates daily, weekly, and monthly revenue aggregations for dashboard charts.
  * **Customer Risk Overrides**: Enables banning abusive accounts or selectively toggling Cash on Delivery privileges (`codBlocked`).
* **Method Breakdown**:
  | Method | Route | Access | Key Responsibilities & Logic |
  | :--- | :--- | :---: | :--- |
  | `getDashboardMetrics` | `GET /api/admin/metrics` | Super Admin | Computes platform KPI cards: total revenue, order count, registered users, and low stock count. |
  | `getRevenueTrends` | `GET /api/admin/revenue-trends` | Super Admin | Aggregates time-series revenue and order volume for dashboard analytics charts. |
  | `getAllOrders` | `GET /api/admin/orders` | Super Admin | Paginated administrative order browser with filters by status, payment method, and date range. |
  | `updateOrderStatus` | `PUT /api/admin/orders/:id/status`| Super Admin | Overrides order status (`pending`, `packed`, `delivered`, `cancelled`) with stock restoration. |
  | `getAllUsers` | `GET /api/admin/users` | Super Admin | Lists all registered customers with lifetime spend, order count, and account status flags. |
  | `toggleUserStatus` | `PUT /api/admin/users/:id/status` | Super Admin | Toggles active status or disables Cash on Delivery (COD) for risky customer accounts. |
  | `bulkRestock` | `POST /api/admin/inventory/bulk-restock`| Super Admin | Updates stock quantities across multiple variant SKUs simultaneously. |

---

## 9. Environment Variables

### Backend (`backend/.env`)
```ini
# Server
PORT=3000
NODE_ENV=development

# JWT Security
JWT_SECRET=super-secret-shop-jwt-key-2026-production-grade
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=super-secret-shop-jwt-refresh-key-2026-production-grade
JWT_REFRESH_EXPIRES_IN=30d

# MongoDB Atlas or Local Database
MONGODB_URI=mongodb://127.0.0.1:27017/shop

# Redis Caching (Optional - falls back to high-speed in-memory engine)
REDIS_URL=redis://127.0.0.1:6379

# Razorpay Payment Gateway (Optional - falls back to mock sandbox mode)
RAZORPAY_KEY_ID=rzp_test_YOUR_KEY_ID
RAZORPAY_KEY_SECRET=YOUR_KEY_SECRET
RAZORPAY_WEBHOOK_SECRET=YOUR_WEBHOOK_SECRET

# AWS S3 Cloud Storage (Optional - falls back to local uploads/ directory)
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
AWS_REGION=ap-south-1
AWS_S3_BUCKET=freshcart-production-media-assets
CLOUDFRONT_URL=https://d123456abcdef8.cloudfront.net

# Store Location & Tax (Indian GST)
STORE_STATE=Maharashtra
STORE_PINCODE=400001
MAX_COD_AMOUNT=10000

# Logistics Fleet
FLEET_NAME=FreshCart Express Fleet
WAREHOUSE_ADDRESS=Central Fulfillment Hub, Sector 4, Ghaziabad, UP - 201014
SUPPORT_PHONE=1800-FRESH-CART
```

### Client (`client/.env`)
```ini
VITE_API_URL=http://localhost:3000
```

---

## 10. Quickstart & Local Development

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **MongoDB**: Local MongoDB on port 27017 or MongoDB Atlas connection string

### 1. Install Dependencies
```bash
# Install backend dependencies
cd backend
npm install

# Install client dependencies
cd ../client
npm install
```

### 2. Seed Initial Catalog, Coupons & Super Admin
```bash
cd backend
node scripts/seedCouponsAndBanners.js
node scripts/restockAll.js
```

### 3. Start Backend & Client Dev Servers
```bash
# Terminal 1: Backend Server (runs on http://localhost:3000)
cd backend
npm start

# Terminal 2: Client Storefront (runs on http://localhost:5173)
cd client
npm run dev
```

### 4. Default Super Admin Credentials
- **Phone**: `9161955178`
- **Password**: `admin`
- **Portal**: [http://localhost:5173/login](http://localhost:5173/login) (Toggle **Super Admin** or click **Auto-fill**)

---

## 11. Production Deployment (AWS EC2 + PM2 + Nginx)

1. **Build Client Bundle**:
   ```bash
   cd client
   npm run build
   ```
2. **Start API with PM2**:
   ```bash
   cd backend
   pm2 start index.js --name "freshcart-api" -i max
   pm2 save
   ```
3. **Configure Nginx**:
   Link `deploy/nginx.conf` to `/etc/nginx/sites-enabled/` and reload:
   ```bash
   sudo nginx -t && sudo systemctl reload nginx
   ```
