import jwt from 'jsonwebtoken'
import type { NextFunction, Request, Response } from 'express'
import { db } from '../db/database.js'

export type UserRole = 'admin' | 'agent'

declare module 'express-serve-static-core' {
  interface Request {
    user?: { id: string; role: UserRole }
  }
}

const secret = process.env.JWT_SECRET
if (!secret || secret.length < 32) {
  throw new Error('JWT_SECRET must be set and contain at least 32 characters.')
}
const jwtSecret: string = secret

export function requireAuth(request: Request, response: Response, next: NextFunction): void {
  const token = request.cookies?.sarh_session
    ?? request.get('Authorization')?.match(/^Bearer ([^\s]+)$/)?.[1]
  if (!token) {
    response.status(401).json({ error: 'Authentication required' })
    return
  }

  try {
    const payload = jwt.verify(token, jwtSecret, { algorithms: ['HS256'] })
    if (typeof payload === 'string' || typeof payload.sub !== 'string' || typeof payload.ver !== 'number') {
      response.status(401).json({ error: 'Invalid session' })
      return
    }
    const user = db.prepare('SELECT id, role, token_version FROM users WHERE id = ?').get(payload.sub) as {
      id: string
      role: UserRole
      token_version: number
    } | undefined
    if (!user || user.token_version !== payload.ver) {
      response.status(401).json({ error: 'Invalid session' })
      return
    }
    request.user = { id: user.id, role: user.role }
    next()
  } catch {
    response.status(401).json({ error: 'Invalid session' })
  }
}

export function requireRole(role: UserRole) {
  return (request: Request, response: Response, next: NextFunction): void => {
    if (request.user?.role !== role) {
      response.status(403).json({ error: 'Insufficient permissions' })
      return
    }
    next()
  }
}