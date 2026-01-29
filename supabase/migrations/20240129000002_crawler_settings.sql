create table crawler_settings (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  value jsonb not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Insert default settings
insert into crawler_settings (key, value) values 
('daily_crawl', '{"enabled": true, "query": "cat:cs.AI", "max_results": 5}');

-- RLS
alter table crawler_settings enable row level security;

create policy "Allow anon select crawler_settings"
on crawler_settings for select using (true);

create policy "Allow anon update crawler_settings"
on crawler_settings for update using (true);

create policy "Allow anon insert crawler_settings"
on crawler_settings for insert with check (true);
