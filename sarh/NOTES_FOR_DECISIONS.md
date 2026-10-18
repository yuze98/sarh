# Notes for Decisions

Implementation facts only; use these as source material for your own decision explanations.

- Orders pagination is keyset/cursor-based. The cursor contains the selected sort value and order ID, with the ID serving as a stable tie-breaker.
- Orders list state is local React state in the screen and a custom `useOrders` hook. Search is debounced; requests use `AbortController` plus a monotonically increasing request sequence guard.
- SQLite uses `better-sqlite3` with a persistent file at `DATABASE_PATH`, WAL journaling, foreign keys, and indexes declared in `server/db/schema.ts`.
- Order creation is a synchronous SQLite transaction that inserts the order and all items. The total is calculated from items on the server.
- Idempotency is enforced by a unique `orders.idempotency_key` constraint. On a unique conflict, the API returns the already-stored order.
- The client creates a UUID key when the create form mounts, sends it in `Idempotency-Key`, preserves it after errors, and renews it on success or reset.
- Authentication uses a 15-minute HS256 JWT in an HttpOnly, SameSite=Lax cookie. The server reloads role and token version from SQLite for each request.
- Shared Zod order schemas live in `src/types/order.ts` and are imported by both the client and server.