-- Cleaning Twin: schema, email linking, and row level security.
--
-- Apply once, in the Supabase SQL editor or with `supabase db push`.
-- This file does not insert sample rows. Example rows live in supabase/seed.sql.
--
-- Access model
-- ------------
-- * admin_emails holds the login emails that are admins. Anyone can be made an
--   admin before or after they sign up; see supabase/make-admin.sql.
-- * A signed-in user is linked to a client when auth.users.email matches
--   clients.email (case-insensitive, trimmed). There is no link table and no
--   approval step. Changing either email moves access immediately.
-- * Linking reads auth.users, not public.profiles. Editing a profile cannot
--   grant access to somebody else's properties.
-- * Stock rows are manual counts. Deliveries and pickups never update them.
-- * The API roles anon and authenticated cannot bypass these policies.
--   is_admin() and current_user_email() are the only helpers that read
--   privileged tables, and they only answer questions about auth.uid().

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin noinherit;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin noinherit;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then
    create role service_role nologin noinherit bypassrls;
  end if;
end
$$;

revoke create on schema public from public;
revoke create on schema public from anon, authenticated;

grant usage on schema public to anon, authenticated, service_role;

create type public.movement_kind as enum ('delivery', 'pickup', 'stock_count');

create table public.admin_emails (
  email text primary key,
  created_at timestamptz not null default now(),
  constraint admin_emails_format check (
    email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
  )
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_email_format check (
    email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
  ),
  constraint profiles_name_length check (
    full_name is null or char_length(full_name) between 1 and 200
  )
);

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  phone text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint clients_name_length check (char_length(name) between 1 and 200),
  constraint clients_email_format check (
    email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
  ),
  constraint clients_phone_length check (phone is null or char_length(phone) between 1 and 40),
  constraint clients_notes_length check (notes is null or char_length(notes) <= 2000)
);

create table public.properties (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  name text not null,
  address text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint properties_name_length check (char_length(name) between 1 and 200),
  constraint properties_address_length check (
    address is null or char_length(address) between 1 and 300
  ),
  constraint properties_notes_length check (notes is null or char_length(notes) <= 2000)
);

create table public.movements (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  kind public.movement_kind not null,
  movement_date date not null,
  notes text,
  lenzuolo_matrimoniale integer not null default 0,
  lenzuolo_singolo integer not null default 0,
  federa integer not null default 0,
  telo_doccia integer not null default 0,
  telo_viso integer not null default 0,
  telo_ospite integer not null default 0,
  scendibagno integer not null default 0,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint movements_date_sane check (
    movement_date between date '2000-01-01' and date '2100-12-31'
  ),
  constraint movements_notes_length check (notes is null or char_length(notes) <= 2000),
  constraint movements_lenzuolo_matrimoniale_nonnegative check (lenzuolo_matrimoniale >= 0),
  constraint movements_lenzuolo_singolo_nonnegative check (lenzuolo_singolo >= 0),
  constraint movements_federa_nonnegative check (federa >= 0),
  constraint movements_telo_doccia_nonnegative check (telo_doccia >= 0),
  constraint movements_telo_viso_nonnegative check (telo_viso >= 0),
  constraint movements_telo_ospite_nonnegative check (telo_ospite >= 0),
  constraint movements_scendibagno_nonnegative check (scendibagno >= 0),
  -- A count may be all zeros: the property is empty. A delivery or pickup
  -- must move at least one piece. Stock is never derived from the other kinds.
  constraint movements_transfer_has_pieces check (
    kind = 'stock_count'
    or (
      lenzuolo_matrimoniale + lenzuolo_singolo + federa + telo_doccia
      + telo_viso + telo_ospite + scendibagno
    ) > 0
  )
);

create index clients_email_idx on public.clients (email);
create index properties_client_id_idx on public.properties (client_id);
create index movements_property_date_idx
  on public.movements (property_id, movement_date desc, created_at desc);
create index movements_kind_date_idx on public.movements (kind, movement_date);
create index movements_stock_latest_idx
  on public.movements (property_id, movement_date desc, created_at desc, id desc)
  where kind = 'stock_count';
create index profiles_email_idx on public.profiles (email);

create or replace function public.normalize_admin_email()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.email := lower(trim(new.email));
  return new;
end;
$$;

create trigger admin_emails_normalize
  before insert or update on public.admin_emails
  for each row execute function public.normalize_admin_email();

