# BlueWork API Documentation

**Version:** v1
**Base URL:** `https://api.bluework.app/api/v1`
**Auth:** JWT Bearer token — include `Authorization: Bearer <token>` on all secured endpoints.

---

## Conventions

### Role Access
- `[public]` — no token required
- `[customer]` — customer JWT required
- `[worker]` — worker JWT required
- `[admin]` — admin JWT required
- `[any]` — any authenticated user

### Standard Error Envelope
All errors return:
```json
{
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Email or password is incorrect."
  }
}
```

### Pagination
List endpoints accept `?page=1&limit=20` and return:
```json
{
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 143
  }
}
```

### Job Status State Machine
```
pending → accepted → en_route → in_progress → completed
       ↘ cancelled (from pending or accepted only)
       ↘ disputed  (from in_progress or completed)
```

---

## 1. Auth

### `POST /auth/register` [public]
Register a new customer or worker account.

**Request**
```json
{
  "role": "customer | worker",
  "name": "Juan dela Cruz",
  "email": "juan@example.com",
  "phone": "+639171234567",
  "password": "Str0ngP@ss!",
  "skills": ["plumber", "welder"]  // worker only, optional at registration
}
```

**Response `201`**
```json
{
  "user": {
    "id": "usr_01",
    "role": "worker",
    "name": "Juan dela Cruz",
    "email": "juan@example.com",
    "phone": "+639171234567",
    "status": "pending_verification"
  },
  "message": "OTP sent to +639171234567"
}
```

**Errors**
| Status | Code | Reason |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Missing or malformed fields |
| 409 | `EMAIL_TAKEN` | Email already registered |
| 409 | `PHONE_TAKEN` | Phone already registered |

---

### `POST /auth/otp/send` [public]
Send or resend OTP to a phone number.

**Request**
```json
{ "phone": "+639171234567" }
```

**Response `200`**
```json
{ "message": "OTP sent.", "expires_in": 300 }
```

**Errors**
| Status | Code | Reason |
|---|---|---|
| 404 | `USER_NOT_FOUND` | Phone not registered |
| 429 | `RATE_LIMITED` | Too many OTP requests |

---

### `POST /auth/otp/verify` [public]
Verify OTP and activate account.

**Request**
```json
{ "phone": "+639171234567", "otp": "482910" }
```

**Response `200`**
```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "expires_in": 3600
}
```

**Errors**
| Status | Code | Reason |
|---|---|---|
| 400 | `INVALID_OTP` | Wrong or expired OTP |
| 410 | `OTP_EXPIRED` | OTP past 5-minute window |

---

### `POST /auth/login` [public]
Login with email/phone and password.

**Request**
```json
{
  "identifier": "juan@example.com",  // email or phone
  "password": "Str0ngP@ss!"
}
```

**Response `200`**
```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "expires_in": 3600,
  "user": {
    "id": "usr_01",
    "role": "worker",
    "name": "Juan dela Cruz",
    "status": "active"
  }
}
```

**Errors**
| Status | Code | Reason |
|---|---|---|
| 401 | `INVALID_CREDENTIALS` | Wrong email/password |
| 403 | `ACCOUNT_SUSPENDED` | User has been suspended |
| 403 | `PENDING_APPROVAL` | Worker not yet approved by admin |

---

### `POST /auth/token/refresh` [public]
Exchange a refresh token for a new access token.

**Request**
```json
{ "refresh_token": "eyJ..." }
```

**Response `200`**
```json
{
  "access_token": "eyJ...",
  "expires_in": 3600
}
```

**Errors**
| Status | Code | Reason |
|---|---|---|
| 401 | `INVALID_REFRESH_TOKEN` | Token invalid or expired |

---

### `POST /auth/password/forgot` [public]
Initiate password reset — sends reset link to email.

**Request**
```json
{ "email": "juan@example.com" }
```

**Response `200`**
```json
{ "message": "Reset link sent if account exists." }
```

---

### `POST /auth/password/reset` [public]
Complete password reset using token from email.

**Request**
```json
{
  "token": "abc123resettoken",
  "password": "NewStr0ng@Pass!"
}
```

**Response `200`**
```json
{ "message": "Password updated successfully." }
```

**Errors**
| Status | Code | Reason |
|---|---|---|
| 400 | `INVALID_RESET_TOKEN` | Token invalid or expired |

---

