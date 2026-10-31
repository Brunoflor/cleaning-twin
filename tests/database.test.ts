import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { asDate, closeDb, migrate, one, scenario, type Ctx, type User } from './helpers/db'

before(async () => {
  await migrate()
})

after(async () => {
  await closeDb()
})

async function insertClient(ctx: Ctx, admin: User, name: string, email: string) {
  return ctx.asUser(admin, async () => {
    const rows = await ctx.query<{ id: string; email: string }>(
      `insert into public.clients (name, email) values ($1, $2) returning id, email`,
      [name, email],
    )
    return one(rows, 'client')
  })
}

test('API roles cannot read admin emails or auth users, and policies are enabled', async () => {
  await scenario(async (ctx) => {
    const tables = await ctx.query<{ relname: string; relrowsecurity: boolean }>(
      `select c.relname, c.relrowsecurity
       from pg_class c
       join pg_namespace n on n.oid = c.relnamespace
       where n.nspname = 'public' and c.relkind = 'r'
       order by c.relname`,
    )
    assert.deepEqual(
      tables.map((table) => table.relname),
      ['admin_emails', 'clients', 'movements', 'profiles', 'properties'],
    )
    assert.ok(tables.every((table) => table.relrowsecurity === true))

    const policies = await ctx.query<{ policyname: string }>(
      `select policyname from pg_policies where schemaname = 'public' order by policyname`,
    )
    assert.deepEqual(
      policies.map((policy) => policy.policyname),
      [
        'clients_delete',
        'clients_insert',
        'clients_select',
        'clients_update',
        'movements_delete',
        'movements_insert',
        'movements_select',
        'movements_update',
        'profiles_select',
        'properties_delete',
        'properties_insert',
        'properties_select',
        'properties_update',
      ],
    )

    const grants = await ctx.query<{ name: string; allowed: boolean }>(
      `select * from (
         values
           ('anon_clients', has_table_privilege('anon', 'public.clients', 'SELECT')),
           ('auth_admin_emails', has_table_privilege('authenticated', 'public.admin_emails', 'SELECT')),
           ('auth_clients_insert', has_table_privilege('authenticated', 'public.clients', 'INSERT')),
           ('anon_is_admin', has_function_privilege('anon', 'public.is_admin()', 'EXECUTE')),
           ('auth_is_admin', has_function_privilege('authenticated', 'public.is_admin()', 'EXECUTE')),
           ('auth_totals', has_function_privilege('authenticated', 'public.movement_totals(public.movement_kind, uuid, uuid, date, date)', 'EXECUTE'))
       ) as g(name, allowed)`,
    )
    const allowed = Object.fromEntries(grants.map((row) => [row.name, row.allowed]))
    assert.equal(allowed.anon_clients, false)
    assert.equal(allowed.auth_admin_emails, false)
    assert.equal(allowed.auth_clients_insert, true)
    assert.equal(allowed.anon_is_admin, false)
    assert.equal(allowed.auth_is_admin, true)
    assert.equal(allowed.auth_totals, true)

    const stranger = await ctx.createUser('stranger@unknown.example')
    await ctx.asAnon(async () => {
      await ctx.expectError(() => ctx.query('select * from public.clients'), '42501')
    })
    await ctx.asUser(stranger, async () => {
      await ctx.expectError(() => ctx.query('select * from public.admin_emails'), '42501')
      await ctx.expectError(() => ctx.query('select * from auth.users'), '42501')
      await ctx.expectError(
        () => ctx.query(`insert into public.admin_emails (email) values ('hack@evil.example')`),
        '42501',
      )
    })
  })
})

test('admin status follows admin_emails and can be granted after sign-up', async () => {
  await scenario(async (ctx) => {
    const owner = await ctx.createUser('Owner@Laundry.example', 'Bruno')
    await ctx.asUser(owner, async () => {
      const admin = await ctx.query<{ is_admin: boolean }>('select public.is_admin() as is_admin')
      assert.equal(one(admin, 'is_admin').is_admin, false)
      await ctx.expectError(
        () => ctx.query(`insert into public.clients (name, email) values ('X', 'x@hotel.example')`),
        '42501',
      )
    })

    await ctx.grantAdmin('OWNER@laundry.example')
    await ctx.asUser(owner, async () => {
      const admin = await ctx.query<{ is_admin: boolean }>('select public.is_admin() as is_admin')
      assert.equal(one(admin, 'is_admin').is_admin, true)
      const profile = await ctx.query<{ email: string; full_name: string }>(
        'select email, full_name from public.profiles where id = $1',
        [owner.id],
      )
      assert.equal(one(profile, 'profile').email, 'owner@laundry.example')
      assert.equal(one(profile, 'profile').full_name, 'Bruno')
    })
  })
})

