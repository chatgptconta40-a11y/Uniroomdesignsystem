-- Idempotent RLS setup for the reviews table.
-- Safe to run multiple times; will not destroy existing data.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'reviews'
  ) THEN
    RAISE NOTICE 'reviews table does not exist yet — skipping RLS setup';
    RETURN;
  END IF;

  -- Enable RLS (no-op if already enabled)
  ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

  -- SELECT: anyone authenticated (or anon) can read reviews
  DROP POLICY IF EXISTS "reviews_select_authenticated" ON public.reviews;
  CREATE POLICY "reviews_select_authenticated"
    ON public.reviews
    FOR SELECT
    TO authenticated
    USING (true);

  DROP POLICY IF EXISTS "reviews_select_anon" ON public.reviews;
  CREATE POLICY "reviews_select_anon"
    ON public.reviews
    FOR SELECT
    TO anon
    USING (true);

  -- INSERT: authenticated users can only insert rows where reviewer_id = their own uid
  DROP POLICY IF EXISTS "reviews_insert_own" ON public.reviews;
  CREATE POLICY "reviews_insert_own"
    ON public.reviews
    FOR INSERT
    TO authenticated
    WITH CHECK (reviewer_id = auth.uid());

END $$;
