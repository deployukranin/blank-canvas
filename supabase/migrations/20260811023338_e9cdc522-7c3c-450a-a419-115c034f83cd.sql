DO $$
DECLARE f record;
  keep text[] := ARRAY[
    'has_role','is_store_manager','is_store_member','is_vip','users_share_store','owns_tracker',
    'text_has_personal_data','use_invite_code','get_video_reaction_counts','get_store_trial_status'
  ];
BEGIN
  FOR f IN
    SELECT p.oid::regprocedure AS sig, p.proname
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prosecdef AND p.prokind = 'f'
  LOOP
    IF NOT (f.proname = ANY(keep)) THEN
      EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM anon, PUBLIC', f.sig);
      EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated, service_role', f.sig);
    END IF;
  END LOOP;
END $$;

-- Maintenance/admin-only routines: not callable by end users at all
REVOKE EXECUTE ON FUNCTION public.cleanup_old_rate_limits() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.mark_eligible_commissions() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.affiliate_mark_eligible() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.log_audit_event(uuid, text, text, text, jsonb) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.award_reputation(uuid, uuid, text, text, integer) FROM authenticated;