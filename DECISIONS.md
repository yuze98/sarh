# Decisions

## Decision 1: R1 Orders Pagination

- Decision: Use server-side keyset pagination with a cursor containing the selected sort value and order ID.
- The ID is a stable tie-breaker, so equal timestamps or amounts do not duplicate or skip rows between pages.
- Search and status filtering stay in SQLite, and order items are loaded in one second query for the page.
- Alternative considered: offset pagination, which is simpler to explain and implement for a small table.
- Why rejected: deep offsets scan and discard more rows as the table grows, and concurrent inserts can shift page boundaries.

## Decision 2: R2 Idempotency

- Decision: require an `Idempotency-Key` and enforce it with a unique database constraint in the same transaction as the order and item inserts.
- A retry that loses the race reads and returns the original order, so the guarantee does not depend on button disabling or client timing.
- The server calculates the total from validated items; the client never gets to choose the persisted amount.
- Alternative considered: an in-memory key cache or a client-only disabled submit button.
- Why rejected: memory disappears across restarts and client controls cannot handle network retries or multiple tabs.
- Limits: keys are retained with orders forever in this assessment, and reusing a key with a different payload returns the first order; production should bind keys to a request fingerprint and define retention.

## Decision 3: Authentication Session

- Decision: use a short-lived HS256 JWT in an HttpOnly, SameSite=Lax cookie and reload the user role and token version from SQLite on every request.
- This keeps the token unavailable to browser JavaScript and lets logout revoke all tokens through `token_version`.
- The API still accepts a Bearer header for controlled non-browser clients, but never accepts a query-string token.
- Alternative considered: storing a JWT in localStorage and trusting its role claim until expiry.
- Why rejected: localStorage makes token theft through XSS straightforward, and stale role claims can outlive an account change.

## AI Tools Usage

I used GitHub Copilot to inspect the repository against the assignment, identify missing work, draft focused implementation changes, and suggest test coverage.
I reviewed the generated suggestions against the existing code, kept the project’s conventions, and verified behavior with TypeScript checks, tests, lint, and the production build.
The security reasoning, tradeoffs, limits, and scale recommendations are my responsibility and should be discussed live rather than treated as generated authority.
