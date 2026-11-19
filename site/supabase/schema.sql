create table if not exists public.journal_posts (
  slug text primary key check (slug in ('inauguracao-do-blog', 'argila-do-oriente')),
  view_count bigint not null default 0 check (view_count >= 0)
);

insert into public.journal_posts (slug)
values ('inauguracao-do-blog'), ('argila-do-oriente')
on conflict (slug) do nothing;

create table if not exists public.journal_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(btrim(display_name)) between 1 and 80),
  created_at timestamptz not null default now()
);

create table if not exists public.journal_comments (
  id uuid primary key default gen_random_uuid(),
  post_slug text not null references public.journal_posts (slug) on delete cascade,
  author_id uuid not null references public.journal_profiles (user_id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index if not exists journal_comments_post_created_idx
  on public.journal_comments (post_slug, created_at desc);

create table if not exists public.discount_coupons (
  code text primary key check (code = upper(code)),
  discount_percent integer not null check (discount_percent between 1 and 100),
  active boolean not null default true,
  valid_from timestamptz not null default now(),
  valid_until timestamptz,
  min_subtotal numeric(12, 2) not null default 0 check (min_subtotal >= 0)
);

grant usage on schema public to anon, authenticated;

insert into public.discount_coupons (code, discount_percent, active, min_subtotal)
values ('MORCEGANDO5', 5, true, 0)
on conflict (code) do update
set discount_percent = excluded.discount_percent,
    active = excluded.active,
    min_subtotal = excluded.min_subtotal;

alter table public.journal_posts enable row level security;
alter table public.journal_profiles enable row level security;
alter table public.journal_comments enable row level security;
alter table public.discount_coupons enable row level security;

drop policy if exists "Journal posts are public" on public.journal_posts;
create policy "Journal posts are public"
  on public.journal_posts for select
  to anon, authenticated
  using (true);

drop policy if exists "Journal profiles are public" on public.journal_profiles;
create policy "Journal profiles are public"
  on public.journal_profiles for select
  to anon, authenticated
  using (true);

drop policy if exists "Users can update their own journal profile" on public.journal_profiles;
create policy "Users can update their own journal profile"
  on public.journal_profiles for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "Journal comments are public" on public.journal_comments;
create policy "Journal comments are public"
  on public.journal_comments for select
  to anon, authenticated
  using (true);

drop policy if exists "Authenticated users can comment as themselves" on public.journal_comments;
create policy "Authenticated users can comment as themselves"
  on public.journal_comments for insert
  to authenticated
  with check (author_id = (select auth.uid()));

drop policy if exists "Users can delete their own comments" on public.journal_comments;
create policy "Users can delete their own comments"
  on public.journal_comments for delete
  to authenticated
  using (author_id = (select auth.uid()));

revoke all on public.journal_posts from anon, authenticated;
grant select on public.journal_posts to anon, authenticated;
revoke all on public.journal_profiles from anon, authenticated;
grant select on public.journal_profiles to anon, authenticated;
grant update (display_name) on public.journal_profiles to authenticated;
revoke all on public.journal_comments from anon, authenticated;
grant select on public.journal_comments to anon, authenticated;
grant insert, delete on public.journal_comments to authenticated;
revoke all on public.discount_coupons from anon, authenticated;

create or replace function public.handle_new_journal_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.journal_profiles (user_id, display_name)
  values (
    new.id,
    left(coalesce(
      nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''),
      nullif(btrim(new.raw_user_meta_data ->> 'name'), ''),
      'Leitor'
    ), 80)
  )
  on conflict (user_id) do update
    set display_name = excluded.display_name;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_journal_profile on auth.users;
create trigger on_auth_user_created_journal_profile
  after insert on auth.users
  for each row execute function public.handle_new_journal_user();

insert into public.journal_profiles (user_id, display_name)
select
  users.id,
  left(coalesce(
    nullif(btrim(users.raw_user_meta_data ->> 'full_name'), ''),
    nullif(btrim(users.raw_user_meta_data ->> 'name'), ''),
    'Leitor'
  ), 80)
from auth.users as users
on conflict (user_id) do nothing;

create or replace function public.increment_journal_view_count(p_slug text)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  updated_count bigint;
begin
  update public.journal_posts
    set view_count = view_count + 1
    where slug = p_slug
    returning view_count into updated_count;

  if updated_count is null then
    raise exception 'Unknown journal post.';
  end if;

  return updated_count;
end;
$$;

create or replace function public.validate_discount_coupon(
  p_code text,
  p_subtotal numeric
)
returns table (
  code text,
  discount_percent integer,
  discount_amount numeric
)
language sql
security definer
set search_path = ''
as $$
  select coupon.code,
         coupon.discount_percent,
         round(p_subtotal * coupon.discount_percent / 100, 2)
    from public.discount_coupons as coupon
   where coupon.code = upper(btrim(p_code))
     and coupon.active
     and coupon.valid_from <= now()
     and (coupon.valid_until is null or coupon.valid_until > now())
     and p_subtotal >= coupon.min_subtotal
     and p_subtotal >= 0
     and p_subtotal <= 1000000000;
$$;

revoke all on function public.handle_new_journal_user() from public, anon, authenticated;
revoke all on function public.increment_journal_view_count(text) from public;
grant execute on function public.increment_journal_view_count(text) to anon, authenticated;
revoke all on function public.validate_discount_coupon(text, numeric) from public;
grant execute on function public.validate_discount_coupon(text, numeric) to anon, authenticated;
