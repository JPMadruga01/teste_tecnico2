alter table public.lesson_plans enable row level security;

create policy "Select own plans"
  on public.lesson_plans
  for select
  using (auth.uid() = user_id or user_id is null);

create policy "Insert as self"
  on public.lesson_plans
  for insert
  with check (auth.uid() = user_id or user_id is null);

create policy "Update own plans"
  on public.lesson_plans
  for update
  using (auth.uid() = user_id);

create policy "Delete own plans"
  on public.lesson_plans
  for delete
  using (auth.uid() = user_id);
