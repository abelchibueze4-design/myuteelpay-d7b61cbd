
-- KYC submissions table
CREATE TABLE public.kyc_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  date_of_birth date NOT NULL,
  address text NOT NULL,
  id_type text NOT NULL DEFAULT 'nin',
  id_number text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  admin_notes text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- RLS
ALTER TABLE public.kyc_submissions ENABLE ROW LEVEL SECURITY;

-- Users can view their own submission
CREATE POLICY "Users can view own kyc" ON public.kyc_submissions
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert own kyc
CREATE POLICY "Users can insert own kyc" ON public.kyc_submissions
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update own pending kyc
CREATE POLICY "Users can update own pending kyc" ON public.kyc_submissions
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id AND status = 'pending');

-- Admins can view all
CREATE POLICY "Admins can view all kyc" ON public.kyc_submissions
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Admins can update all
CREATE POLICY "Admins can update all kyc" ON public.kyc_submissions
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Add kyc_verified to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS kyc_verified boolean NOT NULL DEFAULT false;

-- Trigger to update profiles.kyc_verified when kyc approved
CREATE OR REPLACE FUNCTION public.handle_kyc_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    UPDATE public.profiles SET kyc_verified = true, updated_at = now() WHERE id = NEW.user_id;
  ELSIF NEW.status != 'approved' AND OLD.status = 'approved' THEN
    UPDATE public.profiles SET kyc_verified = false, updated_at = now() WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_kyc_status_change
  AFTER UPDATE OF status ON public.kyc_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_kyc_approval();
