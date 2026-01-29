-- Enable RLS for user_candidates and synthesis_reports
alter table user_candidates enable row level security;
alter table synthesis_reports enable row level security;

-- Allow anon insert/select for user_candidates
create policy "Allow anon insert user_candidates"
on user_candidates
for insert
with check (true);

create policy "Allow anon select user_candidates"
on user_candidates
for select
using (true);

create policy "Allow anon delete user_candidates"
on user_candidates
for delete
using (true);

-- Allow anon insert/select for synthesis_reports
create policy "Allow anon insert synthesis_reports"
on synthesis_reports
for insert
with check (true);

create policy "Allow anon select synthesis_reports"
on synthesis_reports
for select
using (true);
