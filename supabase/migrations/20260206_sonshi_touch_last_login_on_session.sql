-- ============================================
-- Update last_login_at automatically on session insert
-- ============================================

CREATE OR REPLACE FUNCTION public.touch_last_login_after_session()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.app_users
  SET last_login_at = NOW(),
      updated_at = NOW()
  WHERE id = NEW.user_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_touch_last_login_after_session ON public.auth_sessions;

CREATE TRIGGER trg_touch_last_login_after_session
AFTER INSERT ON public.auth_sessions
FOR EACH ROW
EXECUTE FUNCTION public.touch_last_login_after_session();