test('email linking works before or after sign-up, ignores case, and ignores profiles', async () => {
  await scenario(async (ctx) => {
    const admin = await ctx.createUser('admin@cleaning-twin.example')
    await ctx.grantAdmin(admin.email)

    const early = await ctx.createUser('Maria@Hotel.example', 'Maria')
    await ctx.asUser(early, async () => {
      const rows = await ctx.query('select id from public.clients')
      assert.equal(rows.length, 0)
    })

    const client = await insertClient(ctx, admin, 'Hotel Vesuvio', ' maria@HOTEL.example ')
    assert.equal(client.email, 'maria@hotel.example')

    await ctx.asUser(early, async () => {
      const rows = await ctx.query<{ id: string }>('select id from public.clients')
      assert.deepEqual(rows.map((row) => row.id), [client.id])
    })

    const late = await ctx.createUser('late@other.example')
    await insertClient(ctx, admin, 'B&B Spaccanapoli', 'late@other.example')
    await ctx.asUser(late, async () => {
      const rows = await ctx.query<{ name: string }>('select name from public.clients')
      assert.deepEqual(rows.map((row) => row.name), ['B&B Spaccanapoli'])
    })

    const luca = await ctx.createUser('luca@other.example')
    await ctx.asUser(luca, async () => {
      const visible = await ctx.query('select id from public.clients')
      assert.equal(visible.length, 0)
      const targeted = await ctx.query('select id from public.clients where id = $1', [client.id])
      assert.equal(targeted.length, 0)
      await ctx.expectError(
        () => ctx.query(`update public.profiles set email = 'maria@hotel.example' where id = $1`, [luca.id]),
        '42501',
      )
    })

    await ctx.query(`update public.profiles set email = 'maria@hotel.example' where id = $1`, [luca.id])
    await ctx.asUser(luca, async () => {
      const rows = await ctx.query('select id from public.clients')
      assert.equal(rows.length, 0)
    })
    await ctx.asUser(early, async () => {
      const rows = await ctx.query<{ id: string }>('select id from public.clients')
      assert.deepEqual(rows.map((row) => row.id), [client.id])
    })
  })
})

test('changing the client email or the login email moves access', async () => {
  await scenario(async (ctx) => {
    const admin = await ctx.createUser('admin@cleaning-twin.example')
    await ctx.grantAdmin(admin.email)
    const maria = await ctx.createUser('maria@hotel.example')
    const giulia = await ctx.createUser('giulia@villa.example')
    const client = await insertClient(ctx, admin, 'Hotel Vesuvio', 'maria@hotel.example')

    await ctx.asUser(admin, async () => {
      await ctx.query(`update public.clients set email = 'Giulia@Villa.example' where id = $1`, [client.id])
    })

    await ctx.asUser(maria, async () => {
      assert.equal((await ctx.query('select id from public.clients')).length, 0)
    })
    await ctx.asUser(giulia, async () => {
      const rows = await ctx.query<{ email: string }>('select email from public.clients')
      assert.equal(one(rows, 'moved').email, 'giulia@villa.example')
    })

    await ctx.query(`update auth.users set email = 'maria.new@hotel.example' where id = $1`, [giulia.id])
    const profile = await ctx.query<{ email: string }>('select email from public.profiles where id = $1', [giulia.id])
    assert.equal(one(profile, 'synced profile').email, 'maria.new@hotel.example')
    await ctx.asUser(giulia, async () => {
      assert.equal((await ctx.query('select id from public.clients')).length, 0)
    })

    await ctx.asUser(admin, async () => {
      await ctx.query(`update public.clients set email = 'maria.new@hotel.example' where id = $1`, [client.id])
    })
    await ctx.asUser(giulia, async () => {
      assert.equal((await ctx.query('select id from public.clients')).length, 1)
    })
  })
})

