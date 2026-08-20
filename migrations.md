-- Organizations profile table
-- id references the auth.users row created by Supabase Auth on signup
create table public.organizations (
    id              uuid primary key references auth.users(id) on delete cascade,
    email           text not null,
    name            text,
    authority_type  text,
    description     text,
    phone           text,
    address         text,
    website         text,
    verified        boolean not null default false,
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now()
);

-- RLS: orgs can only access their own row
alter table public.organizations enable row level security;

create policy "org_select_own" on public.organizations
    for select to authenticated
    using ( (select auth.uid()) = id );

create policy "org_insert_own" on public.organizations
    for insert to authenticated
    with check ( (select auth.uid()) = id );

create policy "org_update_own" on public.organizations
    for update to authenticated
    using  ( (select auth.uid()) = id )
    with check ( (select auth.uid()) = id );

create policy "org_delete_own" on public.organizations
    for delete to authenticated
    using ( (select auth.uid()) = id );
