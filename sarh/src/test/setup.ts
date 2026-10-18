import { randomUUID } from 'node:crypto'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

process.env.JWT_SECRET = 'duplicate-test-secret-with-more-than-32-characters'
process.env.DATABASE_PATH = join(tmpdir(), `sarh-vitest-${randomUUID()}.db`)
process.env.NODE_ENV = 'test'