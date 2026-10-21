# Supabase Setup for CBT Portal & Payments

## Tables to Create

### Branch Comparison Payments
```sql
create table if not exists public.branch_compare_payments (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  razorpay_payment_id text,
  razorpay_order_id text,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

-- Note: Adjust RLS policies depending on your usage. For example:
alter table public.branch_compare_payments enable row level security;

create policy "allow public insert for branch payments"
on public.branch_compare_payments
for insert
to public
with check (true);

create policy "allow public read for branch payments"
on public.branch_compare_payments
for select
to public
using (true);
```

### 1. portal_users table (already created)
```sql
create table if not exists public.portal_users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  submitted_at timestamptz not null default now()
);

alter table public.portal_users enable row level security;

create policy "allow anon insert"
on public.portal_users
for insert
to anon
with check (true);

create policy "allow anon update"
on public.portal_users
for update
to anon
using (true)
with check (true);

create policy "allow anon select"
on public.portal_users
for select
to anon
using (true);
```

### 2. test_results table (NEW - run this in Supabase SQL editor)
```sql
-- Create test_results table
create table if not exists public.test_results (
  id bigserial primary key,
  user_email text not null,
  test_id text not null,
  test_title text not null,
  total_marks numeric not null default 0,
  total_questions integer not null default 0,
  correct_answers integer not null default 0,
  incorrect_answers integer not null default 0,
  unattempted integer not null default 0,
  percentage numeric not null default 0,
  total_test_duration integer not null default 0,
  section_wise_results jsonb,
  fullscreen_exit_count integer not null default 0,
  question_details jsonb,
  completed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- Create index for faster queries
create index if not exists idx_test_results_user_email 
on public.test_results(user_email);

create index if not exists idx_test_results_completed_at 
on public.test_results(completed_at desc);

-- Enable RLS
alter table public.test_results enable row level security;

-- Allow anon to insert test results
create policy "allow anon insert test results"
on public.test_results
for insert
to anon
with check (true);

-- Allow anon to select their own test results
create policy "allow anon select test results"
on public.test_results
for select
to anon
using (true);

-- Allow anon to update test results (optional)
create policy "allow anon update test results"
on public.test_results
for update
to anon
using (true)
with check (true);

-- Allow anon to delete test results (optional)
create policy "allow anon delete test results"
on public.test_results
for delete
to anon
using (true);
```

### 3. question_reports table (NEW — run this in Supabase SQL editor)
```sql
-- Create question_reports table
create table if not exists public.question_reports (
  id bigserial primary key,
  test_id text not null,
  test_title text,
  question_id text not null,
  question_number integer,
  subject text,
  reason text not null,
  description text,
  user_email text,
  reported_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- Index for admin queries
create index if not exists idx_question_reports_test_id
on public.question_reports(test_id);

create index if not exists idx_question_reports_reported_at
on public.question_reports(reported_at desc);

-- Enable RLS
alter table public.question_reports enable row level security;

-- Allow anyone to insert a report
create policy "allow anon insert question reports"
on public.question_reports
for insert
to anon
with check (true);

-- Allow anyone to read reports (restrict to service_role in production if desired)
create policy "allow anon select question reports"
on public.question_reports
for select
to anon
using (true);
```

## Implementation Summary

1. **User Profile Flow:**
   - ProfileSetup saves directly to Supabase `portal_users` table
   - No localStorage for user profile (Supabase is single source of truth)
   - Components fetch user profile from Supabase using email

2. **Test Results Flow:**
   - TestInterface saves results to Supabase `test_results` table
   - CBTDashboard fetches results from Supabase
   - No backend API calls needed
   - No localStorage for test results

3. **Benefits:**
   - Single source of truth (Supabase)
   - Data persists across devices
   - No backend server required for CBT portal
   - Easy to query and analyze test data

## 4. resource_events table (NEW - run this in Supabase SQL editor)

This table tracks click/view/download events for the resources portal.

```sql
-- Create resource_events table to track clicks and opens
create table if not exists public.resource_events (
  id bigserial primary key,
  resource_id text not null,
  resource_title text not null,
  action_type text not null, -- 'view' or 'download'
  subject text,
  type text,
  user_email text, -- Optional
  created_at timestamptz not null default now()
);

alter table public.resource_events enable row level security;

-- Allow anyone to insert events
create policy "allow anon insert resource_events"
on public.resource_events
for insert
to anon
with check (true);

-- Allow anyone to select
create policy "allow anon select resource_events"
on public.resource_events
for select
to anon
using (true);

-- Create a view to easily get the counts
create or replace view public.resource_analytics as
select 
  resource_id,
  min(resource_title) as resource_title,
  count(case when action_type = 'view' then 1 end) as views,
  count(case when action_type = 'download' then 1 end) as downloads,
  max(created_at) as last_activity
from public.resource_events
group by resource_id;
```

## Next Steps After Running SQL

1. Restart React dev server
2. Set up new user profile (will save to Supabase)
3. Take a test (results will save to Supabase)
4. Check dashboard (will fetch from Supabase)