### `POST /auth/logout` [any]
Invalidate the current session token.

**Response `204`** — no body

---

## 2. Users

### `GET /users/me` [any]
Get the authenticated user's profile.

**Response `200`**
```json
{
  "id": "usr_01",
  "role": "customer",
  "name": "Maria Santos",
  "email": "maria@example.com",
  "phone": "+639181234567",
  "status": "active",
  "created_at": "2026-01-15T08:00:00Z"
}
```

---

### `PATCH /users/me` [any]
Update the authenticated user's profile.

**Request** _(all fields optional)_
```json
{
  "name": "Maria Santos-Reyes",
  "email": "maria.new@example.com",
  "phone": "+639189999999"
}
```

**Response `200`** — returns updated user object

**Errors**
| Status | Code | Reason |
|---|---|---|
| 409 | `EMAIL_TAKEN` | Email in use by another account |

---

### `DELETE /users/me` [any]
Request account deletion (soft delete, pending admin confirmation).

**Response `200`**
```json
{ "message": "Account deletion request submitted." }
```

---

### `GET /users` [admin]
List all users with optional filters.

**Query Params**
- `role` — `customer | worker | admin`
- `status` — `active | suspended | pending_verification | pending_approval`
- `page`, `limit`

**Response `200`** — paginated list of user objects

---

### `GET /users/:id` [admin]
Get any user by ID.

**Response `200`** — user object

**Errors**
| Status | Code | Reason |
|---|---|---|
| 404 | `USER_NOT_FOUND` | No user with that ID |

---

## 3. Workers

### `GET /workers/nearby` [customer]
Find available workers near a location.

**Query Params**
- `lat` _(required)_ — latitude
- `lng` _(required)_ — longitude
- `category` _(required)_ — e.g. `plumber`, `electrician`
- `radius` — search radius in km, default `10`

**Response `200`**
```json
{
  "data": [
    {
      "id": "usr_07",
      "name": "Pedro Reyes",
      "category": "plumber",
      "distance_km": 2.4,
      "rating": 4.8,
      "availability_status": "online",
      "lat": 14.5995,
      "lng": 120.9842
    }
  ]
}
```

**Errors**
| Status | Code | Reason |
|---|---|---|
| 400 | `MISSING_LOCATION` | lat/lng not provided |
| 404 | `NO_WORKERS_AVAILABLE` | No workers found in radius |

---

### `GET /workers/:id` [any]
Get a worker's public profile.

**Response `200`**
```json
{
  "id": "usr_07",
  "name": "Pedro Reyes",
  "skills": ["plumber", "pipe-fitter"],
  "rating": 4.8,
  "completed_jobs": 42,
  "availability_status": "online"
}
```

---

### `PATCH /workers/me/availability` [worker]
Toggle worker online/offline status.

**Request**
```json
{ "status": "online | offline | busy" }
```

**Response `200`**
```json
{ "availability_status": "online" }
```

---

### `PATCH /workers/me/location` [worker]
Update worker's current GPS coordinates (called periodically by the app).

**Request**
```json
{ "lat": 14.5995, "lng": 120.9842 }
```

**Response `200`**
```json
{ "updated_at": "2026-02-24T10:30:00Z" }
```

---

### `GET /workers/me/earnings` [worker]
Get earnings summary and transaction history.

**Query Params**
- `from` — ISO date string
- `to` — ISO date string
- `page`, `limit`

**Response `200`**
```json
{
  "summary": {
    "total_earned": 15400.00,
    "pending_payout": 1200.00,
    "currency": "PHP"
  },
  "data": [
    {
      "job_id": "job_99",
      "amount": 850.00,
      "method": "gcash",
      "paid_at": "2026-02-20T14:00:00Z"
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 42 }
}
```

---

## 4. Jobs

### `POST /jobs` [customer]
Create a new job request.

**Request**
```json
{
  "category": "plumber",
  "description": "Leaking pipe under kitchen sink.",
  "location": {
    "address": "123 Rizal St, Makati",
    "lat": 14.5547,
    "lng": 121.0244
  },
  "urgency": "immediate | scheduled",
  "scheduled_at": "2026-02-25T09:00:00Z"  // required if urgency = scheduled
}
```