test('a client can read only their history and cannot write anything', async () => {
  await scenario(async (ctx) => {
    const admin = await ctx.createUser('admin@cleaning-twin.example')
    await ctx.grantAdmin(admin.email)
    const maria = await ctx.createUser('maria@hotel.example')
    const luca = await ctx.createUser('luca@other.example')
    const hotel = await insertClient(ctx, admin, 'Hotel Vesuvio', 'maria@hotel.example')
    const other = await insertClient(ctx, admin, 'B&B Spaccanapoli', 'luca@other.example')

    const property = await ctx.asUser(admin, async () => {
      const rows = await ctx.query<{ id: string }>(
        `insert into public.properties (client_id, name, address) values ($1, 'Camere vista mare', 'Via Partenope 45') returning id`,
        [hotel.id],
      )
      const hidden = await ctx.query<{ id: string }>(
        `insert into public.properties (client_id, name) values ($1, 'Piano nobile') returning id`,
        [other.id],
      )
      const movement = await ctx.query<{ id: string; created_by: string }>(
        `insert into public.movements (
           property_id, kind, movement_date, created_by, federa
         ) values ($1, 'delivery', '2026-10-28', $2, 12)
         returning id, created_by`,
        [rows[0].id, luca.id],
      )
      assert.equal(one(movement, 'actor').created_by, admin.id)
      return { id: one(rows, 'property').id, hiddenId: one(hidden, 'hidden').id, movementId: one(movement, 'movement').id }
    })

    await ctx.asUser(maria, async () => {
      const properties = await ctx.query<{ name: string }>('select name from public.properties order by name')
      assert.deepEqual(properties.map((row) => row.name), ['Camere vista mare'])
      const byId = await ctx.query('select id from public.properties where id = $1', [property.hiddenId])
      assert.equal(byId.length, 0)
      const movements = await ctx.query<{ federa: number }>('select federa from public.movements')
      assert.deepEqual(movements, [{ federa: 12 }])
      const hiddenMovement = await ctx.query('select id from public.movements where id = $1 and property_id = $2', [
        property.movementId,
        property.hiddenId,
      ])
      assert.equal(hiddenMovement.length, 0)

      await ctx.expectError(
        () =>
          ctx.query(
            `insert into public.movements (property_id, kind, movement_date, federa) values ($1, 'delivery', '2026-10-29', 1)`,
            [property.id],
          ),
        '42501',
      )
      assert.equal(
        await ctx.write(`update public.movements set federa = 99 where id = $1`, [property.movementId]),
        0,
      )
      assert.equal(await ctx.write(`delete from public.properties where id = $1`, [property.id]), 0)
      await ctx.expectError(
        () => ctx.query(`insert into public.clients (name, email) values ('Altro', 'altro@hotel.example')`),
        '42501',
      )
      const others = await ctx.query('select id from public.profiles where id = $1', [luca.id])
      assert.equal(others.length, 0)
    })

    const stillThere = await ctx.query<{ federa: number }>('select federa from public.movements where id = $1', [
      property.movementId,
    ])
    assert.equal(one(stillThere, 'unchanged').federa, 12)
  })
})

