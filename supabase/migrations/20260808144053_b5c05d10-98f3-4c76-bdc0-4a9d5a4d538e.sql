-- 1. Profile customizations (VIP only)
CREATE TABLE public.profile_customizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  banner_url text,
  avatar_url text,
  display_name text,
  pronouns text,
  status_text text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, store_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profile_customizations TO authenticated;
GRANT ALL ON public.profile_customizations TO service_role;

ALTER TABLE public.profile_customizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Store members can view customizations"
  ON public.profile_customizations FOR SELECT TO authenticated
  USING (public.is_store_member(store_id) OR public.is_store_manager(store_id) OR user_id = auth.uid());

CREATE POLICY "Owner can insert own customization"
  ON public.profile_customizations FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Owner can update own customization"
  ON public.profile_customizations FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Owner can delete own customization"
  ON public.profile_customizations FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE TRIGGER trg_profile_customizations_updated
  BEFORE UPDATE ON public.profile_customizations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enforce active VIP for premium customization
CREATE OR REPLACE FUNCTION public.profile_customizations_require_vip()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public'
AS $$
BEGIN
  IF NEW.user_id <> auth.uid() THEN
    RAISE EXCEPTION 'Not allowed';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.vip_subscriptions
    WHERE user_id = NEW.user_id
      AND store_id = NEW.store_id
      AND status = 'active'
      AND expires_at > now()
  ) THEN
    RAISE EXCEPTION 'vip_required: active VIP subscription needed to customize profile';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_profile_customizations_vip
  BEFORE INSERT OR UPDATE ON public.profile_customizations
  FOR EACH ROW EXECUTE FUNCTION public.profile_customizations_require_vip();

-- 2. Reputation events ledger
CREATE TABLE public.reputation_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  event_type text NOT NULL,
  points integer NOT NULL DEFAULT 0,
  source_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX reputation_events_unique_source
  ON public.reputation_events (store_id, user_id, event_type, source_id)
  WHERE source_id IS NOT NULL;

CREATE INDEX reputation_events_store_user ON public.reputation_events (store_id, user_id);

GRANT SELECT ON public.reputation_events TO authenticated;
GRANT ALL ON public.reputation_events TO service_role;

ALTER TABLE public.reputation_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Store members can read reputation events"
  ON public.reputation_events FOR SELECT TO authenticated
  USING (public.is_store_member(store_id) OR public.is_store_manager(store_id) OR user_id = auth.uid());

