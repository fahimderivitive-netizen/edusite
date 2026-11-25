-- Phase 10 migration (idempotent). Run after phase9.sql.
-- Coupons: admin-created discount codes (percent or fixed BDT), optionally limited to one course,
-- with total-use and per-student limits and an expiry. Students never read this table: the server validates codes
-- with the service key and recomputes the price, so codes cannot be listed or guessed from the browser.

create table if not exists coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null check (code = upper(code) and char_length(code) between 3 and 32 and code ~ '^[A-Z0-9_-]+$'),
  kind text not null check (kind in ('percent', 'fixed')),
  value numeric not null check (value > 0),
  course_id uuid references courses on delete cascade, -- null = any paid course
  max_uses int check (max_uses is null or max_uses > 0),
  per_user_limit int not null default 1 check (per_user_limit > 0),
  used_count int not null default 0 check (used_count >= 0),
  starts_at timestamptz,
  expires_at timestamptz,
  active boolean not null default true,
  note text,
  created_at timestamptz not null default now(),
  check (kind <> 'percent' or value <= 100)
);
create unique index if not exists coupons_code_key on coupons (code);

create table if not exists coupon_redemptions (
  id uuid primary key default gen_random_uuid(),
  coupon_id uuid not null references coupons on delete restrict, -- a coupon with history cannot be deleted, only deactivated
  user_id uuid not null references profiles on delete cascade,
  payment_id uuid not null unique references payments on delete cascade,
  discount_amount numeric not null check (discount_amount >= 0),
  created_at timestamptz not null default now()
);

alter table payments add column if not exists coupon_id uuid references coupons;
alter table payments add column if not exists list_price numeric;
alter table payments add column if not exists discount_amount numeric not null default 0;

alter table coupons enable row level security;
alter table coupon_redemptions enable row level security;
drop policy if exists "coupons admin all" on coupons;
create policy "coupons admin all" on coupons for all using (is_admin()) with check (is_admin());
drop policy if exists "coupon_redemptions admin read" on coupon_redemptions;
create policy "coupon_redemptions admin read" on coupon_redemptions for select using (is_admin());

revoke all on coupons, coupon_redemptions from anon;
grant select, insert, update, delete on coupons to authenticated; -- RLS limits this to admins
grant select on coupon_redemptions to authenticated;
grant all on coupons, coupon_redemptions to service_role;

-- Called by the server after a payment is confirmed paid. Records the redemption once and counts it once (idempotent).
create or replace function redeem_coupon(p_payment uuid) returns void
language plpgsql security definer set search_path = public as $$
declare p payments; rid uuid;
begin
  select * into p from payments where id = p_payment and status = 'paid' and coupon_id is not null;
  if not found then return; end if;
  insert into coupon_redemptions (coupon_id, user_id, payment_id, discount_amount)
    values (p.coupon_id, p.user_id, p.id, p.discount_amount)
    on conflict (payment_id) do nothing returning id into rid;
  if rid is not null then update coupons set used_count = used_count + 1 where id = p.coupon_id; end if;
end $$;
revoke all on function redeem_coupon(uuid) from public, anon, authenticated;
grant execute on function redeem_coupon(uuid) to service_role;
