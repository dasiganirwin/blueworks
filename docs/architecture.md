# Architecture for BlueWork

## 1. Overview
The architecture for BlueWork is designed to support a mobile-first, real-time platform connecting skilled blue-collar workers with customers. It is scalable, secure, and integrates key services like Supabase, payment gateways, and mapping APIs.

### Goals
- Real-time job matching
- Secure user authentication and data storage
- Seamless payment processing
- Modular architecture for future feature expansion

---

## 2. System Components

### 2.1 Client Applications
**Customer App (Mobile)**
- Built with React Native / Next.js (mobile-first design)
- Core features: Browse services, request jobs, track status, make payments, chat with workers

**Worker App (Mobile)**
- Built with React Native / Next.js (mobile-first design)
- Core features: Job dashboard, accept/reject jobs, navigation, status updates, earnings tracking

**Admin Dashboard (Web)**
- Built with Next.js
- Core features: User management, transaction monitoring, dispute resolution, analytics

### 2.2 Backend Services
**Next.js API Routes / Supabase Functions**
- Handles all API endpoints for customer, worker, and admin actions
- Interfaces with Supabase database for data storage and retrieval

**Supabase**
- PostgreSQL database for user profiles, job requests, transactions, and payments
- Authentication (email/password, OAuth)
- Real-time subscriptions for job status updates

**Payment Gateway**
- Stripe / PayPal integration for in-app payments
- Supports cash-on-service tracking

**Third-party APIs**
- Google Maps / Mapbox for location and navigation
- Resend API for email notifications

---

## 3. Data Flow
1. **Customer requests a job** → request sent via Next.js API → stored in Supabase → triggers real-time notification to nearby available workers.
2. **Worker accepts job** → status updated in Supabase → customer receives real-time update.
3. **Job completion** → worker marks job as complete → triggers payment processing → updates earnings and transaction logs.
4. **Admin monitoring** → real-time dashboard fetches job statuses, transactions, and user activity from Supabase.

---

## 4. Database Schema (Core Tables)
- **Users:** user_id, name, role (customer/worker/admin), contact, certifications
- **Jobs:** job_id, customer_id, worker_id, description, location, status, scheduled_time, created_at
- **Transactions:** transaction_id, job_id, amount, status, payment_method, created_at
- **Notifications:** notification_id, user_id, message, read_status, created_at

---

## 5. Technology Stack
- **Frontend:** React Native, Next.js, Tailwind CSS
- **Backend:** Next.js API routes, Node.js/Express (optional), Supabase Functions
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **Real-time Communication:** Supabase Realtime / WebSockets
- **Payments:** Stripe / PayPal
- **Notifications:** Push notifications via Firebase / Expo, Email via Resend API
- **Maps & Location:** Google Maps / Mapbox

---

## 6. Architecture Diagram (High-Level)
*(Diagram to be added in `/docs/diagrams/` folder)*
- Customer app ↔ Next.js API ↔ Supabase (Realtime + Auth + DB)
- Worker app ↔ Next.js API ↔ Supabase
- Admin dashboard ↔ Next.js API ↔ Supabase
- Payments ↔ Stripe / PayPal API
- Notifications ↔ Resend API / Push service

---

## 7. Notes
- The architecture is modular, allowing additional features like reviews, AI job matching, and recurring contracts to be added in future sprints.
- Security: All API requests are authenticated using Supabase Auth; sensitive keys are stored in environment variables.
- Real-time updates rely on Supabase Realtime subscriptions or WebSocket connections.