-- 3. Award function
CREATE OR REPLACE FUNCTION public.award_reputation(
  p_store_id uuid,
  p_user_id uuid,
  p_event_type text,
  p_source_id text DEFAULT NULL,
  p_points integer DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public'
AS $$
DECLARE
  v_cfg jsonb;
  v_points integer;
BEGIN
  IF p_store_id IS NULL OR p_user_id IS NULL OR p_event_type IS NULL THEN
    RETURN;
  END IF;

  SELECT config_value INTO v_cfg
  FROM public.app_configurations
  WHERE store_id = p_store_id AND config_key = 'gamification_config'
  LIMIT 1;

  IF v_cfg IS NOT NULL AND COALESCE((v_cfg->>'enabled')::boolean, true) = false THEN
    RETURN;
  END IF;

  v_points := COALESCE(
    p_points,
    NULLIF((v_cfg->'points'->>p_event_type), '')::int,
    CASE p_event_type
      WHEN 'idea_created' THEN 25
      WHEN 'vote_received' THEN 10
      WHEN 'vote_given' THEN 2
      WHEN 'comment_given' THEN 5
      WHEN 'order_paid' THEN 50
      WHEN 'daily_login' THEN 3
      ELSE 0
    END
  );

  IF v_points <= 0 THEN
    RETURN;
  END IF;

  INSERT INTO public.reputation_events (store_id, user_id, event_type, points, source_id)
  VALUES (p_store_id, p_user_id, p_event_type, v_points, p_source_id)
  ON CONFLICT DO NOTHING;
END;
$$;

GRANT EXECUTE ON FUNCTION public.award_reputation(uuid, uuid, text, text, integer) TO service_role;

-- Daily login RPC (self only)
CREATE OR REPLACE FUNCTION public.claim_daily_reputation(p_store_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public'
AS $$
BEGIN
  IF auth.uid() IS NULL OR p_store_id IS NULL THEN
    RETURN json_build_object('success', false);
  END IF;
  IF NOT public.is_store_member(p_store_id) THEN
    RETURN json_build_object('success', false);
  END IF;

  PERFORM public.award_reputation(
    p_store_id, auth.uid(), 'daily_login',
    to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD')
  );

  RETURN json_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_daily_reputation(uuid) TO authenticated;

-- 4. Triggers on activity tables
CREATE OR REPLACE FUNCTION public.reputation_on_idea()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'pg_catalog', 'public' AS $$
BEGIN
  IF NEW.user_id IS NOT NULL AND NEW.store_id IS NOT NULL THEN
    PERFORM public.award_reputation(NEW.store_id, NEW.user_id, 'idea_created', NEW.id::text);
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_reputation_idea
  AFTER INSERT ON public.video_ideas
  FOR EACH ROW EXECUTE FUNCTION public.reputation_on_idea();

CREATE OR REPLACE FUNCTION public.reputation_on_idea_vote()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'pg_catalog', 'public' AS $$
DECLARE v_store uuid; v_owner uuid;
BEGIN
  SELECT store_id, user_id INTO v_store, v_owner FROM public.video_ideas WHERE id = NEW.idea_id;
  IF v_store IS NULL THEN RETURN NEW; END IF;

  PERFORM public.award_reputation(v_store, NEW.user_id, 'vote_given', NEW.id::text);

  IF v_owner IS NOT NULL AND v_owner <> NEW.user_id THEN
    PERFORM public.award_reputation(v_store, v_owner, 'vote_received', NEW.id::text);
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_reputation_idea_vote
  AFTER INSERT ON public.video_idea_votes
  FOR EACH ROW EXECUTE FUNCTION public.reputation_on_idea_vote();

CREATE OR REPLACE FUNCTION public.reputation_on_chat_message()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'pg_catalog', 'public' AS $$
BEGIN
  IF NEW.user_id IS NOT NULL AND NEW.store_id IS NOT NULL THEN
    PERFORM public.award_reputation(NEW.store_id, NEW.user_id, 'comment_given', NEW.id::text);
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_reputation_chat_message
  AFTER INSERT ON public.video_chat_messages
  FOR EACH ROW EXECUTE FUNCTION public.reputation_on_chat_message();

CREATE OR REPLACE FUNCTION public.reputation_on_order_paid()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'pg_catalog', 'public' AS $$
BEGIN
  IF NEW.status = 'paid' AND OLD.status IS DISTINCT FROM 'paid'
     AND NEW.user_id IS NOT NULL AND NEW.store_id IS NOT NULL THEN
    PERFORM public.award_reputation(NEW.store_id, NEW.user_id, 'order_paid', NEW.id::text);
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_reputation_order_paid
  AFTER UPDATE ON public.custom_orders
  FOR EACH ROW EXECUTE FUNCTION public.reputation_on_order_paid();

-- 5. Read helpers
CREATE OR REPLACE FUNCTION public.get_user_reputation(p_store_id uuid, p_user_id uuid DEFAULT NULL)
RETURNS json
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'pg_catalog', 'public'
AS $$
DECLARE
  v_user uuid := COALESCE(p_user_id, auth.uid());
  v_total int := 0;
  v_counts jsonb := '{}'::jsonb;
BEGIN
  IF v_user IS NULL OR p_store_id IS NULL THEN
    RETURN json_build_object('total_points', 0, 'counts', '{}'::jsonb);
  END IF;

  SELECT COALESCE(SUM(points), 0) INTO v_total
  FROM public.reputation_events WHERE store_id = p_store_id AND user_id = v_user;

  SELECT COALESCE(jsonb_object_agg(event_type, c), '{}'::jsonb) INTO v_counts
  FROM (
    SELECT event_type, count(*) AS c
    FROM public.reputation_events
    WHERE store_id = p_store_id AND user_id = v_user
    GROUP BY event_type
  ) s;

  RETURN json_build_object('user_id', v_user, 'total_points', v_total, 'counts', v_counts);
END; $$;

GRANT EXECUTE ON FUNCTION public.get_user_reputation(uuid, uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_store_leaderboard(p_store_id uuid, p_limit integer DEFAULT 10)
RETURNS TABLE(user_id uuid, handle text, display_name text, avatar_url text, total_points bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'pg_catalog', 'public'
AS $$
  SELECT re.user_id,
         p.handle,
         COALESCE(pc.display_name, p.display_name) AS display_name,
         COALESCE(pc.avatar_url, p.avatar_url) AS avatar_url,
         SUM(re.points)::bigint AS total_points
  FROM public.reputation_events re
  LEFT JOIN public.profiles p ON p.user_id = re.user_id
  LEFT JOIN public.profile_customizations pc ON pc.user_id = re.user_id AND pc.store_id = re.store_id
  WHERE re.store_id = p_store_id
  GROUP BY re.user_id, p.handle, pc.display_name, p.display_name, pc.avatar_url, p.avatar_url
  ORDER BY total_points DESC
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 10), 1), 100);
$$;

GRANT EXECUTE ON FUNCTION public.get_store_leaderboard(uuid, integer) TO authenticated;