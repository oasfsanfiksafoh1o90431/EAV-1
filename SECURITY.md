# Security Assessment — E.A.V. Gomez Lying-In Clinic System

**Purpose:** Honest record of the system's current security posture, the weaknesses that
remain, and the architecture required before this system could handle real patient data.
This document is intended for thesis defense preparation: it is better to know and state
these gaps than to have a panel discover them.

**Assessment date:** 26 September 2026
**Stack assessed:** React 18 + Vite frontend, Express + MySQL (mysql2) backend, Web Crypto API

---

## 1. Architecture Overview

```
Browser (React SPA)
  ├─ Login.tsx .............. credential check, PBKDF2 hashing (client-side)
  ├─ NurseRegistration.tsx ... account creation, same client-side hashing
  └─ utils/api.ts ........... HTTP calls to backend
                │
                │  HTTP (plaintext, no TLS)
                ▼
        Express server.js  ──  port 3001
                │
                ▼
        MySQL  eavgomez_clinic
          patients · nurses · audit_logs · settings
```

Two database modes exist, selected by `VITE_USE_MYSQL` in `.env`:

| Mode | Storage | Server required | Status |
|---|---|---|---|
| `VITE_USE_MYSQL=true` | MySQL via Express API | Yes | **Default** |
| `VITE_USE_MYSQL=false` | Browser IndexedDB (Dexie) | No | Fallback |

---

## 2. Controls Already Implemented

These are genuine and can be described in the thesis:

| Control | Implementation | Location |
|---|---|---|
| Password strength validation | 8+ chars, upper, lower, digit, special char | `security.ts:101` |
| Per-account lockout | 5 failures → 15-minute lock | `security.ts:130` |
| Rate limiting | 10 attempts per 5-minute window | `security.ts:155` |
| Saltered password hashing | PBKDF2-SHA256, 100k iterations, 16-byte random salt | `security.ts:47` |
| Constant-time comparison | Prevents timing-based credential probing | `security.ts:340` |
| Input sanitisation | Escapes `< > " &` on text fields | `security.ts:81` |
| Session expiry | 8-hour session with refresh window | `security.ts:196` |
| Account archiving | Soft-delete; archived staff blocked at login | `NurseRegistration.tsx` |
| Audit trail | Create/update/delete/export/import/login events recorded | `server.js`, `AuditTrail.tsx` |
| Parameterised queries | `mysql2` prepared statements — no SQL injection | `server.js` |
| Auto table creation | Schema created idempotently on boot | `server.js:38` |
| Encrypted backup export | Full-database JSON export/import | `server.js` |

---

## 3. Verified Vulnerabilities

Each item below was confirmed by inspection or direct request, not assumed.

### V-01 — API has no authentication or authorization  ·  **CRITICAL**

Any client that can reach port 3001 can read, modify, or delete every record.

```
$ curl http://localhost:3001/api/patients
HTTP/1.1 200 OK
[...]
```

There is no auth middleware anywhere in `server.js`. All routes — including
`DELETE /api/patients/:id` and `GET /api/export` — are open. The login screen is a
client-side illusion; removing it changes nothing about API access.

**Impact:** Complete disclosure of all maternal health records; possible record
destruction or falsification. This alone disqualifies the system from handling real PHI.

### V-02 — Credential verification happens in the browser  ·  **CRITICAL**

`Login.tsx` fetches the stored hash and compares it locally. The server never
authenticates anyone.

The practical consequence: the PBKDF2 hash is a **password equivalent**. Anyone who reads
the `nurses` table can log in by submitting the hash as the password. Hashing moved to
the client does not protect the account — it only obscures the value at rest.

**Impact:** Database read access converts directly into account access, for every account
including the owner.

### V-03 — Owner credentials shipped in the JavaScript bundle  ·  **HIGH**

`DEFAULT_SUPERADMIN` in `Login.tsx` contains the owner email, and the password
`superadmin123` is hashed in-browser at runtime. View Source reveals the account exists
and the password is derivable by running the same code.

**Impact:** The highest-privilege account has no meaningful protection.

### V-04 — Password hashes and salts disclosed over a public endpoint  ·  **HIGH**

`GET /api/nurses/:email?auth=true` returns `password_hash` and `password_salt` to any
caller. The `auth` flag is a client-supplied query parameter, not an access control.

**Impact:** Bulk harvesting of every credential in the system. Directly enables V-02.

### V-05 — Patient data stored as unencrypted JSON  ·  **HIGH**

The `maternal_data` column holds plaintext JSON. `src/app/utils/encryption.ts` implements
AES-GCM, but it is **dead code** — no module imports it. Even if reconnected, it derives
its key from the hardcoded string `default-hospital-key` with a static salt, and its
catch blocks return the **original plaintext** on any failure (fail-open).

**Impact:** No confidentiality at rest. A stolen database file is fully readable.

### V-06 — Audit trail is split across two stores and is currently empty  ·  **MEDIUM**

