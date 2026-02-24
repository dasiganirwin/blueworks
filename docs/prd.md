# BlueWork PRD

**Product Name:** BlueWork (working title)  
**Target Users:** Skilled workers (plumbers, electricians, carpenters, welders, etc.) and customers/businesses needing on-demand skilled labor.  
**Document Version:** 1.0  
**Date:** 23 Feb 2026  

---

## 1. Vision
To create a mobile-first platform that connects skilled blue-collar workers with individuals or businesses who need services on-demand or scheduled. The platform should ensure reliability, safety, and convenience for both parties.

---

## 2. MVP Goals
The MVP will focus on the core functionality required to facilitate quick, trustworthy matches between skilled workers and customers:

1. **Customer side:** Find, book, and pay skilled workers quickly.  
2. **Worker side:** Accept jobs, manage availability, and receive payments seamlessly.  
3. **Admin side:** Moderate users, view transactions, and handle disputes.

**Excluded in MVP:** Advanced features like gamification, reviews filtering, or AI-powered job suggestions.

---

## 3. Key Features

### 3.1 Customer App (Mobile-first)
- Signup/Login: Email, phone number, or social login.  
- Browse Services: Categories of skilled workers (Plumber, Electrician, Carpenter, etc.).  
- Job Request: Input job details (description, photos, location, urgency).  
- Worker Matching: Show nearby workers available in real-time.  
- Booking & Scheduling: Option to book immediately or schedule later.  
- In-App Chat/Call: Basic communication with worker.  
- Payment: Card, e-wallet, or cash-on-service (with payment tracking).  
- Job Status Tracking: Worker en route, started, completed.

### 3.2 Worker App (Mobile-first)
- Signup/Login: Verification (ID, certifications, phone number).  
- Job Dashboard: View available jobs, accept/reject requests.  
- Navigation: Map integration to customer location.  
- Job Status Update: Accept, start, complete jobs.  
- Earnings: Track completed jobs and payment history.

### 3.3 Admin Dashboard (Web)
- User Management: Approve workers, manage customer accounts.  
- Transaction Monitoring: Track completed jobs and payments.  
- Dispute Resolution: Resolve complaints or payment issues.  
- Analytics: Job frequency, active workers, revenue metrics.

---

## 4. MVP Scope

| Feature               | MVP Inclusion | Notes                                   |
|-----------------------|---------------|----------------------------------------|
| Customer signup/login | ✅            | Email & phone only                      |
| Worker signup/login   | ✅            | Basic verification; no full background check |
| Job request           | ✅            | Text + optional photo, location         |
| Job matching          | ✅            | Based on proximity & worker availability |
| Payment               | ✅            | Basic in-app payment + cash option      |
| Worker dashboard      | ✅            | Accept/reject jobs, status updates      |
| Notifications         | ✅            | Push for job request, acceptance, completion |
| Admin dashboard       | ✅            | Basic management & reporting            |

**Excluded in MVP:**  
- Reviews and ratings  
- In-app document verification (optional certifications)  
- Advanced scheduling & recurring jobs  
- Worker ranking or gamification  
- AI-based job suggestion

---

## 5. User Flows (MVP)

### 5.1 Customer Flow
1. Customer opens app → logs in → selects service category.  
2. Inputs job details → uploads optional photo → chooses location → requests job.  
3. System matches nearby available workers → sends notification.  
4. Worker accepts → customer notified → job status updates in real-time.  
5. Job completed → payment processed → option to leave a review (optional for MVP).

### 5.2 Worker Flow
1. Worker opens app → logs in → sets availability.  
2. Receives job request → accepts/rejects.  
3. Navigates to customer → updates job status (en route, started, completed).  
4. Earnings updated in dashboard.

### 5.3 Admin Flow
1. Admin logs in → sees active jobs, pending verifications, and transactions.  
2. Can approve/reject workers or manage disputes.  
3. Can generate basic analytics reports.

---

## 6. Technical Requirements
- Platforms: iOS & Android (React Native for cross-platform MVP)  
- Backend: Node.js + Express or Nest.js  
- Database: PostgreSQL or Firebase  
- Real-time features: WebSocket or Firebase Realtime Database (for job requests)  
- Maps & Location: Google Maps API or Mapbox  
- Payment Gateway: Stripe, PayPal, or local e-wallet integrations

---

## 7. Success Metrics (MVP)
- Number of active users (workers & customers)  
- Average response time for job acceptance  
- Completed job rate  
- Payment success rate  
- User satisfaction feedback

---

## 8. Roadmap Beyond MVP
- Ratings & reviews  
- Verification of worker skills & certifications  
- Recurring/contract jobs for businesses  
- In-app dispute resolution  
- Advanced analytics & AI job suggestions