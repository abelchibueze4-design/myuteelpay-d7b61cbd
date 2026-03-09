
-- Create a trigger function to auto-log admin actions on key tables
CREATE OR REPLACE FUNCTION public.log_admin_action()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_admin_id uuid;
  v_admin_email text;
  v_action text;
  v_target_type text;
  v_target_id text;
  v_metadata jsonb;
BEGIN
  v_admin_id := auth.uid();
  
  -- Only log if actor is admin
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = v_admin_id AND role = 'admin') THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
  END IF;

  SELECT email INTO v_admin_email FROM auth.users WHERE id = v_admin_id;
  v_target_type := TG_TABLE_NAME;

  IF TG_OP = 'UPDATE' THEN
    v_action := 'Updated ' || TG_TABLE_NAME;
    v_target_id := NEW.id::text;
    v_metadata := jsonb_build_object('operation', 'update');
  ELSIF TG_OP = 'INSERT' THEN
    v_action := 'Created ' || TG_TABLE_NAME || ' record';
    v_target_id := NEW.id::text;
    v_metadata := jsonb_build_object('operation', 'insert');
  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'Deleted ' || TG_TABLE_NAME || ' record';
    v_target_id := OLD.id::text;
    v_metadata := jsonb_build_object('operation', 'delete');
  END IF;

  INSERT INTO public.audit_logs (admin_id, admin_email, action, target_type, target_id, metadata)
  VALUES (v_admin_id, v_admin_email, v_action, v_target_type, v_target_id, v_metadata);

  IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$;

-- Attach triggers to key admin-managed tables
CREATE TRIGGER audit_profiles_changes
  AFTER UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.log_admin_action();

CREATE TRIGGER audit_wallet_changes
  AFTER UPDATE ON public.wallets
  FOR EACH ROW EXECUTE FUNCTION public.log_admin_action();

CREATE TRIGGER audit_transaction_changes
  AFTER UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.log_admin_action();

CREATE TRIGGER audit_kyc_changes
  AFTER UPDATE ON public.kyc_submissions
  FOR EACH ROW EXECUTE FUNCTION public.log_admin_action();

CREATE TRIGGER audit_site_config_changes
  AFTER INSERT OR UPDATE ON public.site_configurations
  FOR EACH ROW EXECUTE FUNCTION public.log_admin_action();
