-- Create Profiles table for User Roles and Limits
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  role text default 'user' check (role in ('user', 'admin')),
  synthesis_count int default 0,
  synthesis_limit int default 10, -- Daily limit for free tier
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for Profiles
alter table profiles enable row level security;

create policy "Public profiles are viewable by everyone" on profiles
  for select using (true);

create policy "Users can update own profile" on profiles
  for update using (auth.uid() = id);

-- Trigger to create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, role, synthesis_count, synthesis_limit)
  values (new.id, new.email, 'user', 0, 10);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Crawler Logs for Admin Auditing
create table crawler_logs (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id),
    action text,
    details jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table crawler_logs enable row level security;

-- Only Admin can view logs
create policy "Admins can view crawler logs" on crawler_logs
  for select using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- Only Admin can insert logs (or service role)
create policy "Admins can insert crawler logs" on crawler_logs
  for insert with check (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- RPC for incrementing count safely (called by backend)
create or replace function increment_synthesis_count(user_id uuid)
returns void as $$
begin
  update profiles
  set synthesis_count = synthesis_count + 1
  where id = user_id;
end;
$$ language plpgsql security definer;
