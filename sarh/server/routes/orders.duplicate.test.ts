import bcrypt from 'bcrypt'
import { randomUUID } from 'node:crypto'
import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { db } from '../db/database.js'
import app from '../app.js'

describe('parallel order idempotency', () => {
  let cookie: string

  beforeAll(async () => {
    db.prepare('DELETE FROM order_items').run()
    db.prepare('DELETE FROM orders').run()
    db.prepare('DELETE FROM users').run()
    const userId = randomUUID()
    db.prepare('INSERT INTO users (id, email, password_hash, role) VALUES (?, ?, ?, ?)')
      .run(userId, 'duplicate-test@sarh.ai', await bcrypt.hash('test-password', 4), 'agent')
    const login = await request(app).post('/api/auth/login').send({ email: 'duplicate-test@sarh.ai', password: 'test-password' })
    expect(login.status).toBe(200)
    const setCookie = login.headers['set-cookie']
    cookie = Array.isArray(setCookie) ? setCookie[0]!.split(';')[0]! : String(setCookie).split(';')[0]!
    const session = await request(app).get('/api/auth/me').set('Cookie', cookie)
    expect(session.status, JSON.stringify(session.body)).toBe(200)
  })

  afterAll(() => {
    db.prepare('DELETE FROM order_items').run()
    db.prepare('DELETE FROM orders').run()
    db.prepare('DELETE FROM users').run()
    db.close()
  })

  it('stores one order and returns its original id for parallel retries', async () => {
    const key = randomUUID()
    const body = {
      customerName: 'Idempotent Customer',
      customerEmail: 'idempotent@example.com',
      items: [{ name: 'Notebook', quantity: 2, unitPrice: 8.5 }],
    }
    const create = () => request(app).post('/api/orders').set('Cookie', cookie).set('Idempotency-Key', key).send(body)
    const [first, second] = await Promise.all([create(), create()])

    expect([first.status, second.status].sort()).toEqual([200, 201])
    expect(first.body.id).toBe(second.body.id)
    expect(db.prepare('SELECT COUNT(*) AS count FROM orders WHERE idempotency_key = ?').get(key)).toEqual({ count: 1 })
    expect(first.body.totalAmount).toBe(17)
    expect(first.body.items).toHaveLength(1)

    const filtered = await request(app).get('/api/orders').set('Cookie', cookie).query({ search: 'Idempotent', status: 'pending', limit: 1 })
    expect(filtered.status).toBe(200)
    expect(filtered.body.items[0].items[0].name).toBe('Notebook')
    const unsafeSort = await request(app).get('/api/orders').set('Cookie', cookie).query({ sort: 'created_at; DROP TABLE orders' })
    expect(unsafeSort.status).toBe(400)

    const agentDelete = await request(app).delete(`/api/orders/${first.body.id}`).set('Cookie', cookie)
    expect(agentDelete.status).toBe(403)
    const signedWithQueryOnly = await request(app).get('/api/orders').query({ token: cookie.split('=')[1] })
    expect(signedWithQueryOnly.status).toBe(401)
  })
})