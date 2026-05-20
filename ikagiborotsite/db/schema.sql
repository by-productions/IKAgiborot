-- ============================================
-- סכימת Supabase: תחרות כרטיסים + ניהול קאסט
-- ניתן להריץ חוזר (idempotent)
-- ============================================

-- ---------- תחרות הכרטיסים ----------
create table if not exists public.ticket_sales (
  id          bigint generated always as identity primary key,
  actor_name  text not null check (char_length(actor_name) between 1 and 80),
  buyer_name  text not null check (char_length(buyer_name) between 1 and 120),
  qty         integer not null check (qty between 1 and 200),
  performance text,
  created_at  timestamptz not null default now()
);

alter table public.ticket_sales add column if not exists performance text;
create index if not exists ticket_sales_actor_idx on public.ticket_sales (actor_name);
create index if not exists ticket_sales_perf_idx  on public.ticket_sales (performance);

alter table public.ticket_sales enable row level security;

drop policy if exists "read_all" on public.ticket_sales;
create policy "read_all" on public.ticket_sales for select using (true);

drop policy if exists "insert_all" on public.ticket_sales;
create policy "insert_all" on public.ticket_sales for insert with check (
  qty between 1 and 200
  and char_length(actor_name) between 1 and 80
  and char_length(buyer_name) between 1 and 120
);

do $$ begin
  alter publication supabase_realtime add table public.ticket_sales;
exception when duplicate_object then null;
end $$;


-- ---------- מצב הקאסט (singleton, נקרא ע"י כולם, נכתב רק דרך RPC עם סיסמה) ----------
create table if not exists public.cast_state (
  id            int primary key default 1 check (id = 1),
  performances  jsonb not null default '[]'::jsonb,
  roles         jsonb not null default '[]'::jsonb,
  updated_at    timestamptz not null default now()
);

insert into public.cast_state (id, performances, roles)
values (1, '[]'::jsonb, '[]'::jsonb)
on conflict (id) do nothing;

alter table public.cast_state enable row level security;

drop policy if exists "cast_read_all" on public.cast_state;
create policy "cast_read_all" on public.cast_state for select using (true);
-- אין policy ל-insert/update/delete => כתיבה ישירה חסומה

-- פונקציית עדכון מאובטחת (משתמשת בסיסמה שמורה בתוך הפונקציה)
-- !!! החליפי את 'CHANGE_ME_ADMIN_SECRET' בסיסמה חזקה משלך לפני הריצה !!!
create or replace function public.update_cast(
  p_secret       text,
  p_performances jsonb,
  p_roles        jsonb
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin_secret constant text := 'CHANGE_ME_ADMIN_SECRET';
begin
  if p_secret is null or p_secret <> v_admin_secret then
    raise exception 'unauthorized';
  end if;
  if jsonb_typeof(p_performances) <> 'array' or jsonb_typeof(p_roles) <> 'array' then
    raise exception 'invalid payload';
  end if;
  update public.cast_state
     set performances = p_performances,
         roles        = p_roles,
         updated_at   = now()
   where id = 1;
end;
$$;

revoke all on function public.update_cast(text, jsonb, jsonb) from public;
grant execute on function public.update_cast(text, jsonb, jsonb) to anon, authenticated;

do $$ begin
  alter publication supabase_realtime add table public.cast_state;
exception when duplicate_object then null;
end $$;