create or replace function public.normalize_client()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.name := trim(new.name);
  new.email := lower(trim(new.email));
  new.phone := nullif(trim(coalesce(new.phone, '')), '');
  new.notes := nullif(trim(coalesce(new.notes, '')), '');
  new.updated_at := clock_timestamp();
  return new;
end;
$$;

create trigger clients_normalize
  before insert or update on public.clients
  for each row execute function public.normalize_client();

create or replace function public.normalize_property()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.name := trim(new.name);
  new.address := nullif(trim(coalesce(new.address, '')), '');
  new.notes := nullif(trim(coalesce(new.notes, '')), '');
  new.updated_at := clock_timestamp();
  return new;
end;
$$;

create trigger properties_normalize
  before insert or update on public.properties
  for each row execute function public.normalize_property();

create or replace function public.stamp_movement()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.notes := nullif(trim(coalesce(new.notes, '')), '');
  new.updated_at := clock_timestamp();
  if tg_op = 'INSERT' then
    -- Ignore a caller-supplied actor. The signed-in user is the actor.
    new.created_by := auth.uid();
    new.created_at := clock_timestamp();
  else
    new.created_by := old.created_by;
    new.created_at := old.created_at;
  end if;
  return new;
end;
$$;

create trigger movements_stamp
  before insert or update on public.movements
  for each row execute function public.stamp_movement();

create or replace function public.sync_profile_from_auth()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_table_schema <> 'auth' or tg_table_name <> 'users' then
    raise exception 'sync_profile_from_auth cannot run on %.%', tg_table_schema, tg_table_name;
  end if;

  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    lower(trim(new.email)),
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), '')
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(excluded.full_name, public.profiles.full_name),
        updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_synced on auth.users;

create trigger on_auth_user_synced
  after insert or update of email, raw_user_meta_data on auth.users
  for each row execute function public.sync_profile_from_auth();

-- Returns only the signed-in user's email. security definer so the API role
-- does not need to read auth.users. row_security off so a profile policy can
-- never hide the caller's own auth row from this helper.
create or replace function public.current_user_email()
returns text
language sql
stable
security definer
set search_path = public, auth
set row_security = off
as $$
  select lower(trim(u.email))
  from auth.users as u
  where u.id = auth.uid()
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, auth
set row_security = off
as $$
  select exists (
    select 1
    from auth.users as u
    inner join public.admin_emails as a on a.email = lower(trim(u.email))
    where u.id = auth.uid()
  )
$$;

