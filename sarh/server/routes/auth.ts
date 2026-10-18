import bcrypt from 'bcrypt'
import { randomUUID } from 'node:crypto'
import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { db } from '../db/database.js'
import { requireAuth } from '../middleware/auth.js'
import { sessionCookieOptions } from '../utils/sessionCookie.js'

const router = Router()
const loginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(256),
})
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Try again later.' },
})
const dummyHash = bcrypt.hashSync('invalid-password-comparison', 12)

router.post('/login', loginLimiter, async (request, response) => {
  const parsed = loginSchema.safeParse(request.body)
  if (!parsed.success) {
    response.status(400).json({ error: 'Invalid email or password' })
    return
  }

  const email = parsed.data.email.toLowerCase()
  const user = db.prepare('SELECT id, password_hash, token_version FROM users WHERE email = ? COLLATE NOCASE').get(email) as {
    id: string
    password_hash: string
    token_version: number
  } | undefined
  const passwordMatches = await bcrypt.compare(parsed.data.password, user?.password_hash ?? dummyHash)
  if (!user || !passwordMatches) {
    response.status(401).json({ error: 'Invalid email or password' })
    return
  }

  const secret = process.env.JWT_SECRET
  if (!secret || secret.length < 32) throw new Error('JWT_SECRET must be set and contain at least 32 characters.')
  const token = jwt.sign({ ver: user.token_version }, secret, {
    algorithm: 'HS256',
    subject: user.id,
    expiresIn: '15m',
    jwtid: randomUUID(),
  })
  response.cookie('sarh_session', token, {
    ...sessionCookieOptions,
    maxAge: 15 * 60 * 1000,
  })
  response.json({ user: { id: user.id } })
})

router.post('/logout', requireAuth, (request, response) => {
  db.prepare('UPDATE users SET token_version = token_version + 1 WHERE id = ?').run(request.user!.id)
  response.clearCookie('sarh_session', sessionCookieOptions)
  response.status(204).end()
})

router.get('/me', requireAuth, (request, response) => {
  response.json({ user: request.user })
})

export default router