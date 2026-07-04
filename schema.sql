-- Zen Money (formerly Runway) Supabase Schema

-- Users handled by Supabase Auth automatically (auth.users)

create table categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  name text not null,
  color text not null,
  icon text,
  created_at timestamptz default now()
);

create table expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  category_id uuid references categories,
  name text not null,
  amount numeric not null,
  date date not null,
  note text,
  is_recurring boolean default false,
  recurrence_interval text, -- 'daily' | 'weekly' | 'monthly'
  created_at timestamptz default now()
);

create table income (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  source text not null,
  amount numeric not null,
  date date not null,
  is_recurring boolean default false,
  recurrence_interval text,
  created_at timestamptz default now()
);

create table user_settings (
  user_id uuid references auth.users primary key,
  currency text default 'BDT',
  budget_period_end date,
  balance_mode text default 'auto', -- 'auto' | 'manual'
  manual_balance numeric,
  theme text default 'dark',
  notifications_enabled boolean default false
);

-- Enable Row Level Security (RLS) on all tables
alter table categories enable row level security;
alter table expenses enable row level security;
alter table income enable row level security;
alter table user_settings enable row level security;

-- Create policies so users can only manage their own data
create policy "Users can view their own categories" on categories for select using (auth.uid() = user_id);
create policy "Users can insert their own categories" on categories for insert with check (auth.uid() = user_id);
create policy "Users can update their own categories" on categories for update using (auth.uid() = user_id);
create policy "Users can delete their own categories" on categories for delete using (auth.uid() = user_id);

create policy "Users can view their own expenses" on expenses for select using (auth.uid() = user_id);
create policy "Users can insert their own expenses" on expenses for insert with check (auth.uid() = user_id);
create policy "Users can update their own expenses" on expenses for update using (auth.uid() = user_id);
create policy "Users can delete their own expenses" on expenses for delete using (auth.uid() = user_id);

create policy "Users can view their own income" on income for select using (auth.uid() = user_id);
create policy "Users can insert their own income" on income for insert with check (auth.uid() = user_id);
create policy "Users can update their own income" on income for update using (auth.uid() = user_id);
create policy "Users can delete their own income" on income for delete using (auth.uid() = user_id);

create policy "Users can view their own settings" on user_settings for select using (auth.uid() = user_id);
create policy "Users can insert their own settings" on user_settings for insert with check (auth.uid() = user_id);
create policy "Users can update their own settings" on user_settings for update using (auth.uid() = user_id);
create policy "Users can delete their own settings" on user_settings for delete using (auth.uid() = user_id);
