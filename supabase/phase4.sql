-- Phase 4 migration (idempotent). Run after phase3.sql.
-- Payments are written only by the server (service role) after SSLCommerz validation.

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  tran_id text unique not null,
  user_id uuid not null references profiles on delete cascade,
  course_id uuid not null references courses on delete cascade,
  amount numeric not null check (amount >= 0),
  currency text not null default 'BDT',
  status text not null default 'pending' check (status in ('pending','paid','failed','cancelled','refunded')),
  val_id text,
  bank_tran_id text,
  card_type text,
  gateway_payload jsonb,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);
alter table payments enable row level security;
drop policy if exists "payments read own" on payments;
create policy "payments read own" on payments for select using (user_id = auth.uid() or is_admin());
revoke all on payments from anon;
grant select on payments to authenticated;

alter table enrollments add column if not exists payment_id uuid references payments;
