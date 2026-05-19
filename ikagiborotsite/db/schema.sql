-- ============================================
-- סכימת Supabase לתחרות הכרטיסים
-- הריצו את הקוד הזה ב-Supabase → SQL Editor
-- ניתן להריץ שוב גם אם כבר הרצתם גרסה קודמת (idempotent)
-- ============================================

create table if not exists public.ticket_sales (
  id          bigint generated always as identity primary key,
  actor_name  text not null check (char_length(actor_name) between 1 and 80),
  buyer_name  text not null check (char_length(buyer_name) between 1 and 120),
  qty         integer not null check (qty between 1 and 200),
  performance text,
  created_at  timestamptz not null default now()
);

-- אם הטבלה כבר קיימת מגרסה קודמת — מוסיף את עמודת ההצגה
alter table public.ticket_sales add column if not exists performance text;

create index if not exists ticket_sales_actor_idx on public.ticket_sales (actor_name);
create index if not exists ticket_sales_perf_idx on public.ticket_sales (performance);

-- הפעלת Row Level Security
alter table public.ticket_sales enable row level security;

-- כל אחד יכול לקרוא את הדירוג
drop policy if exists "read_all" on public.ticket_sales;
create policy "read_all" on public.ticket_sales
  for select using (true);

-- כל אחד יכול להוסיף מכירה (השחקנים מזינים בעצמם)
drop policy if exists "insert_all" on public.ticket_sales;
create policy "insert_all" on public.ticket_sales
  for insert with check (
    qty between 1 and 200
    and char_length(actor_name) between 1 and 80
    and char_length(buyer_name) between 1 and 120
  );

-- אין מדיניות UPDATE/DELETE => לא ניתן לערוך/למחוק מהאתר (רק מפאנל Supabase)

-- אפשור עדכון בזמן אמת (מתעלם משגיאה אם כבר הופעל)
do $$
begin
  alter publication supabase_realtime add table public.ticket_sales;
exception when duplicate_object then null;
end $$;
