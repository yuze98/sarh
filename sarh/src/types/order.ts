import { z } from 'zod'

export const ORDER_STATUSES = [
  'pending',
  'paid',
  'shipped',
  'delivered',
  'cancelled',
] as const

export const orderStatusSchema = z.enum(ORDER_STATUSES)

export const orderItemSchema = z.object({
  name: z.string().trim().min(1, 'Item name is required').max(120, 'Item name must be 120 characters or fewer'),
  quantity: z.number({ error: 'Enter a valid quantity' }).int('Quantity must be a whole number').min(1, 'Quantity must be at least 1').max(999, 'Quantity cannot exceed 999'),
  unitPrice: z.number({ error: 'Enter a valid unit price' }).finite().min(0, 'Unit price cannot be negative').max(1_000_000, 'Unit price is too large'),
})

export const createOrderSchema = z.object({
  customerName: z.string().trim().min(1, 'Customer name is required').max(120, 'Customer name must be 120 characters or fewer'),
  customerEmail: z.string().trim().email('Enter a valid email address').max(254, 'Email must be 254 characters or fewer'),
  items: z.array(orderItemSchema).min(1).max(5),
})

export type OrderStatus = (typeof ORDER_STATUSES)[number]
export type OrderItemInput = z.infer<typeof orderItemSchema>
export type CreateOrderInput = z.infer<typeof createOrderSchema>

export interface OrderItem extends OrderItemInput {
  id: string
}

export interface Order {
  id: string
  customerName: string
  customerEmail: string
  status: OrderStatus
  totalAmount: number
  createdAt: string
  items: OrderItem[]
}