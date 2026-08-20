-- Organizations profile table
-- id references the auth.users row created by Supabase Auth on signup
create table public.organizations (
    id uuid primary key references auth.users (id) on delete cascade,
    email text not null,
    name text,
    authority_type text,
    description text,
    phone text,
    address text,
    website text,
    verified boolean not null default false,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- RLS: orgs can only access their own row
alter table public.organizations enable row level security;

create policy "org_select_own" on public.organizations for
select to authenticated using (
        (
            select auth.uid ()
        ) = id
    );

create policy "org_insert_own" on public.organizations for
insert
    to authenticated
with
    check (
        (
            select auth.uid ()
        ) = id
    );

create policy "org_update_own" on public.organizations for
update to authenticated using (
    (
        select auth.uid ()
    ) = id
)
with
    check (
        (
            select auth.uid ()
        ) = id
    );

create policy "org_delete_own" on public.organizations for delete to authenticated using (
    (
        select auth.uid ()
    ) = id
);

-- Reports table (public read, public insert — no auth required)
create table public.reports (
    id              uuid primary key default gen_random_uuid(),
    title           text not null,
    description     text not null,
    category        text,
    severity        text,
    status          text not null default 'pending',
    authority       uuid references public.organizations(id) on delete set null,
    latitude        double precision,
    longitude       double precision,
    media_urls      text[],
    contact_email   text,
    contact_phone   text,
    comments        text,
    submitted_at    timestamptz not null default now(),
    updated_at      timestamptz not null default now()
);

-- RLS: public read + public insert (citizens report anonymously)
alter table public.reports enable row level security;

create policy "reports_public_select" on public.reports for
select to anon, authenticated using (true);

create policy "reports_public_insert" on public.reports for
insert
    to anon,
    authenticated
with
    check (true);