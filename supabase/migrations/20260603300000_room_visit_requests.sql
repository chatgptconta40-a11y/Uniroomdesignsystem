-- Migration: room_visit_requests
-- Pedidos de visita feitos pelo estudante ANTES de se candidatar.
-- Independente de applications (fluxo pós-candidatura).
-- Admin NÃO participa nesta funcionalidade.

CREATE TABLE IF NOT EXISTS public.room_visit_requests (
  id               text        PRIMARY KEY,
  student_id       uuid        NOT NULL REFERENCES public.profiles(id)    ON DELETE CASCADE,
  landlord_id      uuid        NOT NULL REFERENCES public.profiles(id)    ON DELETE CASCADE,
  property_id      uuid                 REFERENCES public.properties(id)  ON DELETE CASCADE,
  room_id          uuid                 REFERENCES public.rooms(id)       ON DELETE CASCADE,
  requested_at     timestamptz NOT NULL,
  proposed_at      timestamptz,
  status           text        NOT NULL DEFAULT 'pending'
                               CHECK (status IN (
                                 'pending',
                                 'accepted',
                                 'rejected',
                                 'counter_proposed',
                                 'cancelled',
                                 'completed'
                               )),
  student_message  text,
  landlord_message text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_rvr_student_id   ON public.room_visit_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_rvr_landlord_id  ON public.room_visit_requests(landlord_id);
CREATE INDEX IF NOT EXISTS idx_rvr_property_id  ON public.room_visit_requests(property_id);
CREATE INDEX IF NOT EXISTS idx_rvr_room_id      ON public.room_visit_requests(room_id);
CREATE INDEX IF NOT EXISTS idx_rvr_status       ON public.room_visit_requests(status);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_rvr_updated_at
  BEFORE UPDATE ON public.room_visit_requests
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- RLS
ALTER TABLE public.room_visit_requests ENABLE ROW LEVEL SECURITY;

-- Estudante: lê os seus próprios pedidos
CREATE POLICY "rvr_student_select"
  ON public.room_visit_requests FOR SELECT
  USING (auth.uid() = student_id);

-- Estudante: cria pedidos (só os seus)
CREATE POLICY "rvr_student_insert"
  ON public.room_visit_requests FOR INSERT
  WITH CHECK (auth.uid() = student_id);

-- Estudante: atualiza os seus pedidos (ex: cancelar)
CREATE POLICY "rvr_student_update"
  ON public.room_visit_requests FOR UPDATE
  USING (auth.uid() = student_id);

-- Senhorio: lê pedidos associados a si
CREATE POLICY "rvr_landlord_select"
  ON public.room_visit_requests FOR SELECT
  USING (auth.uid() = landlord_id);

-- Senhorio: atualiza pedidos associados a si
CREATE POLICY "rvr_landlord_update"
  ON public.room_visit_requests FOR UPDATE
  USING (auth.uid() = landlord_id);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_visit_requests;
