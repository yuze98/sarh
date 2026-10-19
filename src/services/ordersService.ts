import { API_PATHS } from "../constants/apiPaths";
import type { CreateOrderInput, Order, OrderStatus } from "../types/order";
import type { OrderStats, Paginated } from "../types/api";
import { request } from "./httpClient";

export interface OrdersQuery {
  search: string;
  status: OrderStatus | "";
  sort: "created_at" | "total_amount";
  direction: "asc" | "desc";
  limit: number;
  cursor?: string;
}

export const ordersService = {
  list(query: OrdersQuery, signal: AbortSignal): Promise<Paginated<Order>> {
    const params = new URLSearchParams({
      search: query.search,
      sort: query.sort,
      direction: query.direction,
      limit: String(query.limit),
    });
    if (query.status) params.set("status", query.status);
    if (query.cursor) params.set("cursor", query.cursor);
    return request(`${API_PATHS.orders}?${params.toString()}`, { signal });
  },
  getStats(signal: AbortSignal): Promise<OrderStats> {
    return request(API_PATHS.orderStats, { signal });
  },
  create(input: CreateOrderInput, idempotencyKey: string): Promise<Order> {
    return request(API_PATHS.orders, {
      method: "POST",
      headers: { "Idempotency-Key": idempotencyKey },
      body: JSON.stringify(input),
    });
  },
  remove(id: string): Promise<void> {
    return request(`${API_PATHS.orders}/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  },
};