**Response `201`**
```json
{
  "id": "job_01",
  "status": "pending",
  "category": "plumber",
  "description": "Leaking pipe under kitchen sink.",
  "location": {
    "address": "123 Rizal St, Makati",
    "lat": 14.5547,
    "lng": 121.0244
  },
  "urgency": "immediate",
  "created_at": "2026-02-24T10:00:00Z"
}
```

**Errors**
| Status | Code | Reason |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Missing required fields |
| 422 | `SCHEDULED_TIME_INVALID` | scheduled_at is in the past |

---

### `POST /jobs/:id/photos` [customer]
Upload photos for a job (multipart form).

**Request** — `multipart/form-data`
- `photos` — up to 5 image files (JPEG/PNG, max 5MB each)

**Response `200`**
```json
{
  "photos": [
    "https://cdn.bluework.app/jobs/job_01/photo_1.jpg"
  ]
}
```

**Errors**
| Status | Code | Reason |
|---|---|---|
| 400 | `TOO_MANY_PHOTOS` | More than 5 files uploaded |
| 413 | `FILE_TOO_LARGE` | A file exceeds 5MB |
| 415 | `UNSUPPORTED_FILE_TYPE` | Non-image file uploaded |

---

### `GET /jobs` [any]
List jobs. Results are scoped by role automatically.
- Customer sees their own jobs.
- Worker sees available (pending) jobs in their area + their accepted jobs.
- Admin sees all jobs.

**Query Params**
- `status` — filter by status
- `category` — filter by category
- `page`, `limit`

**Response `200`** — paginated list of job objects

---

### `GET /jobs/nearby` [worker]
Get pending jobs near the worker's current location.

**Query Params**
- `lat` _(required)_
- `lng` _(required)_
- `radius` — km, default `10`

**Response `200`** — list of nearby pending job objects

---

### `GET /jobs/:id` [any]
Get full details of a job. Workers and customers can only access jobs they are party to; admins can access all.

**Response `200`**
```json
{
  "id": "job_01",
  "status": "in_progress",
  "category": "plumber",
  "description": "Leaking pipe under kitchen sink.",
  "photos": ["https://cdn.bluework.app/jobs/job_01/photo_1.jpg"],
  "location": {
    "address": "123 Rizal St, Makati",
    "lat": 14.5547,
    "lng": 121.0244
  },
  "urgency": "immediate",
  "customer": { "id": "usr_03", "name": "Maria Santos" },
  "worker": { "id": "usr_07", "name": "Pedro Reyes" },
  "created_at": "2026-02-24T10:00:00Z",
  "accepted_at": "2026-02-24T10:05:00Z",
  "started_at": "2026-02-24T10:45:00Z",
  "completed_at": null
}
```

**Errors**
| Status | Code | Reason |
|---|---|---|
| 403 | `FORBIDDEN` | User is not party to this job |
| 404 | `JOB_NOT_FOUND` | No job with that ID |

---

### `PATCH /jobs/:id/status` [worker, customer]
Transition a job to the next status. Allowed transitions per role:

| Role | Allowed Transitions |
|---|---|
| Worker | `pending → accepted`, `accepted → en_route`, `en_route → in_progress`, `in_progress → completed` |
| Customer | `pending → cancelled`, `accepted → cancelled` (within cancellation window) |

**Request**
```json
{ "status": "accepted" }
```

**Response `200`** — updated job object

**Errors**
| Status | Code | Reason |
|---|---|---|
| 400 | `INVALID_TRANSITION` | Status change not allowed from current state |
| 403 | `FORBIDDEN` | Role not permitted to make this transition |
| 409 | `JOB_ALREADY_TAKEN` | Another worker accepted first (race condition) |
| 422 | `CANCELLATION_WINDOW_EXPIRED` | Customer can no longer cancel |

---

### `DELETE /jobs/:id` [admin]
Hard delete a job record (admin only, for moderation).

**Response `204`** — no body

---

## 5. Payments

### `POST /payments/initiate` [customer]
Initiate payment for a completed job.

**Request**
```json
{
  "job_id": "job_01",
  "method": "card | gcash | maya | cash",
  "amount": 850.00,
  "currency": "PHP"
}
```

**Response `201`**
```json
{
  "id": "pay_01",
  "status": "pending",
  "method": "gcash",
  "amount": 850.00,
  "currency": "PHP",
  "payment_url": "https://checkout.stripe.com/...",  // null for cash
  "expires_at": "2026-02-24T11:00:00Z"
}
```

