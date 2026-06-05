-- The reports.reason column was typed as a report_reason enum in the live DB,
-- but the frontend sends free-form string values (fraude_possivel, etc.) that
-- don't match the enum. Change the column to text so any reason value is accepted.
-- Safe to run multiple times: no-op if the column is already text.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'reports'
      AND column_name  = 'reason'
      AND data_type   <> 'text'
  ) THEN
    ALTER TABLE public.reports
      ALTER COLUMN reason TYPE text USING reason::text;
  END IF;
END $$;
