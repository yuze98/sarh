import 'dotenv/config'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import type { ErrorRequestHandler } from 'express'
import authRouter from './routes/auth.js'
import ordersRouter from './routes/orders.js'

const app = express()

app.use(cors({ origin: process.env.APP_ORIGIN ?? 'http://localhost:5173', credentials: true }))
app.use(express.json({ limit: '1mb' }))
app.use(cookieParser())
app.use('/api/orders', ordersRouter)
app.use('/api/auth', authRouter)
app.get('/api/health', (_request, response) => {
  response.json({ status: 'ok' })
})

const errorHandler: ErrorRequestHandler = (error: unknown, _request, response, next) => {
  console.error(error)
  void next
  response.status(500).json({ error: 'Internal server error' })
}
app.use(errorHandler)

export default app