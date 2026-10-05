-- Ensure no leftover references to account_id remain on budgets
-- after removing the column and making budgets account-agnostic.

-- Recreate budgets policy without account_id references
drop policy if exists "Budgets are accessible by owner" on budgets;
create policy "Budgets are accessible by owner" on budgets
  for all using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Recreate budget_items policy to depend only on user ownership
 drop policy if exists "Budget items are accessible by owner" on budget_items;
create policy "Budget items are accessible by owner" on budget_items
  for all using (
    exists (
      select 1 from budgets b
      where b.id = budget_items.budget_id
        and b.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from budgets b
      where b.id = budget_items.budget_id
        and b.user_id = auth.uid()
    )
  );

-- Drop any legacy triggers that might still reference account_id
DO $$
DECLARE r record;
BEGIN
  FOR r IN (
    SELECT tgname
    FROM pg_trigger
    WHERE tgrelid = 'budgets'::regclass
      AND tgname ILIKE '%account_id%'
  ) LOOP
    EXECUTE 'DROP TRIGGER IF EXISTS ' || quote_ident(r.tgname) || ' ON budgets';
  END LOOP;
END $$ LANGUAGE plpgsql;

-- Ensure updated_at trigger exists
DROP TRIGGER IF EXISTS update_budgets_updated_at ON budgets;
CREATE TRIGGER update_budgets_updated_at
  BEFORE UPDATE ON budgets
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
