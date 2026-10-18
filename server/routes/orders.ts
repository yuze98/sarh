import { Router } from 'express'
import { z } from 'zod'
import { ORDER_STATUSES, createOrderSchema } from '../../src/types/order.js'
import { db } from '../db/database.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { createOrder, listOrders } from '../services/ordersService.js'

const router = Router()
router.use(requireAuth)
const listQuerySchema = z.object({
  search: z.string().trim().max(120).default(''),
  status: z.enum(ORDER_STATUSES).optional(),
  sort: z.enum(['created_at', 'total_amount']).default('created_at'),
  direction: z.enum(['asc', 'desc']).default('desc'),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  cursor: z.string().max(256).optional(),
})
const cursorSchema = z.object({
  value: z.union([z.string().datetime(), z.number().finite()]),
  id: z.string().uuid(),
})

router.get('/', (request, response) => {
  const parsed = listQuerySchema.safeParse(request.query)
  if (!parsed.success) {
    response.status(400).json({ error: 'Invalid query parameters', details: parsed.error.flatten() })
    return
  }

  let cursor: { value: string | number; id: string } | undefined
  if (parsed.data.cursor) {
    try {
      const cursorValue: unknown = JSON.parse(Buffer.from(parsed.data.cursor, 'base64url').toString('utf8'))
      const parsedCursor = cursorSchema.safeParse(cursorValue)
      if (!parsedCursor.success) throw new Error('Invalid cursor')
      cursor = parsedCursor.data
    } catch {
      response.status(400).json({ error: 'Invalid cursor' })
      return
    }
  }

  const page = listOrders({ ...parsed.data, cursor })
  response.json(page)
})

router.post('/', (request, response) => {
  const parsed = createOrderSchema.safeParse(request.body)
  const idempotencyKey = request.get('Idempotency-Key')
  if (!parsed.success) {
    response.status(400).json({ error: 'Invalid order', details: parsed.error.flatten() })
    return
  }
  if (!idempotencyKey || idempotencyKey.length > 128) {
    response.status(400).json({ error: 'A valid Idempotency-Key header is required' })
    return
  }

  const result = createOrder(parsed.data, idempotencyKey)
  response.status(result.created ? 201 : 200).json(result.order)
})

router.delete('/:id', requireRole('admin'), (request, response) => {
  const result = db.prepare('DELETE FROM orders WHERE id = ?').run(request.params.id)
  if (result.changes === 0) {
    response.status(404).json({ error: 'Order not found' })
    return
  }
  response.status(204).end()
})

export default router