
-- Calves table
CREATE TABLE public.calves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  calf_number integer NOT NULL,
  gender text NOT NULL DEFAULT 'female' CHECK (gender IN ('male', 'female')),
  tag_id text NOT NULL,
  tag_mac text NOT NULL,
  birth_date date,
  age text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, tag_id),
  UNIQUE(user_id, calf_number)
);

-- Telemetry table (time-series data from gateway)
CREATE TABLE public.telemetry (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  calf_id uuid NOT NULL REFERENCES public.calves(id) ON DELETE CASCADE,
  temperature numeric(4,1) NOT NULL DEFAULT 0,
  motion_state integer NOT NULL DEFAULT 0,
  activity text NOT NULL DEFAULT 'inactive' CHECK (activity IN ('active', 'resting', 'inactive')),
  rssi integer NOT NULL DEFAULT 0,
  battery_mv integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Alerts table
CREATE TABLE public.alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  calf_id uuid NOT NULL REFERENCES public.calves(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('fever', 'hypothermia', 'inactive', 'low_battery', 'sos', 'offline')),
  message text NOT NULL,
  severity text NOT NULL DEFAULT 'warning' CHECK (severity IN ('warning', 'critical')),
  acknowledged boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_telemetry_calf_time ON public.telemetry(calf_id, created_at DESC);
CREATE INDEX idx_alerts_calf ON public.alerts(calf_id, acknowledged);
CREATE INDEX idx_calves_user ON public.calves(user_id);

-- RLS
ALTER TABLE public.calves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telemetry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- Calves policies
CREATE POLICY "Users can view their own calves" ON public.calves
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own calves" ON public.calves
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own calves" ON public.calves
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own calves" ON public.calves
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Telemetry policies (access via calf ownership)
CREATE POLICY "Users can view telemetry for their calves" ON public.telemetry
  FOR SELECT TO authenticated
  USING (calf_id IN (SELECT id FROM public.calves WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert telemetry for their calves" ON public.telemetry
  FOR INSERT TO authenticated
  WITH CHECK (calf_id IN (SELECT id FROM public.calves WHERE user_id = auth.uid()));

-- Alerts policies
CREATE POLICY "Users can view alerts for their calves" ON public.alerts
  FOR SELECT TO authenticated
  USING (calf_id IN (SELECT id FROM public.calves WHERE user_id = auth.uid()));

CREATE POLICY "Users can update alerts for their calves" ON public.alerts
  FOR UPDATE TO authenticated
  USING (calf_id IN (SELECT id FROM public.calves WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert alerts for their calves" ON public.alerts
  FOR INSERT TO authenticated
  WITH CHECK (calf_id IN (SELECT id FROM public.calves WHERE user_id = auth.uid()));

-- Service role policy for edge function (gateway ingestion)
CREATE POLICY "Service role can insert telemetry" ON public.telemetry
  FOR INSERT TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can insert alerts" ON public.alerts
  FOR INSERT TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can read calves" ON public.calves
  FOR SELECT TO service_role
  USING (true);

-- Enable realtime for telemetry and alerts
ALTER PUBLICATION supabase_realtime ADD TABLE public.telemetry;
ALTER PUBLICATION supabase_realtime ADD TABLE public.alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.calves;

-- Updated_at trigger for calves
CREATE TRIGGER update_calves_updated_at
  BEFORE UPDATE ON public.calves
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
