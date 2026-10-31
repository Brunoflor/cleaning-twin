import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { PGlite, type Results } from '@electric-sql/pglite'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

export type User = { id: string; email: string }

export type Ctx = {
  query<T extends Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T[]>
  exec(sql: string): Promise<void>
  /** Rows written by UPDATE/DELETE. RLS that hides every row reports 0 and does not throw. */
  write(sql: string, params?: unknown[]): Promise<number>
  createUser(email: string, fullName?: string): Promise<User>
  grantAdmin(email: string): Promise<void>
  asUser<T>(user: User, fn: () => Promise<T>): Promise<T>
  asAnon<T>(fn: () => Promise<T>): Promise<T>
  expectError(fn: () => Promise<unknown>, code: string): Promise<void>
}

let db: PGlite | undefined

export async function migrate(): Promise<void> {
  db = new PGlite()
  await db.exec(readFileSync(path.join(root, 'tests/helpers/stubs.sql'), 'utf8'))
  await db.exec(readFileSync(path.join(root, 'supabase/migrations/20261031120000_init.sql'), 'utf8'))
}

export async function closeDb(): Promise<void> {
  await db?.close()
  db = undefined
}

function database(): PGlite {
  if (!db) throw new Error('Test database is not ready')
  return db
}

class RolledBack extends Error {}

export async function scenario(fn: (ctx: Ctx) => Promise<void>): Promise<void> {
  const pg = database()
  let savepoints = 0

  await pg.transaction(async (tx) => {
    const run = async <T extends Record<string, unknown>>(sql: string, params: unknown[] = []) =>
      tx.query<T>(sql, params)

    async function withRole<T>(
      role: 'authenticated' | 'anon',
      user: User | null,
      body: () => Promise<T>,
    ): Promise<T> {
      const claims = JSON.stringify({
        sub: user?.id ?? '',
        email: user?.email ?? '',
        role,
      })
      await tx.query(`select set_config('request.jwt.claims', $1, true)`, [claims])
      await tx.query(`select set_config('request.jwt.claim.sub', $1, true)`, [user?.id ?? ''])
      await tx.exec(`set local role ${role}`)
      const who = await tx.query<{ current_user: string }>('select current_user')
      if (who.rows[0]?.current_user !== role) {
        throw new Error(`Expected role ${role}, session is ${who.rows[0]?.current_user ?? 'unknown'}`)
      }
      try {
        return await body()
      } finally {
        try {
          await tx.exec('reset role')
          await tx.query(`select set_config('request.jwt.claims', '', true)`)
          await tx.query(`select set_config('request.jwt.claim.sub', '', true)`)
        } catch {
          // The transaction is aborted; the caller rolls it back.
        }
      }
    }

    const ctx: Ctx = {
      async query<T extends Record<string, unknown>>(sql: string, params: unknown[] = []) {
        const result = await run<T>(sql, params)
        return result.rows
      },
      async exec(sql) {
        await tx.exec(sql)
      },
      async write(sql, params = []) {
        const result: Results = await tx.query(sql, params)
        return result.rowCount ?? result.affectedRows ?? 0
      },
      async createUser(email, fullName = '') {
        const id = crypto.randomUUID()
        await tx.query(
          `insert into auth.users (id, email, raw_user_meta_data) values ($1, $2, $3::jsonb)`,
          [id, email, JSON.stringify({ full_name: fullName })],
        )
        return { id, email }
      },
      async grantAdmin(email) {
        await tx.query(`insert into public.admin_emails (email) values ($1)`, [email])
      },
      asUser(user, body) {
        return withRole('authenticated', user, body)
      },
      asAnon(body) {
        return withRole('anon', null, body)
      },
      async expectError(body, code) {
        const name = `sp_${++savepoints}`
        await tx.exec(`savepoint ${name}`)
        let failure: unknown
        try {
          await body()
          failure = new Error(`Expected SQLSTATE ${code}, but the statement succeeded`)
        } catch (error) {
          const actual = errorCode(error)
          if (actual !== code) {
            const message = error instanceof Error ? error.message : String(error)
            failure = new Error(`Expected SQLSTATE ${code}, got ${actual || 'no code'}: ${message}`)
          }
        }
        await tx.exec(`rollback to savepoint ${name}`)
        if (failure) throw failure
      },
    }

    await fn(ctx)
    throw new RolledBack()
  }).catch((error: unknown) => {
    if (error instanceof RolledBack) return
    throw error
  })
}

function errorCode(error: unknown): string {
  if (error && typeof error === 'object' && 'code' in error && typeof error.code === 'string') {
    return error.code
  }
  return ''
}

export function one<T>(rows: T[], label: string): T {
  if (rows.length !== 1) {
    throw new Error(`${label}: expected 1 row, got ${rows.length}`)
  }
  return rows[0]
}

export function asDate(value: unknown): string {
  if (value instanceof Date) {
    const year = value.getFullYear()
    const month = String(value.getMonth() + 1).padStart(2, '0')
    const day = String(value.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
  return String(value).slice(0, 10)
}