`Dashboard.tsx` still calls the legacy localStorage loggers for patient views:

```
L209: logPatientView(...)   -> localStorage
L219: logPatientView(...)   -> localStorage
      auditDb.log(...)      -> MySQL   (all other events)
```

`GET /api/audit-logs` currently returns **0 entries**. View events never reach MySQL, and
the Audit Trail UI reads only MySQL in MySQL mode, so accesses go unrecorded.

**Impact:** No reliable accountability trail. For a medical system, an incomplete audit
trail is a compliance failure, not just a missing feature.

### V-07 — Rate limiting and lockout are client-side only  ·  **MEDIUM**

`recordLoginAttempt` and `checkRateLimit` write to `localStorage`. Clearing site data or
using a private window resets all counters, and nothing is enforced server-side.

**Impact:** Brute-force protection is advisory. Unlimited password guessing is possible
against the open API.

### V-08 — No transport encryption  ·  **MEDIUM**

All traffic is plain HTTP. Credentials, tokens, and patient data traverse the network in
cleartext.

**Impact:** Eavesdropping on a shared or clinic LAN exposes all traffic. Required by
RA 10173 for personal data in transit.

### V-09 — Session token in localStorage  ·  **LOW**

`createSession` stores a session record in `localStorage`, readable by any JavaScript on
the page. A stored `HttpOnly`, `Secure`, `SameSite=Strict` cookie is not accessible to
script and is the correct storage for session state.

**Impact:** Session theft via any successful XSS injection.

### V-10 — Silent error handling masks failures  ·  **LOW**

`loadNurses` used `catch { setNurses([]) }`, so a backend outage rendered as an empty
account list rather than an error. Fixed, but the pattern recurs elsewhere.

**Impact:** Failures present as "no data", inviting incorrect operational conclusions.

---

## 4. Required Target Architecture

```
Browser
  │  HTTPS only (TLS 1.3)
  │  sends plaintext password ONCE, over TLS
  ▼
Express API
  │  1. Verify credentials server-side (bcrypt.compare)
  │  2. Issue signed JWT (15 min) + refresh token (httpOnly cookie)
  │  3. reject unauthenticated requests — middleware on every /api route
  │  4. Enforce rate limit + lockout per account AND per IP
  ▼
MySQL
     bcrypt hashes only, never reversible
     column-level encryption for maternal_data (MySQL 8 AES)
     TLS connection to database
```

Key principle: **the server must be the sole authority.** Any check performed in the
browser is a usability feature, never a security control.

---

## 5. Implementation Roadmap

### Phase 1 — Authentication (closes V-01, V-02, V-04, V-07)
1. `bcrypt` on the server; remove PBKDF2 from the client
2. `POST /api/auth/login` returning a signed JWT
3. `requireAuth` middleware applied to all routes
4. Server-side rate limiting keyed on email + IP
5. Remove `?auth=true`; never return hashes to clients
6. Store the owner account as a bcrypt hash seeded at first boot

### Phase 2 — Transport & storage (closes V-05, V-08, V-09)
7. TLS via a self-signed certificate for development
8. `mysql2` connection with `ssl` options
9. Encrypt `maternal_data` at rest; delete or repair `encryption.ts`
10. Move the session to an `HttpOnly` cookie

### Phase 3 — Audit & operations (closes V-06, V-10)
11. Route all audit events through one path; remove the localStorage loggers
12. Log authentication attempts, successes, and failures
13. Add database-level backup scheduling and integrity checks

---

## 6. Compliance Notes

**Data Privacy Act of 2012 (Republic Act No. 10173)** applies to this system. The clinic
is a "covered establishment" and maternal health records are sensitive personal
information. Relevant obligations:

- **Security of sensitive information** — must be protected against unauthorized access.
  V-01 currently fails this outright.
- **Encryption** — the act requires reasonable methods; V-08 and V-05 fall short.
- **Access to personal information** — limited to authorised persons; V-01 bypasses this.

**Retention:** no implemented retention or disposal policy. A defensible system needs a
defined schedule for patient and audit records, plus secure disposal of archived accounts.

**Breach notification:** no breach-detection or notification procedure. The act requires
notification to the National Privacy Commission within 72 hours of a confirmed breach.

---

## 7. Summary

The system demonstrates sound *design intent* — password policy, lockout, salted hashing,
an audit trail, parameterised queries, and account archiving are all present and correctly
chosen. But the controls are enforced in the browser, which means they are advisory rather
than effective, and the API is unauthenticated.

**Current status: not suitable for real patient data.** The gap is not exotic — it is the
absence of server-side authentication, which is a well-understood and well-documented fix
(Phase 1, roughly one to two days of work).

For thesis defense, the defensible position is: *demonstrate the threat model, document
these findings, and present the remediation roadmap as the contribution.* A panel will
respect a candidate who identifies their own system's weaknesses far more than one who
claims there are none.
