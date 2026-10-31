-- EXAMPLE DATA — not a migration, and not for production.
--
-- Supabase loads this file on `supabase db reset` only. The emails use the
-- reserved .example domain. Signing up as admin@cleaning-twin.example makes
-- that account the example admin because the address is listed below.
-- Delete these rows freely. Applying migrations does not insert them.

insert into public.admin_emails (email)
values ('admin@cleaning-twin.example');

insert into public.clients (id, name, email, phone, notes) values
  (
    '10000000-0000-4000-8000-000000000001',
    'Hotel Vesuvio',
    'maria@hotel-vesuvio.example',
    '+39 081 000 0001',
    'Referente: Maria Esposito'
  ),
  (
    '10000000-0000-4000-8000-000000000002',
    'B&B Spaccanapoli',
    'luca@spaccanapoli.example',
    '+39 081 000 0002',
    'Check-in nel pomeriggio'
  );

insert into public.properties (id, client_id, name, address) values
  (
    '20000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    'Camere vista mare',
    'Via Partenope 45, Napoli'
  ),
  (
    '20000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000001',
    'Dipendenze',
    'Via Partenope 47, Napoli'
  ),
  (
    '20000000-0000-4000-8000-000000000003',
    '10000000-0000-4000-8000-000000000002',
    'Piano nobile',
    'Via dei Tribunali 12, Napoli'
  );

insert into public.movements (
  id, property_id, kind, movement_date, notes,
  lenzuolo_matrimoniale, lenzuolo_singolo, federa,
  telo_doccia, telo_viso, telo_ospite, scendibagno
) values
  (
    '30000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000001',
    'stock_count', '2026-10-01', 'Conteggio di inizio mese',
    36, 14, 84, 44, 46, 22, 20
  ),
  (
    '30000000-0000-4000-8000-000000000002',
    '20000000-0000-4000-8000-000000000001',
    'delivery', '2026-10-28', null,
    30, 10, 80, 40, 40, 20, 20
  ),
  (
    '30000000-0000-4000-8000-000000000003',
    '20000000-0000-4000-8000-000000000001',
    'pickup', '2026-10-29', 'Manca una federa segnalata dal piano',
    28, 10, 76, 38, 36, 18, 20
  ),
  (
    '30000000-0000-4000-8000-000000000004',
    '20000000-0000-4000-8000-000000000001',
    'stock_count', '2026-10-31', null,
    40, 16, 90, 48, 50, 24, 22
  ),
  (
    '30000000-0000-4000-8000-000000000005',
    '20000000-0000-4000-8000-000000000002',
    'delivery', '2026-10-28', null,
    8, 4, 20, 12, 12, 6, 6
  ),
  (
    '30000000-0000-4000-8000-000000000006',
    '20000000-0000-4000-8000-000000000002',
    'stock_count', '2026-10-20', 'Struttura quasi vuota',
    0, 0, 0, 2, 2, 0, 1
  ),
  (
    '30000000-0000-4000-8000-000000000007',
    '20000000-0000-4000-8000-000000000003',
    'delivery', '2026-10-27', null,
    6, 2, 16, 8, 8, 4, 4
  ),
  (
    '30000000-0000-4000-8000-000000000008',
    '20000000-0000-4000-8000-000000000003',
    'pickup', '2026-10-30', null,
    5, 2, 14, 7, 8, 4, 4
  );
