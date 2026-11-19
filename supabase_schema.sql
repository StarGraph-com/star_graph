-- ==============================================================================
-- Stargraph Supabase PostgreSQL Schema & Security Policies (RLS)
-- Run this in your Supabase Project -> SQL Editor
-- ==============================================================================

-- 1. PROFILES TABLE
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  avatar_color text default '#6366F1',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. PROJECTS TABLE
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. PROJECT MEMBERS TABLE
create table if not exists public.project_members (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'editor', 'commenter', 'viewer')),
  created_at timestamptz default now(),
  unique(project_id, user_id)
);

-- 4. NODES (FILE TREE) TABLE
create table if not exists public.nodes (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  parent_id uuid references public.nodes(id) on delete cascade,
  type text not null check (type in ('folder', 'diagram')),
  diagram_type text check (diagram_type in ('flowchart', 'uml_class', 'uml_usecase', 'uml_sequence', 'erd', 'architecture', 'general', 'blank')),
  name text not null,
  sort_order integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 5. DIAGRAM CONTENT TABLE
create table if not exists public.diagram_content (
  node_id uuid primary key references public.nodes(id) on delete cascade,
  content jsonb not null default '{"shapes":[], "connectors":[], "viewport":{"panX":50,"panY":50,"zoom":1}, "settings":{"showGrid":true,"snapToGrid":true,"gridSize":20,"backgroundColor":"#F8FAFC"}}'::jsonb,
  version integer not null default 1,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz default now()
);

-- 6. SHARE LINKS TABLE
create table if not exists public.share_links (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  node_id uuid references public.nodes(id) on delete cascade,
  token text unique not null,
  access text not null check (access in ('restricted', 'anyone')),
  permission text not null check (permission in ('view', 'comment', 'edit')),
  created_at timestamptz default now()
);

-- 7. COMMENTS TABLE
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  node_id uuid not null references public.nodes(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  parent_comment_id uuid references public.comments(id) on delete cascade,
  x double precision not null,
  y double precision not null,
  body text not null,
  resolved boolean default false,
  created_at timestamptz default now()
);

-- 8. DIAGRAM VERSIONS TABLE
create table if not exists public.diagram_versions (
  id uuid primary key default gen_random_uuid(),
  node_id uuid not null references public.nodes(id) on delete cascade,
  content jsonb not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now(),
  label text
);

-- ==============================================================================
-- INDEXES FOR PERFORMANCE
-- ==============================================================================
create index if not exists idx_projects_owner on public.projects(owner_id);
create index if not exists idx_project_members_proj on public.project_members(project_id);
create index if not exists idx_project_members_user on public.project_members(user_id);
create index if not exists idx_nodes_proj_parent on public.nodes(project_id, parent_id);
create index if not exists idx_comments_node on public.comments(node_id);
create index if not exists idx_diagram_versions_node on public.diagram_versions(node_id);
create index if not exists idx_share_links_token on public.share_links(token);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) HELPER FUNCTIONS
-- ==============================================================================
create or replace function public.user_can_read_project(p_id uuid)
returns boolean as $$
begin
  return exists (
    select 1 from public.projects where id = p_id and owner_id = auth.uid()
  ) or exists (
    select 1 from public.project_members where project_id = p_id and user_id = auth.uid()
  );
end;
$$ language plpgsql security definer;

create or replace function public.user_can_write_project(p_id uuid)
returns boolean as $$
begin
  return exists (
    select 1 from public.projects where id = p_id and owner_id = auth.uid()
  ) or exists (
    select 1 from public.project_members
    where project_id = p_id
      and user_id = auth.uid()
      and role in ('owner', 'editor')
  );
end;
$$ language plpgsql security definer;

-- ==============================================================================
-- ENABLE RLS ON ALL TABLES
-- ==============================================================================
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.nodes enable row level security;
alter table public.diagram_content enable row level security;
alter table public.share_links enable row level security;
alter table public.comments enable row level security;
alter table public.diagram_versions enable row level security;

-- ==============================================================================
-- RLS POLICIES
-- ==============================================================================

-- Profiles: Authenticated users can read member profiles; users can update own profile
create policy "Profiles are viewable by authenticated users"
  on public.profiles for select
  to authenticated
  using (true);

create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (id = auth.uid());

