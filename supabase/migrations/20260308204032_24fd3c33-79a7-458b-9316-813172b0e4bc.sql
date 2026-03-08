
CREATE POLICY "Users can delete telemetry for their calves" ON public.telemetry
  FOR DELETE TO authenticated
  USING (calf_id IN (SELECT id FROM public.calves WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete alerts for their calves" ON public.alerts
  FOR DELETE TO authenticated
  USING (calf_id IN (SELECT id FROM public.calves WHERE user_id = auth.uid()));