**Errors**
| Status | Code | Reason |
|---|---|---|
| 400 | `JOB_NOT_COMPLETED` | Job must be completed before payment |
| 409 | `ALREADY_PAID` | Payment already processed for this job |

---

### `GET /payments/:id` [any]
Get payment status. Customers and workers see only payments for their own jobs.

**Response `200`**
```json
{
  "id": "pay_01",
  "job_id": "job_01",
  "status": "completed | pending | failed | refunded",
  "method": "gcash",
  "amount": 850.00,
  "currency": "PHP",
  "gateway_transaction_id": "ch_3abc123",
  "paid_at": "2026-02-24T10:55:00Z"
}
```

---

### `POST /payments/webhook` [public — gateway signed]
Receive payment status callbacks from Stripe/PayPal. Verified by signature header.

**Headers**
- `Stripe-Signature` or `PayPal-Transmission-Sig`

**Request** — gateway-specific payload (pass-through)

**Response `200`** — must respond within 5s or gateway will retry

---

### `POST /payments/:id/cash-confirm` [worker]
Worker confirms cash was received for a cash-method job.

**Response `200`**
```json
{ "status": "completed", "confirmed_at": "2026-02-24T11:10:00Z" }
```

**Errors**
| Status | Code | Reason |
|---|---|---|
| 400 | `NOT_CASH_PAYMENT` | Payment method is not cash |
| 403 | `FORBIDDEN` | Only the assigned worker can confirm |

---

### `POST /payments/:id/refund` [admin]
Issue a full or partial refund for a payment.

**Request**
```json
{
  "amount": 850.00,   // partial refund if less than original
  "reason": "Worker did not complete the job."
}
```

**Response `200`**
```json
{
  "refund_id": "ref_01",
  "amount": 850.00,
  "status": "processing",
  "estimated_return": "3-5 business days"
}
```

---

## 6. Notifications

### `GET /notifications` [any]
Get notifications for the authenticated user.

**Query Params**
- `read` — `true | false` to filter by read status
- `page`, `limit`

**Response `200`**
```json
{
  "data": [
    {
      "id": "notif_01",
      "type": "job_accepted",
      "title": "Worker is on the way",
      "body": "Pedro Reyes has accepted your job.",
      "payload": { "job_id": "job_01" },
      "read": false,
      "created_at": "2026-02-24T10:05:00Z"
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 5 }
}
```

---

### `PATCH /notifications/:id/read` [any]
Mark a single notification as read.

**Response `200`**
```json
{ "id": "notif_01", "read": true }
```

---

### `PATCH /notifications/read-all` [any]
Mark all notifications as read.

**Response `200`**
```json
{ "marked_read": 5 }
```

---

## 7. Messages (In-Job Chat)

### `GET /jobs/:id/messages` [customer, worker]
Get chat messages for a job. Only parties to the job can access.

**Query Params**
- `page`, `limit`

**Response `200`**
```json
{
  "data": [
    {
      "id": "msg_01",
      "sender_id": "usr_03",
      "sender_name": "Maria Santos",
      "content": "Can you come before noon?",
      "sent_at": "2026-02-24T10:10:00Z"
    }
  ],
  "meta": { "page": 1, "limit": 50, "total": 3 }
}
```

---

### `POST /jobs/:id/messages` [customer, worker]
Send a message in a job's chat thread.

**Request**
```json
{ "content": "I'll be there by 10:30 AM." }
```

**Response `201`**
```json
{
  "id": "msg_02",
  "sender_id": "usr_07",
  "content": "I'll be there by 10:30 AM.",
  "sent_at": "2026-02-24T10:12:00Z"
}
```

**Errors**
| Status | Code | Reason |
|---|---|---|
| 403 | `FORBIDDEN` | User is not party to this job |
| 422 | `JOB_CLOSED` | Job is completed/cancelled; chat is locked |

---

## 8. Disputes

### `POST /disputes` [customer, worker]
Raise a dispute for a job.

**Request**
```json
{
  "job_id": "job_01",
  "reason": "Worker left without completing the repair.",
  "evidence_photos": ["https://cdn.bluework.app/disputes/photo_1.jpg"]
}
```

**Response `201`**
```json
{
  "id": "disp_01",
  "job_id": "job_01",
  "status": "open",
  "raised_by": "usr_03",
  "created_at": "2026-02-24T12:00:00Z"
}
```

