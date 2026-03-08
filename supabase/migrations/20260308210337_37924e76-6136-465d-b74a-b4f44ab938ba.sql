
CREATE TABLE public.threshold_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  high_temp_enabled boolean NOT NULL DEFAULT true,
  high_temp_threshold numeric(4,1) NOT NULL DEFAULT 39.5,
  low_step_enabled boolean NOT NULL DEFAULT true,
  low_step_daily_min integer NOT NULL DEFAULT 100,
  mac_prefix text NOT NULL DEFAULT 'f0c812',
  offline_enabled boolean NOT NULL DEFAULT true,
  offline_seconds integer NOT NULL DEFAULT 10800,
  low_voltage_enabled boolean NOT NULL DEFAULT true,
  low_voltage_threshold numeric(3,1) NOT NULL DEFAULT 2.2,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.threshold_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own thresholds" ON public.threshold_settings
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own thresholds" ON public.threshold_settings
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own thresholds" ON public.threshold_settings
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Service role can read thresholds" ON public.threshold_settings
  FOR SELECT TO service_role USING (true);

CREATE TRIGGER update_threshold_settings_updated_at
  BEFORE UPDATE ON public.threshold_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
