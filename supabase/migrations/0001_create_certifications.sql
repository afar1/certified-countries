create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

create table if not exists sensor_types (
    id uuid primary key default gen_random_uuid(),
    name text not null unique,
    slug text not null unique,
    description text,
    created_at timestamptz not null default now()
);

create table if not exists countries (
    id uuid primary key default gen_random_uuid(),
    name text not null unique,
    display_name text not null,
    iso2 char(2) unique,
    iso3 char(3) unique,
    created_at timestamptz not null default now()
);

create table if not exists certification_records (
    id uuid primary key default gen_random_uuid(),
    sensor_type_id uuid not null references sensor_types(id) on delete cascade,
    country_id uuid not null references countries(id) on delete cascade,
    certification_scheme text,
    status text not null default 'certified' check (status in ('certified', 'in_progress', 'not_certified')),
    duration_weeks_min smallint,
    duration_weeks_max smallint,
    notes text,
    created_at timestamptz not null default now(),
    unique(sensor_type_id, country_id)
);

alter table certification_records enable row level security;

create policy if not exists "certifications are viewable" on certification_records
for select
using (true);