**Errors**
| Status | Code | Reason |
|---|---|---|
| 409 | `DISPUTE_ALREADY_EXISTS` | Dispute already raised for this job |
| 422 | `JOB_NOT_DISPUTABLE` | Job status does not allow disputes |

---

### `GET /disputes/:id` [any]
Get dispute details. Parties to the job or admins only.

**Response `200`**
```json
{
  "id": "disp_01",
  "job_id": "job_01",
  "status": "open | under_review | resolved",
  "raised_by": "usr_03",
  "reason": "Worker left without completing the repair.",
  "resolution": null,
  "resolved_by": null,
  "created_at": "2026-02-24T12:00:00Z",
  "resolved_at": null
}
```

---

### `PATCH /disputes/:id` [admin]
Resolve a dispute.

**Request**
```json
{
  "status": "resolved",
  "resolution": "Partial refund issued. Worker received 50% of payment.",
  "action": "partial_refund | full_refund | no_action | worker_warning"
}
```

**Response `200`** — updated dispute object

---

## 9. Admin

### `GET /admin/workers` [admin]
List workers with optional status filter.

**Query Params**
- `status` — `pending_approval | active | suspended`
- `page`, `limit`

**Response `200`** — paginated worker objects

---

### `PATCH /admin/workers/:id` [admin]
Approve, suspend, or reinstate a worker.

**Request**
```json
{
  "status": "active | suspended",
  "note": "Failed background check."  // optional, stored in audit log
}
```

**Response `200`** — updated worker object

**Errors**
| Status | Code | Reason |
|---|---|---|
| 404 | `USER_NOT_FOUND` | No worker with that ID |

---

### `PATCH /admin/users/:id` [admin]
Suspend or reinstate any user account.

**Request**
```json
{
  "status": "active | suspended",
  "note": "Repeated no-shows."
}
```

**Response `200`** — updated user object

---

### `GET /admin/analytics` [admin]
Get platform-wide metrics.

**Query Params**
- `from` — ISO date
- `to` — ISO date

**Response `200`**
```json
{
  "period": { "from": "2026-02-01", "to": "2026-02-24" },
  "jobs": {
    "total": 420,
    "completed": 380,
    "cancelled": 25,
    "disputed": 15,
    "completion_rate": 0.905
  },
  "users": {
    "active_customers": 210,
    "active_workers": 95,
    "new_registrations": 38
  },
  "payments": {
    "total_volume": 324000.00,
    "currency": "PHP",
    "success_rate": 0.98
  },
  "avg_job_acceptance_time_seconds": 142
}
```

---

## 10. Real-Time (WebSocket)

Connect via `wss://api.bluework.app/ws` with `Authorization: Bearer <token>` header.

### Events — Server → Client

| Event | Payload | Audience |
|---|---|---|
| `job.created` | `{ job_id, category, location, urgency }` | Nearby workers |
| `job.accepted` | `{ job_id, worker: { id, name, lat, lng } }` | Customer |
| `job.status_changed` | `{ job_id, status, timestamp }` | Customer & Worker |
| `worker.location_updated` | `{ job_id, lat, lng }` | Customer (while job is active) |
| `message.received` | `{ job_id, message: { id, sender_id, content, sent_at } }` | Customer & Worker |
| `payment.confirmed` | `{ job_id, payment_id, status }` | Customer & Worker |
| `dispute.updated` | `{ dispute_id, status }` | Customer & Worker |

### Events — Client → Server

| Event | Payload | Sender |
|---|---|---|
| `worker.location_ping` | `{ lat, lng }` | Worker (every 15s while on active job) |
| `job.subscribe` | `{ job_id }` | Any — subscribe to a job's updates |

---

## Appendix: Notification Types

| Type | Trigger | Recipient |
|---|---|---|
| `job_created` | Customer posts a job | Nearby workers |
| `job_accepted` | Worker accepts | Customer |
| `job_en_route` | Worker starts navigation | Customer |
| `job_started` | Worker starts work | Customer |
| `job_completed` | Worker marks complete | Customer |
| `job_cancelled` | Either party cancels | Both |
| `payment_confirmed` | Payment succeeds | Customer & Worker |
| `dispute_opened` | Dispute raised | Admin |
| `dispute_resolved` | Admin resolves | Customer & Worker |
| `worker_approved` | Admin approves worker | Worker |
| `worker_suspended` | Admin suspends account | User |
