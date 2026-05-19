-- ============================================
-- סכימת Supabase לתחרות הכרטיסים
-- הריצו את הקוד הזה ב-Supabase → SQL Editor
-- ============================================

create table if not exists public.ticket_sales (
  id          bigint generated always as identity primary key,
  actor_name  text not null check (char_length(actor_name) between 1 and 80),
  buyer_name  text not null check (char_length(buyer_name) between 1 and 120),
  qty         integer not null check (qty between 1 and 200),
  created_at  timestamptz not null default now()
);

create index if not exists ticket_sales_actor_idx on public.ticket_sales (actor_name);

-- הפעלת Row Level Security
alter table public.ticket_sales enable row level security;

-- כל אחד יכול לקרוא את הדירוג
create policy "read_all" on public.ticket_sales
  for select using (true);

-- כל אחד יכול להוסיף מכירה (השחקנים מזינים בעצמם)
create policy "insert_all" on public.ticket_sales
  for insert with check (
    qty between 1 and 200
    and char_length(actor_name) between 1 and 80
    and char_length(buyer_name) between 1 and 120
  );

-- אין מדיניות UPDATE/DELETE => לא ניתן לערוך/למחוק מהאתר (רק מפאנל Supabase)

-- אפשור עדכון בזמן אמת
alter publication supabase_realtime add table public.ticket_sales;