-- Sums one movement kind inside the caller's visible rows. security invoker:
-- row level security still applies, so a client total never includes another
-- client even if they pass that client's id.
create or replace function public.movement_totals(
  p_kind public.movement_kind,
  p_client_id uuid default null,
  p_property_id uuid default null,
  p_from date default null,
  p_to date default null
)
returns table (
  lenzuolo_matrimoniale integer,
  lenzuolo_singolo integer,
  federa integer,
  telo_doccia integer,
  telo_viso integer,
  telo_ospite integer,
  scendibagno integer,
  totale integer
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    coalesce(sum(m.lenzuolo_matrimoniale), 0)::integer,
    coalesce(sum(m.lenzuolo_singolo), 0)::integer,
    coalesce(sum(m.federa), 0)::integer,
    coalesce(sum(m.telo_doccia), 0)::integer,
    coalesce(sum(m.telo_viso), 0)::integer,
    coalesce(sum(m.telo_ospite), 0)::integer,
    coalesce(sum(m.scendibagno), 0)::integer,
    coalesce(sum(
      m.lenzuolo_matrimoniale + m.lenzuolo_singolo + m.federa + m.telo_doccia
      + m.telo_viso + m.telo_ospite + m.scendibagno
    ), 0)::integer
  from public.movements as m
  inner join public.properties as p on p.id = m.property_id
  where m.kind = p_kind
    and (p_client_id is null or p.client_id = p_client_id)
    and (p_property_id is null or m.property_id = p_property_id)
    and (p_from is null or m.movement_date >= p_from)
    and (p_to is null or m.movement_date <= p_to)
$$;

-- Latest manual count per property. Deliveries and pickups are ignored.
-- p_as_of keeps counts dated after the overview's end date out of "current".
create or replace function public.latest_stock_as_of(
  p_client_id uuid default null,
  p_property_id uuid default null,
  p_as_of date default null
)
returns table (
  id uuid,
  property_id uuid,
  property_name text,
  property_address text,
  client_id uuid,
  client_name text,
  movement_date date,
  notes text,
  lenzuolo_matrimoniale integer,
  lenzuolo_singolo integer,
  federa integer,
  telo_doccia integer,
  telo_viso integer,
  telo_ospite integer,
  scendibagno integer
)
language sql
stable
security invoker
set search_path = public
as $$
  select distinct on (m.property_id)
    m.id,
    m.property_id,
    p.name,
    p.address,
    p.client_id,
    c.name,
    m.movement_date,
    m.notes,
    m.lenzuolo_matrimoniale,
    m.lenzuolo_singolo,
    m.federa,
    m.telo_doccia,
    m.telo_viso,
    m.telo_ospite,
    m.scendibagno
  from public.movements as m
  inner join public.properties as p on p.id = m.property_id
  inner join public.clients as c on c.id = p.client_id
  where m.kind = 'stock_count'
    and (p_as_of is null or m.movement_date <= p_as_of)
    and (p_client_id is null or p.client_id = p_client_id)
    and (p_property_id is null or m.property_id = p_property_id)
  order by m.property_id, m.movement_date desc, m.created_at desc, m.id desc
$$;

revoke all on function public.current_user_email() from public;
revoke all on function public.is_admin() from public;
revoke all on function public.movement_totals(public.movement_kind, uuid, uuid, date, date) from public;
revoke all on function public.latest_stock_as_of(uuid, uuid, date) from public;

grant execute on function public.current_user_email() to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.movement_totals(public.movement_kind, uuid, uuid, date, date) to authenticated;
grant execute on function public.latest_stock_as_of(uuid, uuid, date) to authenticated;

grant select, insert, update, delete on public.clients to authenticated;
grant select, insert, update, delete on public.properties to authenticated;
grant select, insert, update, delete on public.movements to authenticated;
grant select on public.profiles to authenticated;

grant all on public.clients to service_role;
grant all on public.properties to service_role;
grant all on public.movements to service_role;
grant all on public.profiles to service_role;
grant all on public.admin_emails to service_role;

-- Trigger functions stay executable so Auth can sync profiles and the signed-in
-- admin can write through the BEFORE triggers. They are trigger-only.
grant execute on function public.normalize_admin_email() to authenticated, service_role;
grant execute on function public.normalize_client() to authenticated, service_role;
grant execute on function public.normalize_property() to authenticated, service_role;
grant execute on function public.stamp_movement() to authenticated, service_role;
grant execute on function public.sync_profile_from_auth() to service_role;

alter table public.admin_emails enable row level security;
alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.properties enable row level security;
alter table public.movements enable row level security;

-- admin_emails: no policies. authenticated and anon cannot read or write it.
-- Admins are designated in SQL, not from the app.

create policy profiles_select
  on public.profiles
  for select
  to authenticated
  using (id = auth.uid() or public.is_admin());

create policy clients_select
  on public.clients
  for select
  to authenticated
  using (public.is_admin() or email = public.current_user_email());

create policy clients_insert
  on public.clients
  for insert
  to authenticated
  with check (public.is_admin());

create policy clients_update
  on public.clients
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy clients_delete
  on public.clients
  for delete
  to authenticated
  using (public.is_admin());

create policy properties_select
  on public.properties
  for select
  to authenticated
  using (
    public.is_admin()
    or exists (
      select 1
      from public.clients as c
      where c.id = properties.client_id
        and c.email = public.current_user_email()
    )
  );

create policy properties_insert
  on public.properties
  for insert
  to authenticated
  with check (public.is_admin());

create policy properties_update
  on public.properties
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy properties_delete
  on public.properties
  for delete
  to authenticated
  using (public.is_admin());

create policy movements_select
  on public.movements
  for select
  to authenticated
  using (
    public.is_admin()
    or exists (
      select 1
      from public.properties as p
      inner join public.clients as c on c.id = p.client_id
      where p.id = movements.property_id
        and c.email = public.current_user_email()
    )
  );

create policy movements_insert
  on public.movements
  for insert
  to authenticated
  with check (public.is_admin());

create policy movements_update
  on public.movements
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy movements_delete
  on public.movements
  for delete
  to authenticated
  using (public.is_admin());

comment on table public.movements is
  'Deliveries, pickups, and manual stock counts. Stock is not computed from deliveries or pickups.';

comment on column public.clients.email is
  'Login email that can read this client. Matched to auth.users.email, not to profiles.';

comment on table public.admin_emails is
  'Login emails with admin access. Insert from the SQL editor; the app cannot write this table.';
