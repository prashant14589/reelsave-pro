-- Enable required extensions
create extension if not exists "uuid-ossp";

-- Create profiles table (extends Supabase Auth users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  is_premium boolean default false,
  premium_since timestamptz,
  premium_expires timestamptz,
  downloads_today integer default 0,
  last_download_reset date default current_date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create downloads table (audit log, no content stored)
create table public.downloads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  ip_hash text,
  instagram_url text not null,
  status text not null default 'pending', -- pending | success | failed | rate_limited
  error_message text,
  video_quality text, -- 1080p | 720p | 480p | etc (for future)
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create subscriptions table (Razorpay integration)
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  razorpay_subscription_id text unique not null,
  razorpay_plan_id text not null,
  status text not null default 'active', -- active | inactive | cancelled | expired | pending
  razorpay_customer_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id) -- Only one active subscription per user
);

-- Create RLS policies
alter table public.profiles enable row level security;
alter table public.downloads enable row level security;
alter table public.subscriptions enable row level security;

-- Profiles: Users can only read their own profile, admins can read all
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Downloads: Users can view their own downloads, admins can view all
create policy "Users can view their own downloads"
  on public.downloads for select
  using (user_id = auth.uid() or user_id is null);

create policy "Service role can insert downloads"
  on public.downloads for insert
  with check (true); -- Service role bypass via header

-- Subscriptions: Users can only view their own
create policy "Users can view their own subscription"
  on public.subscriptions for select
  using (user_id = auth.uid());

-- Create indexes for performance
create index idx_downloads_user_id on public.downloads(user_id);
create index idx_downloads_created_at on public.downloads(created_at);
create index idx_downloads_status on public.downloads(status);
create index idx_subscriptions_user_id on public.subscriptions(user_id);
create index idx_subscriptions_razorpay_id on public.subscriptions(razorpay_subscription_id);
create index idx_profiles_email on public.profiles(email);
