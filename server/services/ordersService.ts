import { randomUUID } from "node:crypto";
import { ORDER_STATUSES } from "../../src/types/order.js";
import type { Order, OrderStatus } from "../../src/types/order.js";
import { db } from "../db/database.js";

export interface ListOrdersOptions {
  search: string;
  status?: OrderStatus;
  sort: "created_at" | "total_amount";
  direction: "asc" | "desc";
  limit: number;
  cursor?: { value: string | number; id: string };
}

export interface OrdersPage {
  items: Order[];
  nextCursor: string | null;
}

export interface OrderStats {
  totalsByStatus: Record<OrderStatus, number>;
  revenueToday: number;
}

interface OrderRow {
  id: string;
  customer_name: string;
  customer_email: string;
  status: OrderStatus;
  total_amount: number;
  created_at: string;
}

interface OrderItemRow {
  id: string;
  order_id: string;
  name: string;
  quantity: number;
  unit_price: number;
}

const encodeCursor = (value: string | number, id: string): string =>
  Buffer.from(JSON.stringify({ value, id })).toString("base64url");

export function listOrders(options: ListOrdersOptions): OrdersPage {
  const sortColumn =
    options.sort === "created_at" ? "created_at" : "total_amount";
  const comparison = options.direction === "asc" ? ">" : "<";
  const orderDirection = options.direction.toUpperCase();
  const clauses: string[] = [];
  const parameters: Array<string | number> = [];

  if (options.status) {
    clauses.push("status = ?");
    parameters.push(options.status);
  }
  if (options.search) {
    clauses.push("(customer_name_lower LIKE ? OR customer_email_lower LIKE ?)");
    const prefix = `${options.search.toLocaleLowerCase()}%`;
    parameters.push(prefix, prefix);
  }
  if (options.cursor) {
    clauses.push(
      `(${sortColumn} ${comparison} ? OR (${sortColumn} = ? AND id ${comparison} ?))`,
    );
    parameters.push(
      options.cursor.value,
      options.cursor.value,
      options.cursor.id,
    );
  }

  const where = clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "";
  const rows = db
    .prepare(
      `
    SELECT id, customer_name, customer_email, status, total_amount, created_at
    FROM orders
    ${where}
    ORDER BY ${sortColumn} ${orderDirection}, id ${orderDirection}
    LIMIT ?
  `,
    )
    .all(...parameters, options.limit + 1) as OrderRow[];

  const hasMore = rows.length > options.limit;
  const pageRows = rows.slice(0, options.limit);
  const itemRows =
    pageRows.length === 0
      ? []
      : (db
          .prepare(
            `
      SELECT id, order_id, name, quantity, unit_price
      FROM order_items
      WHERE order_id IN (${pageRows.map(() => "?").join(", ")})
      ORDER BY order_id, id
    `,
          )
          .all(...pageRows.map(({ id }) => id)) as OrderItemRow[]);
  const itemsByOrder = new Map<string, OrderItemRow[]>();
  for (const item of itemRows) {
    const orderItems = itemsByOrder.get(item.order_id) ?? [];
    orderItems.push(item);
    itemsByOrder.set(item.order_id, orderItems);
  }
  const items = pageRows.map((row) => ({
    id: row.id,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    status: row.status,
    totalAmount: row.total_amount,
    createdAt: row.created_at,
    items: (itemsByOrder.get(row.id) ?? []).map((item) => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.unit_price,
    })),
  }));
  const last = pageRows.at(-1);

  return {
    items,
    nextCursor:
      hasMore && last ? encodeCursor(last[sortColumn], last.id) : null,
  };
}

