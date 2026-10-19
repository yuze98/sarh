import type { OrderStatus } from "./order.js";

export interface ApiErrorBody {
  error: string;
  details?: unknown;
}

export interface Paginated<T> {
  items: T[];
  nextCursor: string | null;
}

export interface OrderStats {
  totalsByStatus: Record<OrderStatus, number>;
  revenueToday: number;
}
