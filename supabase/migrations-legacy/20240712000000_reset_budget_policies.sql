-- Clean up any remaining references to account_id from budgets schema

-- Drop all existing policies on budgets and budget_items
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename IN ('budgets', 'budget_items')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
  END LOOP;
END $$;

-- Recreate budgets policy without account_id
CREATE POLICY "Budgets are accessible by owner" ON budgets
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Recreate budget_items policy without account_id
CREATE POLICY "Budget items are accessible by owner" ON budget_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM budgets b
      WHERE b.id = budget_items.budget_id
        AND b.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM budgets b
      WHERE b.id = budget_items.budget_id
        AND b.user_id = auth.uid()
    )
  );

-- Drop triggers whose functions still reference account_id
DO $$
DECLARE trig record;
BEGIN
  FOR trig IN
    SELECT t.tgname, c.relname
    FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    WHERE c.relname IN ('budgets', 'budget_items')
      AND pg_get_functiondef(t.tgfoid) ILIKE '%account_id%'
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I', trig.tgname, trig.relname);
  END LOOP;
END $$;

-- Ensure updated_at triggers exist
DROP TRIGGER IF EXISTS update_budgets_updated_at ON budgets;
CREATE TRIGGER update_budgets_updated_at
  BEFORE UPDATE ON budgets
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_budget_items_updated_at ON budget_items;
CREATE TRIGGER update_budget_items_updated_at
  BEFORE UPDATE ON budget_items
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