test('stock is the latest manual count and totals stay inside the caller rows', async () => {
  await scenario(async (ctx) => {
    const admin = await ctx.createUser('admin@cleaning-twin.example')
    await ctx.grantAdmin(admin.email)
    const maria = await ctx.createUser('maria@hotel.example')
    const luca = await ctx.createUser('luca@other.example')
    const hotel = await insertClient(ctx, admin, 'Hotel Vesuvio', 'maria@hotel.example')
    const other = await insertClient(ctx, admin, 'B&B Spaccanapoli', 'luca@other.example')

    const ids = await ctx.asUser(admin, async () => {
      const mare = one(
        await ctx.query<{ id: string }>(
          `insert into public.properties (client_id, name) values ($1, 'Camere vista mare') returning id`,
          [hotel.id],
        ),
        'mare',
      )
      const piano = one(
        await ctx.query<{ id: string }>(
          `insert into public.properties (client_id, name) values ($1, 'Piano nobile') returning id`,
          [other.id],
        ),
        'piano',
      )
      await ctx.query(
        `insert into public.movements (
           property_id, kind, movement_date,
           lenzuolo_matrimoniale, lenzuolo_singolo, federa, telo_doccia, telo_viso, telo_ospite, scendibagno
         ) values
           ($1, 'stock_count', '2026-10-01', 5, 0, 0, 0, 0, 0, 0),
           ($1, 'delivery', '2026-11-02', 100, 0, 0, 0, 0, 0, 0),
           ($1, 'stock_count', '2026-10-31', 9, 1, 0, 0, 0, 0, 0),
           ($1, 'pickup', '2026-10-29', 3, 0, 0, 0, 0, 0, 0),
           ($2, 'delivery', '2026-10-27', 50, 0, 0, 0, 0, 0, 0),
           ($1, 'stock_count', '2026-11-03', 0, 0, 0, 0, 0, 0, 0)`,
        [mare.id, piano.id],
      )
      await ctx.expectError(
        () =>
          ctx.query(
            `insert into public.movements (property_id, kind, movement_date) values ($1, 'delivery', '2026-10-01')`,
            [mare.id],
          ),
        '23514',
      )
      return { mare: mare.id, piano: piano.id }
    })

    await ctx.asUser(admin, async () => {
      const latest = await ctx.query<{
        property_id: string
        movement_date: string | Date
        lenzuolo_matrimoniale: number
        lenzuolo_singolo: number
      }>(`select * from public.latest_stock_as_of(null, $1, null)`, [ids.mare])
      const row = one(latest, 'latest')
      assert.equal(asDate(row.movement_date), '2026-11-03')
      assert.equal(row.lenzuolo_matrimoniale, 0)
      assert.equal(row.lenzuolo_singolo, 0)

      const asOf = one(
        await ctx.query<{ lenzuolo_matrimoniale: number; movement_date: string | Date }>(
          `select movement_date, lenzuolo_matrimoniale from public.latest_stock_as_of(null, $1, '2026-10-15')`,
          [ids.mare],
        ),
        'as of',
      )
      assert.equal(asDate(asOf.movement_date), '2026-10-01')
      assert.equal(asOf.lenzuolo_matrimoniale, 5)

      const endOfOctober = one(
        await ctx.query<{ lenzuolo_matrimoniale: number; lenzuolo_singolo: number; movement_date: string | Date }>(
          `select movement_date, lenzuolo_matrimoniale, lenzuolo_singolo
           from public.latest_stock_as_of(null, $1, '2026-10-31')`,
          [ids.mare],
        ),
        'end of october',
      )
      assert.equal(asDate(endOfOctober.movement_date), '2026-10-31')
      assert.equal(endOfOctober.lenzuolo_matrimoniale, 9)
      assert.equal(endOfOctober.lenzuolo_singolo, 1)

      const totals = one(
        await ctx.query<{ lenzuolo_matrimoniale: number; totale: number }>(
          `select lenzuolo_matrimoniale, totale
           from public.movement_totals('delivery', null, null, '2026-10-01', '2026-10-31')`,
        ),
        'admin totals',
      )
      assert.equal(totals.lenzuolo_matrimoniale, 50)
      assert.equal(totals.totale, 50)
    })

    await ctx.asUser(maria, async () => {
      const hiddenClient = await ctx.query(
        `select id from public.latest_stock_as_of($1, null, null)`,
        [other.id],
      )
      assert.equal(hiddenClient.length, 0)

      const own = one(
        await ctx.query<{ movement_date: string | Date; lenzuolo_matrimoniale: number }>(
          `select movement_date, lenzuolo_matrimoniale from public.latest_stock_as_of(null, null, null)`,
        ),
        'maria latest',
      )
      assert.equal(asDate(own.movement_date), '2026-11-03')
      assert.equal(own.lenzuolo_matrimoniale, 0)

      const foreign = await ctx.query(`select id from public.latest_stock_as_of(null, $1, null)`, [ids.piano])
      assert.equal(foreign.length, 0)

      const totals = one(
        await ctx.query<{ lenzuolo_matrimoniale: number; totale: number }>(
          `select lenzuolo_matrimoniale, totale from public.movement_totals('delivery', null, null, null, null)`,
        ),
        'maria totals',
      )
      assert.equal(totals.lenzuolo_matrimoniale, 100)
      assert.equal(totals.totale, 100)

      const crossed = one(
        await ctx.query<{ totale: number }>(
          `select totale from public.movement_totals('delivery', $1, null, null, null)`,
          [other.id],
        ),
        'maria cannot total another client',
      )
      assert.equal(crossed.totale, 0)
    })

    await ctx.asUser(luca, async () => {
      const totals = one(
        await ctx.query<{ totale: number }>(
          `select totale from public.movement_totals('delivery', null, null, null, null)`,
        ),
        'luca totals',
      )
      assert.equal(totals.totale, 50)
    })
  })
})

test('deleting a client removes properties and movements', async () => {
  await scenario(async (ctx) => {
    const admin = await ctx.createUser('admin@cleaning-twin.example')
    await ctx.grantAdmin(admin.email)
    const client = await insertClient(ctx, admin, 'Villa Floridiana', 'giulia@villa.example')
    await ctx.asUser(admin, async () => {
      const property = one(
        await ctx.query<{ id: string }>(
          `insert into public.properties (client_id, name) values ($1, 'Suite') returning id`,
          [client.id],
        ),
        'property',
      )
      await ctx.query(
        `insert into public.movements (property_id, kind, movement_date, scendibagno)
         values ($1, 'stock_count', '2026-10-31', 0)`,
        [property.id],
      )
      await ctx.query('delete from public.clients where id = $1', [client.id])
    })
    const left = await ctx.query(
      `select id from public.properties where client_id = $1
       union all
       select id from public.movements`,
      [client.id],
    )
    assert.equal(left.length, 0)
  })
})
