-- Create profiles automatically when a user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- Trigger to create profile on auth.users insert
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Update updated_at timestamp
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Triggers for updated_at
create trigger update_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.update_updated_at_column();

create trigger update_downloads_updated_at
  before update on public.downloads
  for each row execute procedure public.update_updated_at_column();

create trigger update_subscriptions_updated_at
  before update on public.subscriptions
  for each row execute procedure public.update_subscriptions_updated_at_column();

-- Helper function to check if user is premium
create or replace function public.is_user_premium(user_id uuid)
returns boolean as $$
declare
  premium_status boolean;
begin
  select is_premium into premium_status
  from public.profiles
  where id = user_id
  and (premium_expires is null or premium_expires > now());
  
  return coalesce(premium_status, false);
end;
$$ language plpgsql;

-- Helper function to increment daily downloads
create or replace function public.increment_daily_downloads(user_id uuid)
returns integer as $$
declare
  download_count integer;
begin
  update public.profiles
  set downloads_today = case
    when last_download_reset = current_date then downloads_today + 1
    else 1
  end,
  last_download_reset = current_date
  where id = user_id
  returning downloads_today into download_count;
  
  return coalesce(download_count, 1);
end;
$$ language plpgsql;