create policy "Users can insert own profile"
  on public.profiles for insert
  to authenticated
  with check (id = auth.uid());

-- Projects
create policy "Users can view projects they own or belong to"
  on public.projects for select
  to authenticated
  using (owner_id = auth.uid() or public.user_can_read_project(id));

create policy "Users can create projects"
  on public.projects for insert
  to authenticated
  with check (owner_id = auth.uid());

create policy "Editors and owners can update projects"
  on public.projects for update
  to authenticated
  using (public.user_can_write_project(id));

create policy "Only owners can delete projects"
  on public.projects for delete
  to authenticated
  using (owner_id = auth.uid());

-- Project Members
create policy "Members viewable by project participants"
  on public.project_members for select
  to authenticated
  using (public.user_can_read_project(project_id));

create policy "Owners can manage members"
  on public.project_members for all
  to authenticated
  using (exists (select 1 from public.projects where id = project_id and owner_id = auth.uid()));

-- Nodes
create policy "Nodes viewable by project participants"
  on public.nodes for select
  to authenticated
  using (public.user_can_read_project(project_id));

create policy "Editors can insert nodes"
  on public.nodes for insert
  to authenticated
  with check (public.user_can_write_project(project_id));

create policy "Editors can update nodes"
  on public.nodes for update
  to authenticated
  using (public.user_can_write_project(project_id));

create policy "Editors can delete nodes"
  on public.nodes for delete
  to authenticated
  using (public.user_can_write_project(project_id));

-- Diagram Content
create policy "Diagram content viewable by project participants"
  on public.diagram_content for select
  to authenticated
  using (exists (select 1 from public.nodes where id = diagram_content.node_id and public.user_can_read_project(nodes.project_id)));

create policy "Editors can insert diagram content"
  on public.diagram_content for insert
  to authenticated
  with check (exists (select 1 from public.nodes where id = diagram_content.node_id and public.user_can_write_project(nodes.project_id)));

create policy "Editors can update diagram content"
  on public.diagram_content for update
  to authenticated
  using (exists (select 1 from public.nodes where id = diagram_content.node_id and public.user_can_write_project(nodes.project_id)));

create policy "Editors can delete diagram content"
  on public.diagram_content for delete
  to authenticated
  using (exists (select 1 from public.nodes where id = diagram_content.node_id and public.user_can_write_project(nodes.project_id)));

-- Share Links
create policy "Share links readable by anyone with token or by project members"
  on public.share_links for select
  using (true);

create policy "Project editors can create share links"
  on public.share_links for insert
  to authenticated
  with check (public.user_can_write_project(project_id));

create policy "Project editors can update share links"
  on public.share_links for update
  to authenticated
  using (public.user_can_write_project(project_id));

-- Comments
create policy "Comments readable by project participants"
  on public.comments for select
  to authenticated
  using (exists (select 1 from public.nodes where id = comments.node_id and public.user_can_read_project(nodes.project_id)));

create policy "Participants can insert comments"
  on public.comments for insert
  to authenticated
  with check (exists (select 1 from public.nodes where id = comments.node_id and public.user_can_read_project(nodes.project_id)));

create policy "Author or editor can update comments"
  on public.comments for update
  to authenticated
  using (author_id = auth.uid() or exists (select 1 from public.nodes where id = comments.node_id and public.user_can_write_project(nodes.project_id)));

-- Diagram Versions
create policy "Versions readable by project participants"
  on public.diagram_versions for select
  to authenticated
  using (exists (select 1 from public.nodes where id = diagram_versions.node_id and public.user_can_read_project(nodes.project_id)));

create policy "Editors can insert diagram versions"
  on public.diagram_versions for insert
  to authenticated
  with check (exists (select 1 from public.nodes where id = diagram_versions.node_id and public.user_can_write_project(nodes.project_id)));

-- ==============================================================================
-- AUTOMATIC TRIGGERS
-- ==============================================================================

-- 1. Create Profile row on new auth signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name, avatar_color)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    '#6366F1'
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2. Automatically register owner as project member
create or replace function public.handle_new_project()
returns trigger as $$
begin
  insert into public.project_members (project_id, user_id, role)
  values (new.id, new.owner_id, 'owner')
  on conflict (project_id, user_id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_project_created on public.projects;
create trigger on_project_created
  after insert on public.projects
  for each row execute function public.handle_new_project();
