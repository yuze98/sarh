# Orders Console

Take-home assignment for a Full Stack Developer (React) role. This repository contains a React 18 + TypeScript client and an Express + TypeScript API backed by file-based SQLite.

## Prerequisites

- Node.js 22 or newer and npm. Node 22+ is required by the current `better-sqlite3` release; Node 26 was used for development.
- macOS, Linux, or Windows with a C++ build toolchain available if npm needs to compile a native dependency.

## Setup and Run

From this directory:

```sh
cp .env.example .env
```

Set `JWT_SECRET` in `.env` to a random value of at least 32 characters. For example, `openssl rand -hex 32`. Then install, seed, and start both processes:

```sh
npm install
npm run seed
npm run dev
```

Open http://localhost:5173. The Vite dev server proxies `/api` to Express on port 3000. The SQLite database is created at `./data/orders.db`; the file and related SQLite journal files are ignored by Git. No real `.env` file is committed.

## Commands

```sh
npm run seed             # create 50,000 orders and demo users
npm run dev              # start Vite and Express together
npm run build            # frontend production build and server TypeScript check
npm run lint             # lint client and server
npm test                 # all Vitest tests
npm run test:duplicate   # parallel idempotency API test
```

Seeded credentials:

- Admin: `admin@sarh.ai` / `AdminSarh2026!`
- Agent: `agent@sarh.ai` / `AgentSarh2026!`

The seed script hashes both passwords with bcrypt before storing them. Re-running the seed updates the demo user hashes and exits without duplicating an already populated orders table.

## Orders API and Indexes

`GET /api/orders` accepts `search`, `status`, `sort`, `direction`, `limit`, and `cursor`. `sort` is restricted to `created_at` or `total_amount`; `direction` is restricted to `asc` or `desc`; page size is capped at 100. Search is a lowercase prefix match over customer name/email. Results use keyset pagination ordered by the chosen field and stable order ID; the API returns a `nextCursor` or `null`. It never returns the full orders table. All `/api/orders` routes require an authenticated session; agents can list/create and only admins can delete.

Indexes in `server/db/schema.ts`:

- `idx_orders_status_created_at(status, created_at DESC, id DESC)`: supports status-filtered time ordering and stable keyset continuation.
- `idx_orders_created_at(created_at DESC, id DESC)`: supports the default time sort and its cursor tie-breaker.
- `idx_orders_total_amount(total_amount DESC, id DESC)`: supports amount sorting and its cursor tie-breaker.
- `idx_orders_customer_name_lower(customer_name_lower COLLATE NOCASE)` and `idx_orders_customer_email_lower(customer_email_lower COLLATE NOCASE)`: support prefix searches against stored lowercase customer fields.
- `idx_order_items_order_id(order_id)`: supports order item joins and cascade cleanup.

## Authentication Code Review

The contractor sample had these issues; the implementation changes are listed beside each finding:

- Hard-coded signing secret: moved to `JWT_SECRET`; startup fails when it is missing or shorter than 32 characters. `.env.example` contains only a replaceable placeholder.
- `jwt.decode` accepted unverified claims: replaced with `jwt.verify` and an explicit `HS256` algorithm allowlist.
- Tokens accepted from query strings: removed; only an HttpOnly session cookie or an `Authorization: Bearer` header is accepted.
- Tokens had no expiry: sessions expire after 15 minutes.
- Authorization lived only in a React component: all orders routes require authentication and DELETE uses server-side `requireRole('admin')`.
- Plaintext passwords were queried/compared: user passwords are stored as bcrypt hashes and checked with `bcrypt.compare`.
- Login input was unvalidated: Zod validates email and password lengths before database work.
- Login revealed whether the email or password was wrong: both failures return the same message; a dummy bcrypt comparison reduces timing differences for unknown users.
- Login had no brute-force control: a per-IP rate limiter allows 10 attempts per 15 minutes.
- Token role claims could go stale or remain valid after account changes: each request reloads the current role from SQLite; `token_version` is checked and incremented on logout to revoke existing sessions.
- Async/database errors could escape the route: Express 5 promise handling and a final error middleware return a generic 500 response without exposing internal details.
- The token was returned to JavaScript: login sets an HttpOnly, SameSite=Lax cookie; logout clears it. The Vite proxy and credentialed CORS configuration support this cookie flow.
- JWT payload claims were trusted without validating subject/version shape: the verified payload is checked and matched against a current database user before attaching the user to the request.

The session token is stored in an HttpOnly, SameSite=Lax cookie, so browser JavaScript cannot read it and a successful XSS payload cannot directly exfiltrate the token. SameSite=Lax reduces cross-site request forgery for state-changing requests, but it is not a complete CSRF defense for every deployment, so production would add a CSRF token/origin check if the frontend and API become cross-site. It does not protect against an XSS payload performing actions through the victim's active browser session.

## What I Skipped and Why

O2: Optimistic create was skipped because O1 demonstrates request cancellation, independent loading, and retry behavior more directly; the current create flow waits for the server’s authoritative order ID and status.

Virtualized rendering was skipped because the browser receives only one 25-row cursor page at a time; the API never sends the 50,000-row table. Deep pagination remains server-side and can be upgraded to row virtualization later without changing the API contract.

Refresh tokens and production observability were also left out of this local assessment. The 15-minute session and token-version revocation are sufficient for the demonstrated workflow, while a real deployment would add structured request logs, metrics, and a deliberate refresh/session policy.

## Optional O1: Slow Stats

`GET /api/orders/stats` returns totals by status and revenue for the current UTC day after a deliberate four-second delay. The Orders screen requests it independently from the orders list, aborts it when the screen unmounts, and exposes a visible retry state when the request fails.

## Product Question: “Delete all cancelled orders”

### Impact

Why are cancelled orders being removed, what retention/audit policy applies, and should “cancelled” include every age and source? I would also ask who can approve the action and whether recovery is required.

### Safeguards

If those answers are unavailable, I would propose an admin-only archive action with a dry-run count, a date range, confirmation showing the exact scope, and an audit record instead of irreversible deletion.

### Recovery

Archived orders remain recoverable and excluded by default; permanent deletion would be a separate, reviewed retention job rather than a button.

## Implementation Summary

See [NOTES_FOR_DECISIONS.md](NOTES_FOR_DECISIONS.md) for implementation facts to use when completing [DECISIONS.md](DECISIONS.md). Do not treat the notes as personal rationale.
