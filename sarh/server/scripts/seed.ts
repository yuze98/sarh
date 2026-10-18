import 'dotenv/config'
import bcrypt from 'bcrypt'
import { randomUUID } from 'node:crypto'
import { db } from '../db/database.js'
import { ORDER_STATUSES } from '../../src/types/order.js'

const orderCount = 50_000
const users = [
  { email: 'admin@sarh.ai', password: 'AdminSarh2026!', role: 'admin' },
  { email: 'agent@sarh.ai', password: 'AgentSarh2026!', role: 'agent' },
] as const

const upsertUser = db.prepare(`
  INSERT INTO users (id, email, password_hash, role)
  VALUES (?, ?, ?, ?)
  ON CONFLICT(email) DO UPDATE SET password_hash = excluded.password_hash, role = excluded.role
`)

for (const user of users) {
  upsertUser.run(randomUUID(), user.email, bcrypt.hashSync(user.password, 12), user.role)
}

const existingOrders = db.prepare('SELECT COUNT(*) AS count FROM orders').get() as { count: number }
if (existingOrders.count >= orderCount) {
  console.log(`Database already contains ${existingOrders.count.toLocaleString()} orders.`)
  process.exit(0)
}
if (existingOrders.count > 0) {
  throw new Error(`Expected an empty orders table or at least ${orderCount} orders; found ${existingOrders.count}.`)
}

const insertOrder = db.prepare(`
  INSERT INTO orders (id, customer_name, customer_email, status, total_amount, created_at, idempotency_key)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`)
const insertItem = db.prepare(`
  INSERT INTO order_items (id, order_id, name, quantity, unit_price)
  VALUES (?, ?, ?, ?, ?)
`)
const names = ['Avery Morgan', 'Jordan Lee', 'Riley Chen', 'Casey Patel', 'Taylor Brooks', 'Morgan Diaz']
const products = ['Desk lamp', 'Notebook set', 'Ceramic mug', 'Cable organizer', 'Travel bottle', 'Canvas tote']
const startTime = Date.now() - 2 * 365 * 24 * 60 * 60 * 1000
const timeRange = Date.now() - startTime

const seedOrders = db.transaction(() => {
  for (let index = 0; index < orderCount; index += 1) {
    const id = randomUUID()
    const itemCount = 1 + Math.floor(Math.random() * 5)
    const items = Array.from({ length: itemCount }, () => ({
      name: products[Math.floor(Math.random() * products.length)]!,
      quantity: 1 + Math.floor(Math.random() * 4),
      unitPrice: Number((5 + Math.random() * 195).toFixed(2)),
    }))
    const total = Number(items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0).toFixed(2))
    const customerIndex = Math.floor(Math.random() * names.length)
    const customerName = names[customerIndex]!
    const createdAt = new Date(startTime + Math.random() * timeRange).toISOString()

    insertOrder.run(
      id,
      customerName,
      `customer${index}@example.com`,
      ORDER_STATUSES[Math.floor(Math.random() * ORDER_STATUSES.length)]!,
      total,
      createdAt,
      `seed:${id}`,
    )
    for (const item of items) {
      insertItem.run(randomUUID(), id, item.name, item.quantity, item.unitPrice)
    }
  }
})

seedOrders()
console.log(`Seeded ${orderCount.toLocaleString()} orders and their line items.`)