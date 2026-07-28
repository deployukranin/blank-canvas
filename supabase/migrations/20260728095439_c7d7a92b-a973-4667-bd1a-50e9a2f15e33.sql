CREATE TABLE public.stripe_webhook_events (
  event_id text PRIMARY KEY,
  event_type text NOT NULL,
  source text NOT NULL,
  payload_hash text,
  processed_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.stripe_webhook_events TO service_role;

ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "no_client_access" ON public.stripe_webhook_events
  FOR ALL TO authenticated USING (false) WITH CHECK (false);

CREATE INDEX stripe_webhook_events_processed_at_idx
  ON public.stripe_webhook_events (processed_at DESC);