export async function getOrderStats(): Promise<OrderStats> {
  await new Promise((resolve) => setTimeout(resolve, 4000));

  const totalsByStatus = Object.fromEntries(
    ORDER_STATUSES.map((status) => [status, 0]),
  ) as Record<OrderStatus, number>;
  const statusRows = db
    .prepare("SELECT status, COUNT(*) AS total FROM orders GROUP BY status")
    .all() as Array<{ status: OrderStatus; total: number }>;
  for (const row of statusRows) totalsByStatus[row.status] = row.total;

  const startOfToday = new Date();
  startOfToday.setUTCHours(0, 0, 0, 0);
  const revenueRow = db
    .prepare(
      "SELECT COALESCE(SUM(total_amount), 0) AS revenue_today FROM orders WHERE created_at >= ?",
    )
    .get(startOfToday.toISOString()) as { revenue_today: number };

  return { totalsByStatus, revenueToday: revenueRow.revenue_today };
}

interface OrderWithItemsRow extends OrderRow {
  item_id: string | null;
  item_name: string | null;
  item_quantity: number | null;
  item_unit_price: number | null;
}

function getOrderWithItems(orderId: string): Order | undefined {
  const rows = db
    .prepare(
      `
    SELECT o.id, o.customer_name, o.customer_email, o.status, o.total_amount, o.created_at,
      i.id AS item_id, i.name AS item_name, i.quantity AS item_quantity, i.unit_price AS item_unit_price
    FROM orders o
    LEFT JOIN order_items i ON i.order_id = o.id
    WHERE o.id = ?
    ORDER BY i.id
  `,
    )
    .all(orderId) as OrderWithItemsRow[];
  const first = rows[0];
  if (!first) return undefined;

  return {
    id: first.id,
    customerName: first.customer_name,
    customerEmail: first.customer_email,
    status: first.status,
    totalAmount: first.total_amount,
    createdAt: first.created_at,
    items: rows.flatMap((row) =>
      row.item_id &&
      row.item_name !== null &&
      row.item_quantity !== null &&
      row.item_unit_price !== null
        ? [
            {
              id: row.item_id,
              name: row.item_name,
              quantity: row.item_quantity,
              unitPrice: row.item_unit_price,
            },
          ]
        : [],
    ),
  };
}

export function createOrder(
  input: {
    customerName: string;
    customerEmail: string;
    items: Array<{ name: string; quantity: number; unitPrice: number }>;
  },
  idempotencyKey: string,
): { order: Order; created: boolean } {
  const orderId = randomUUID();
  const createdAt = new Date().toISOString();
  const totalAmount = Number(
    input.items
      .reduce((total, item) => total + item.quantity * item.unitPrice, 0)
      .toFixed(2),
  );
  const insert = db.transaction(() => {
    db.prepare(
      `
      INSERT INTO orders (id, customer_name, customer_email, status, total_amount, created_at, idempotency_key)
      VALUES (?, ?, ?, 'pending', ?, ?, ?)
    `,
    ).run(
      orderId,
      input.customerName,
      input.customerEmail,
      totalAmount,
      createdAt,
      idempotencyKey,
    );
    const insertItem = db.prepare(`
      INSERT INTO order_items (id, order_id, name, quantity, unit_price) VALUES (?, ?, ?, ?, ?)
    `);
    for (const item of input.items) {
      insertItem.run(
        randomUUID(),
        orderId,
        item.name,
        item.quantity,
        item.unitPrice,
      );
    }
  });

  try {
    insert();
  } catch (error) {
    const isUniqueConflict =
      error instanceof Error &&
      error.message.includes(
        "UNIQUE constraint failed: orders.idempotency_key",
      );
    if (!isUniqueConflict) throw error;
    const existingAfterConflict = db
      .prepare("SELECT id FROM orders WHERE idempotency_key = ?")
      .get(idempotencyKey) as { id: string } | undefined;
    const order = existingAfterConflict
      ? getOrderWithItems(existingAfterConflict.id)
      : undefined;
    if (order) return { order, created: false };
    throw error;
  }

  const order = getOrderWithItems(orderId);
  if (!order) throw new Error("Created order could not be read back.");
  return { order, created: true };
}
