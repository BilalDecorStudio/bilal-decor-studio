# Bilal Decor Studio — Complete Architecture & Agent Handoff Guide

> **Document Type:** Agent-to-Agent Handoff & Technical Project Reference  
> **Target Audience:** Future Antigravity AI Agents, Senior Developers, and Project Architects  
> **Business:** Bilal Decor Studio (B2B Marquee Ceilings & Stage Fabric Manufacturer)  
> **Hub:** Lahore & Gujranwala Marquee Market Hub, Punjab, Pakistan  
> **Primary Language Standard:** Conversational, Everyday **Roman Urdu**  
> **Last Updated:** November 2026  

---

## 📋 Table of Contents
1. [Business Model & Core Purpose](#1-business-model--core-purpose)
2. [Strict Guidelines for Any Future AI Agent](#2-strict-guidelines-for-any-future-ai-agent)
3. [Technology Stack & Zero-Dependency Setup](#3-technology-stack--zero-dependency-setup)
4. [Complete Project File Tree](#4-complete-project-file-tree)
5. [Enterprise Security & Anti-Hacker Architecture](#5-enterprise-security--anti-hacker-architecture)
6. [BDS Smart AI Delivery Estimator & Production Scheduler](#6-bds-smart-ai-delivery-estimator--production-scheduler)
7. [Visual Design & 3D Interactive UX System](#7-visual-design--3d-interactive-ux-system)
8. [Core Feature Breakdown & Workflow](#8-core-feature-breakdown--workflow)
9. [Database, Excel (.XLSX) & Machine Learning Dataset](#9-database-excel-xlsx--machine-learning-dataset)
10. [Client & Admin Portals Walkthrough](#10-client--admin-portals-walkthrough)
11. [How to Run, Test & Maintain](#11-how-to-run-test--maintain)
12. [Future Roadmap (Phase 2 & Phase 3)](#12-future-roadmap-phase-2--phase-3)

---

## 1. Business Model & Core Purpose

**Bilal Decor Studio (BDS)** is a specialized B2B manufacturing workshop based in Lahore & Gujranwala, Pakistan. They manufacture heavy decorative fabrics and ceiling canopies for:
1. **Stage Chadrein (Stage Ceilings / Backdrops):** Royal velvet, pleats, hooks, embroidery, and fall drapery positioned above the bridal/event stage.
2. **Main Hall Ceilings (Pandaal / Marquee Roof):** Large dual-tone champagne silk and jersey drapes for marquee banquet roofs (ranging from 1,000 to 10,000+ sq ft).
3. **Entrance Rahdari Canopies:** Grand corridor fabric tunnels for wedding entrances.

### B2B Wholesale Pricing
- Pricing is calculated strictly **per square foot (`Rate per Sq. Ft`)** multiplied by the total area (`Length × Width in feet`).
- Clients are marquee decorators, wedding hall owners, and event planners across Pakistan (Lahore, Gujranwala, Faisalabad, Multan, Rawalpindi, Islamabad, Sialkot, Sargodha, Karachi, etc.).
- Delivery is handled through regional freight transport (**Adda / Cargo Bilty system** like Niazi Express, Badami Bagh Cargo, etc.).

---

## 2. Strict Guidelines for Any Future AI Agent

> [!IMPORTANT]
> **READ CAREFULLY BEFORE WRITING ANY CODE OR COPY:**
> 1. **Language Standard:** The entire website and all user interactions **MUST BE in simple, conversational Roman Urdu**.
>    - **DO NOT** use raw English sentences for user-facing UI labels.
>    - **DO NOT** use difficult, archaic, literary Urdu words (e.g., avoid *"Markazi Page"*, *"Fi Murabba Foot"*, *"Zair-e-Jaiza"*, *"Halya Mukammal"*).
>    - **USE EVERYDAY COLLOQUIAL TERMS:**
>      - `Home Page` (not Markazi Page)
>      - `Designs aur Wholesale Rates` (not Catalog)
>      - `Size aur Bill Calculator` (not Dimension Estimator)
>      - `Pichla Kaam aur Reviews` (not Halya Karkardagi)
>      - `Order Status Check Karein` (not Order Tracking)
>      - `Square Feet Rate` (not Fi Murabba Foot)
>      - `Kul Bill (Total Bill)` (not Kul Raqam)
>      - `Advance Wasool Shuda` (not Advance Paid)
>      - `Baqaya Raqam` (not Balance Due)
>      - `Cart me Daalein` (not Add to Cart)
>      - `WhatsApp par Rabta` (not WhatsApp CTA)
> 2. **NO Native Browser Alerts (`window.alert` is banned):**
>    - Always use the custom 3D in-app popup system (`Popup.show(...)` or `window.alert(...)` which is automatically intercepted by `popup.js`). Never allow Google Chrome's native ugly alert box to pop up.
> 3. **NO Hardcoded Admin Passwords in Frontend:**
>    - Admin credentials are authenticated strictly on the Node.js backend using salted PBKDF2 hashes. Never restore client-side password checks in `data.js`.

---

## 3. Technology Stack & Zero-Dependency Setup

To ensure instant portability across any machine or Antigravity instance without installation hassles, the backend relies purely on **native Node.js built-ins** (Zero external `npm install` requirements):

| Layer | Technology | Purpose |
|---|---|---|
| **Backend Server** | Node.js Built-in (`http`, `fs`, `path`, `crypto`) | HTTP file server, secure REST APIs, and cryptographic engine. |
| **Styling & CSS** | Tailwind CSS (CDN) + Custom `style.css` | Luxury Warm Ivory (`#FDFBF8`) & Royal Gold (`#C59A3F`) palette with custom 3D depth classes. |
| **3D Engine** | Vanilla JS (`tilt3d.js` + `style.css`) | Parallax card perspective on mousemove, 3D button lip press states. |
| **Popups & Dialogs** | Custom DOM Modal (`popup.js`) | 3D in-app alerts and notifications with animated badges. |
| **Business Analytics**| Chart.js (v4.4.1 CDN) | Interactive sales combo bar/line graphs, city donut charts, category distribution. |
| **Excel Export** | SheetJS (xlsx.full.min.js CDN) | Native `.xlsx` download with auto-fitted columns. |
| **PDF Invoices** | html2pdf.js (v0.10.1 CDN) | Client-side vector PDF generation for invoices and thermal receipts. |
| **AI Estimator** | Custom Algorithm (`ai_scheduler.js`) | Smart dynamic production duration and calendar dispatch calculator. |
| **Data Persistence**| Local JSON & CSV (`database/`) + LocalStorage | Dual server-side file persistence and offline-first client cache. |

---

## 4. Complete Project File Tree

```
Bilal Decor Studio/
├── index.html                     # Unified single-page application (All views, modals & components)
├── server.js                      # Secure Node.js HTTP server (APIs, PBKDF2 Auth, Rate Limiter)
├── PROJECT_OVERVIEW.md            # This master architecture and handoff document
├── assets/
│   ├── css/
│   │   └── style.css              # 3D elevation, tactile buttons, gold foil gradients, print styles
│   ├── images/
│   │   ├── logo.svg               # Modern minimalist circular gold monogram crest logo
│   │   ├── logo-icon.svg          # Favicon / standalone monogram emblem
│   │   ├── royal_gold_ceiling.jpg # Bestseller Stage Chadar fabric photography
│   │   └── emerald_hall_ceiling.jpg # Emerald & champagne dual-tone hall canopy
│   └── js/
│       ├── ai_scheduler.js        # BDS Smart AI Delivery Estimator & Production Scheduler
│       ├── popup.js               # Custom 3D in-app modal popup & toast system (overrides alert)
│       ├── tilt3d.js              # Real-time 3D card tilt and perspective engine
│       ├── data.js                # Core products, seeded orders, reviews & client history
│       ├── calculator.js          # Area math, preset pills, PKR currency formatting
│       ├── invoice.js             # Professional B2B PDF invoice & printable bill generator
│       ├── tracker.js             # Live order tracker with PIN & active production pipeline
│       ├── database.js            # Customer database, SheetJS Excel (.XLSX) & ML CSV exporter
│       ├── analytics.js           # Chart.js business analytics & sales turnover reports
│       ├── admin.js               # Admin portal logic, custom order draft, password security
│       └── app.js                 # App router, cart controller, modal orchestrator, events
└── database/
    ├── admin_auth.json            # Salted PBKDF2 SHA-512 master credentials (NIST compliant)
    ├── customers.json             # JSON database of customer leads and completed orders
    ├── customers.csv              # Machine Learning compatible CSV dataset (18 columns)
    └── security_audit.log         # Persistent security telemetry log (IPs, events, lockouts)
```

---

## 5. Enterprise Security & Anti-Hacker Architecture

To guarantee zero security breaches, unauthorized admin access and data leakage are blocked at the server level:

```
[Incoming Request]
        │
        ▼
[HTTP Security Headers] (X-Content-Type-Options, X-Frame-Options, X-XSS-Protection)
        │
        ▼
[Path Traversal Guard] (Ensures path stays within root directory; blocks traversal)
        │
        ▼
[Route Dispatcher]
 ├── /api/admin/login ──────► [Anti-Brute-Force Rate Limiter] (5 failed tries = 15m Lockout)
 │                                    │
 │                                    ▼
 │                            [PBKDF2 SHA-512 Hash Check] (10,000 rounds + random salt)
 │                                    │
 │                                    ▼
 │                            [Crypto 64-char Session Token] (12-hour expiration)
 │
 ├── /api/customers ────────► [Bearer Token Verification] ──► Blocked (HTTP 401) if not Admin
 ├── /api/export-csv ───────► [Bearer Token Verification] ──► Blocked (HTTP 401) if not Admin
 └── /api/save-customer ────► [Formula & XSS Sanitization] ──► Safe append to CSV & JSON
```

### Key Security Features:
1. **No Frontend Passwords:** `data.js` and client bundles contain zero passwords.
2. **PBKDF2 SHA-512 with Salt:** Passwords are never stored in plaintext. `database/admin_auth.json` contains only the salt and hash.
3. **Anti-Brute-Force Rate Limiting:**
   - 5 incorrect password attempts from an IP trigger an automatic **15-minute freeze** (`HTTP 429 Too Many Requests`).
   - The user interface notifies the admin how many attempts remain before lockout.
4. **Bearer Token Session Guard:**
   - On successful login, the server issues a 64-character random hex token (`crypto.randomBytes(32)`).
   - Sensitive endpoints (`/api/customers`, `/api/export-csv`) return `HTTP 401 Unauthorized` unless a valid token is provided in headers.
5. **Security Telemetry (`database/security_audit.log`):**
   - Every login attempt (success or failure), IP address, and password change is permanently recorded with timestamps.
6. **In-App Password Management:**
   - The admin can update the password directly in the Admin Settings tab. The backend verifies the old password before applying the new hash.

---

## 6. BDS Smart AI Delivery Estimator & Production Scheduler

The file `assets/js/ai_scheduler.js` implements a dynamic production estimation engine based on actual workshop rules:

### Mathematical Rules:
$$\text{Estimated Days} = \text{Base Days} + \text{Volume Extra} + \text{Queue Extra} + \text{Area Extra}$$

1. **Base Manufacturing Duration:**
   - Standard orders of **1 to 3 chadrein** require **5 to 6 working days** under normal conditions.
2. **Order Volume Rule (User Specification):**
   - For every additional chadar beyond 3:
     $$\text{Volume Extra} = (\text{Quantity} - 3) \times 1\text{ Day}$$
     - 4 Chadrein $\rightarrow$ 6 to 7 working days (+1 day)
     - 5 Chadrein $\rightarrow$ 7 to 8 working days (+2 days)
     - 6 Chadrein $\rightarrow$ 8 to 9 working days (+3 days)
3. **Factory Queue Workload Rule (User Specification):**
   - The AI inspects active orders currently occupying cutting and stitching stations (statuses: `cutting`, `stitching`, `verified`).
   - If **$\ge 5$ active orders** are in the queue:
     $$\text{Queue Extra} = \left\lfloor \frac{\text{Active Queue}}{5} \right\rfloor \times 2\text{ Days}$$
     - 5 to 9 active orders $\rightarrow$ +2 days
     - 10 to 14 active orders $\rightarrow$ +4 days
4. **Mega-Fabric Area Rule:**
   - Total Area $> 2,500\text{ sq ft} \rightarrow +1\text{ Day}$ (multi-seam reinforcement).
   - Total Area $> 5,000\text{ sq ft} \rightarrow +2\text{ Days}$ (industrial double-run pleating and QC).
5. **Dynamic Calendar Target Date:**
   - Calculates the target delivery date from the current date, automatically **skipping Sundays** (e.g., `28 Nov 2026`).

### User Interface Integrations:
- **Product Detail Modal:** Real-time dynamic card updates as length, width, or quantity change.
- **Standalone Calculator Page:** Embedded beneath the price breakdown.
- **Cart & Checkout Modal:** Computes aggregate workload for all items in the cart.
- **Order Tracking & Invoices:** The AI-calculated dispatch timeframe is permanently saved into `order.expectedDispatch` and printed on official invoices.
- **Admin Custom Order Creator:** Shows live AI estimates while the admin books custom client orders.

---

## 7. Visual Design & 3D Interactive UX System

### Palette:
- **Background Main:** `#FDFBF8` (Warm Ivory)
- **Primary Navy / Slate:** `#0F172A` (Midnight Slate)
- **Luxury Gold:** `#C59A3F` (Primary), `#8E6B1E` (Dark Border), `#F9F2E2` (Soft Tint)
- **Emerald Green:** `#065F46` (Success & WhatsApp actions)

### Tactile 3D Styling:
- **Physical Button Lip (`.btn-3d-gold`, `.btn-3d-emerald`, `.btn-3d-dark`):**
  Buttons have a solid 4px beveled base shadow. When clicked, `:active` physically depresses by `top: 3px` with reduced shadow, creating genuine tactile feedback.
- **Parallax Mouse Tilt (`assets/js/tilt3d.js`):**
  Product cards and luxury containers smoothly rotate along X and Y axes on mouse cursor movement (`perspective: 1000px`, max 7° tilt, spring return).
- **Custom 3D In-App Popups (`assets/js/popup.js`):**
  Replaces all browser alerts with luxury 3D modal cards featuring animated 3D badge icons (`✓`, `⚠️`, `✨`, `✕`) and smooth `popup3DIn` scale-in physics.

---

## 8. Core Feature Breakdown & Workflow

### 1. Navigation & Header
- Sticky header with minimal gold monogram logo.
- Announcement bar highlighting B2B rates and nationwide cargo delivery.
- Quick navigation: *Home Page*, *Designs aur Wholesale Rates*, *Size aur Bill Calculator*, *Pichla Kaam aur Reviews*, *Order Status Check Karein*, *Cart Icon*, *WhatsApp Rabta*.

### 2. Catalog & Product Cards
- Wholesale rate badge (`Rs. 65 / sq. ft`).
- Dimensions, ratings, category tags, and bestseller ribbons.
- "📐 Size aur Bill Calculate" button opening the full calculation modal.

### 3. Dynamic Calculation Modal
- Length & Width inputs (in feet) with instantaneous square feet area calculation.
- Preset pills for fast quotation:
  - *Stage:* 40 × 25 ft (1,000 sq ft)
  - *Main Hall:* 60 × 40 ft (2,400 sq ft)
  - *Rahdari Corridor:* 80 × 15 ft (1,200 sq ft)
- Live Smart AI Estimator showing dispatch duration and target date.
- One-click *Cart me Daalein* and *Direct WhatsApp* actions.
- Client reviews section with review submission form.

### 4. Cart & Checkout Modal
- Displays selected items with dimensions, rates, and totals.
- Displays combined AI delivery estimate.
- Customer form: Name, WhatsApp number, City, Marquee name, and Cargo adda address.
- Official payment details: Meezan Bank, JazzCash, EasyPaisa accounts with one-click copy buttons.
- Confirm button generates a unique Order ID (`BDS-XXXX`) and 4-digit PIN (`XXXX`), saves to database, and pre-fills a formatted WhatsApp slip.

### 5. Order Tracking & Active Pipeline
- **Search:** Lookup order by Order ID or Client Phone Number + PIN.
- **Visual Progress Timeline:**
  1. *Order Mosool Hua* (Pending)
  2. *Payment Confirm* (Advance Verified)
  3. *Fabric Cutting* (Katai Shuru)
  4. *Silai aur Finishing* (Stitching & QC)
  5. *Cargo Rawangi* (Dispatched via Adda)
- **Active Orders Pipeline:** Cards showing current jobs in production for transparency.

---

## 9. Database, Excel (.XLSX) & Machine Learning Dataset

Customer orders and leads are automatically recorded into dual formats in `database/`:

1. **`customers.json`:** Structured document storage used by the frontend and admin.
2. **`customers.csv`:** Clean 18-column tabular dataset structured for Machine Learning model training:
   ```csv
   Customer_ID,Date,Customer_Name,Phone,City,Marquee_Name,Design_Title,Category,Length_ft,Width_ft,Total_SqFt,Rate_Per_SqFt,Quantity,Total_Amount_PKR,Advance_Paid_PKR,Balance_Due_PKR,Payment_Status,Order_Status
   ```
   *Usage:* Ready for Python Pandas / Scikit-Learn / TensorFlow for demand forecasting and price regression.

3. **Native Excel (.XLSX) Export:**
   - Powered by SheetJS (`xlsx.full.min.js`).
   - One-click download from Admin Database tab with auto-fitted column widths and styled currency numbers.

---

## 10. Client & Admin Portals Walkthrough

### Admin Access
- Access URL: `#admin`
- Default Master Password: `bilal123` (Changeable via Admin Settings)

### Admin Tabs:
1. **📦 Orders Management:**
   - KPI counters: Pending, In-Production, Completed, Total Revenue.
   - Live orders table with search and status dropdown (`Pending`, `Advance Payment Confirm`, `Kapre ki Katai`, `Silai Chalu`, `Cargo par Rawana`, `Delivery Mukammal`).
   - Actions: **📄 PDF Bill**, **💬 WhatsApp**, **🗑️ Delete**.
2. **📈 Sales Graphs aur Munafa Report:**
   - Monthly Sales Turnover combo chart (PKR Turnover vs Sq Ft Fabric Produced).
   - City-Wise Market Share donut chart.
   - Product Category Breakdown horizontal bar chart.
3. **🛠️ Admin Order Creator:**
   - Allows factory management to enter custom orders taken over phone calls or factory visits.
   - Select design or custom fabric, enter length, width, rate, quantity, and advance payment.
   - Generates official order and tracking PIN instantly.
4. **🏷️ Designs & Rates:**
   - Add new fabric designs, modify square foot rates, upload images, and set featured badges.
5. **📊 Customer Database:**
   - Searchable B2B customer records.
   - **Download Excel (.XLSX)**, **Download ML Dataset (.CSV)**, and **JSON Backup**.
6. **⚙️ Bank Accounts & Security Settings:**
   - Update WhatsApp number, bank account details, JazzCash/EasyPaisa numbers, and header video embed URLs.
   - **🛡️ Admin Security & Password Control:** Live security telemetry badge, old password verification, and new password encryption.

---

## 11. How to Run, Test & Maintain

### 1. Starting the Server
```bash
# In the project root directory:
node server.js
```
- Console Output:
  ```
  Bilal Decor Studio secure server running at http://localhost:3000
  [Security] PBKDF2 Password Hashing & Anti-Brute-Force Rate Limiting Active.
  ```

### 2. Testing Endpoints
```bash
# Test public access to customers endpoint (Should return HTTP 401 Unauthorized):
curl -i http://localhost:3000/api/customers

# Test admin login (Returns 64-char crypto token):
curl -X POST http://localhost:3000/api/admin/login \
     -H "Content-Type: application/json" \
     -d '{"password":"bilal123"}'
```

---

## 12. Future Roadmap (Phase 2 & Phase 3)

When continuing this project in future sessions or another Antigravity instance, consider implementing:
1. **Cloud Database Sync:** Connect `server.js` with PostgreSQL or Supabase for multi-branch factory synchronization.
2. **Automated WhatsApp Business API:** Auto-dispatch cargo tracking bilty pictures to customer WhatsApp when order status changes to `dispatched`.
3. **Fabric Inventory Counter:** Deduct raw velvet and satin meter rolls in real-time as cutting starts.
4. **ML Sales Demand Predictor:** Use Python script on `customers.csv` to predict winter wedding season fabric demand (November – February).

---

> **Handoff Note for Incoming Agent:**  
> Bilal Decor Studio is a live, production-tested B2B web application. When adding new features, maintain the warm ivory & royal gold visual standard, use natural everyday Roman Urdu, and respect the server-side PBKDF2 security architecture.s
