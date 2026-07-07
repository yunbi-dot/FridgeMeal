-- FridgeMeal 초기 스키마
-- 02_db_schema.md 기준. PRD에 없는 컬럼(카테고리 상세, 유통기한, 이미지 등)은 추가하지 않는다.

create extension if not exists pg_trgm;

-- ---------------------------------------------------------------------------
-- users
-- ---------------------------------------------------------------------------
create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- auth.users에 새 계정(익명 로그인 포함)이 생성되면 public.users에도 동일 id로 행을 만든다.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, created_at)
  values (new.id, new.created_at)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------------
-- ingredients_catalog (재료 선택 화면: 검색/카테고리/인기 재료)
-- ---------------------------------------------------------------------------
create table public.ingredients_catalog (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  category text not null,
  is_popular boolean not null default false
);

create index idx_ingredients_catalog_category on public.ingredients_catalog (category);
create index idx_ingredients_catalog_is_popular on public.ingredients_catalog (is_popular) where is_popular = true;
create index idx_ingredients_catalog_name on public.ingredients_catalog using gin (name gin_trgm_ops);

-- ---------------------------------------------------------------------------
-- fridge (냉장고 재료)
-- ---------------------------------------------------------------------------
create table public.fridge (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  name text not null check (name <> ''),
  quantity text,
  updated_at timestamptz not null default now(),
  unique (user_id, name)
);

create index idx_fridge_user_id on public.fridge (user_id);

create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger fridge_set_updated_at
  before update on public.fridge
  for each row execute procedure public.set_updated_at();

-- ---------------------------------------------------------------------------
-- recipes (레시피)
-- ---------------------------------------------------------------------------
create table public.recipes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  cooking_time int not null,
  description text
);

-- ---------------------------------------------------------------------------
-- recipe_ingredients (레시피-재료 매핑)
-- ---------------------------------------------------------------------------
create table public.recipe_ingredients (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes (id) on delete cascade,
  ingredient_name text not null,
  is_required boolean not null default true
);

create index idx_recipe_ingredients_recipe_id on public.recipe_ingredients (recipe_id);
create index idx_recipe_ingredients_ingredient_name on public.recipe_ingredients (ingredient_name);

-- ---------------------------------------------------------------------------
-- ingredient_synonyms (유사 재료 매핑, PRD 4장 재추천 조건 완화용)
-- ---------------------------------------------------------------------------
create table public.ingredient_synonyms (
  id uuid primary key default gen_random_uuid(),
  ingredient_name text not null,
  synonym_name text not null
);

create index idx_ingredient_synonyms_ingredient_name on public.ingredient_synonyms (ingredient_name);
create index idx_ingredient_synonyms_synonym_name on public.ingredient_synonyms (synonym_name);

-- ---------------------------------------------------------------------------
-- cooking_history (요리 기록)
-- ---------------------------------------------------------------------------
create table public.cooking_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  recipe_id uuid not null references public.recipes (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index idx_cooking_history_user_id on public.cooking_history (user_id);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.fridge enable row level security;

create policy fridge_select_own on public.fridge
  for select using (auth.uid() = user_id);

create policy fridge_insert_own on public.fridge
  for insert with check (auth.uid() = user_id);

create policy fridge_update_own on public.fridge
  for update using (auth.uid() = user_id);

create policy fridge_delete_own on public.fridge
  for delete using (auth.uid() = user_id);

alter table public.cooking_history enable row level security;

create policy history_select_own on public.cooking_history
  for select using (auth.uid() = user_id);

create policy history_insert_own on public.cooking_history
  for insert with check (auth.uid() = user_id);

alter table public.recipes enable row level security;
create policy recipes_public_read on public.recipes for select using (true);

alter table public.recipe_ingredients enable row level security;
create policy recipe_ingredients_public_read on public.recipe_ingredients for select using (true);

alter table public.ingredients_catalog enable row level security;
create policy ingredients_catalog_public_read on public.ingredients_catalog for select using (true);

alter table public.ingredient_synonyms enable row level security;
create policy ingredient_synonyms_public_read on public.ingredient_synonyms for select using (true);

alter table public.users enable row level security;

create policy users_select_own on public.users
  for select using (auth.uid() = id);
