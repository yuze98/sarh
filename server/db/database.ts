import Database from 'better-sqlite3'
import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { schema } from './schema.js'

const databasePath = resolve(process.env.DATABASE_PATH ?? './data/orders.db')
mkdirSync(dirname(databasePath), { recursive: true })

export const db = new Database(databasePath)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')
db.exec(schema)

const userColumns = db.pragma('table_info(users)') as Array<{ name: string }>
if (!userColumns.some(({ name }) => name === 'token_version')) {
	db.exec('ALTER TABLE users ADD COLUMN token_version INTEGER NOT NULL DEFAULT 0')
}