import 'dotenv/config'
import app from './app.js'
import { db } from './db/database.js'

const port = Number(process.env.PORT ?? 3000)

const server = app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`)
})

const close = (): void => {
  server.close(() => {
    db.close()
    process.exit(0)
  })
}

process.on('SIGINT', close)
process.on('SIGTERM', close)