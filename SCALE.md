# Scale Memo: 5 Million Orders

The current design is a good local, single-operator MVP: SQLite keeps setup under five minutes, keyset pagination avoids deep offsets, and the idempotency constraint makes the most important write safe. At five million orders and all-day use from two countries, I would change the storage and operational layer while preserving those behavioral contracts.

## What I would change

I would move the database to managed PostgreSQL in the deployment environment, with a connection pool and automated migrations. The current `ordersService` already isolates query decisions, so the first migration would preserve the API and replace SQLite-specific setup rather than spread SQL changes through React. I would add composite indexes that match the real search/sort combinations and use PostgreSQL full-text or trigram indexes for customer name and email search instead of relying on prefix scans alone.

The orders list would keep keyset pagination, but cursors would be versioned and signed so clients cannot manufacture arbitrary positions. I would add a maximum search scope, rate limits, and request timing metrics. For two countries, I would use one write region with read replicas or a read pool close to each user; I would not introduce multi-primary writes until measured latency and availability requirements justify the consistency cost.

The stats endpoint would stop calculating grouped totals on every request. A background job would maintain a daily/status aggregate table, with a clearly labeled freshness timestamp. Revenue and operational reports would run asynchronously, with exports written to object storage rather than assembled in a browser response.

## What I would keep

I would keep the server-side page limit, stable keyset cursor, and batch loading of items. I would keep server-side validation and the unique idempotency key constraint, but add a request fingerprint and an explicit retention policy for keys. I would keep HttpOnly cookie sessions, server-side authorization, token revocation, and audit events for privileged actions. The React hook’s abort and stale-response guard is also worth keeping: it is a correctness property, not only a performance trick.

With three developers, I would add migrations, structured logs, request IDs, health checks, backups, restore drills, and a small set of contract/load tests before building more workflow features. The team should own query plans and operational dashboards rather than depending on intuition about five million rows.

## What I would refuse to build

I would refuse an irreversible “delete all cancelled orders” button. I would offer scoped archival with a dry run, approval, audit trail, and recovery, followed by a reviewed retention job if policy requires permanent deletion.

I would also refuse unbounded table exports, deep offset pagination, and a multi-region strong-consistency write system added only because the user base spans two countries. Those choices create expensive failure modes without first answering the product and availability questions they are meant to solve.
