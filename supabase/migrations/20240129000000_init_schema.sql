-- Enable pgvector extension
create extension if not exists vector;

-- Create Enum for Atom Type
create type atom_type as enum ('Motivation', 'Idea', 'Method');

-- Create papers table
create table papers (
  id uuid primary key default gen_random_uuid(),
  arxiv_id text unique not null,
  title text,
  pdf_url text,
  raw_text_summary text,
  is_processed boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create research_atoms table
create table research_atoms (
  id uuid primary key default gen_random_uuid(),
  paper_id uuid references papers(id) on delete cascade,
  type atom_type not null,
  content_en text,
  content_cn text,
  embedding vector(1536), -- Assuming OpenAI embeddings
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create user_candidates table
create table user_candidates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null, -- Assuming auth.users match or external ID
  atom_id uuid references research_atoms(id) on delete cascade,
  added_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, atom_id)
);

-- Create synthesis_reports table
create table synthesis_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  input_atoms jsonb,
  result_markdown text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS Policies (Basic setup)
alter table papers enable row level security;
alter table research_atoms enable row level security;
alter table user_candidates enable row level security;
alter table synthesis_reports enable row level security;

-- Admin can see all papers (simplified: everyone can read for now or service role only)
create policy "Public papers are viewable by everyone" on papers for select using (true);

-- Research atoms are public
create policy "Research atoms are viewable by everyone" on research_atoms for select using (true);

-- User candidates are private to user
create policy "Users can see their own candidates" on user_candidates for select using (auth.uid() = user_id);
create policy "Users can insert their own candidates" on user_candidates for insert with check (auth.uid() = user_id);
create policy "Users can delete their own candidates" on user_candidates for delete using (auth.uid() = user_id);

-- Synthesis reports are private to user
create policy "Users can see their own reports" on synthesis_reports for select using (auth.uid() = user_id);
create policy "Users can insert their own reports" on synthesis_reports for insert with check (auth.uid() = user_id);
