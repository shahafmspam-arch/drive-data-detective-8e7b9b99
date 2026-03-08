import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';

export interface CalfWithTelemetry {
  id: string;
  user_id: string;
  calf_number: number;
  gender: 'male' | 'female';
  tag_id: string;
  tag_mac: string;
  birth_date: string | null;
  age: string | null;
  notes: string | null;
  // Latest telemetry
  temperature: number;
  motion_state: 0 | 1;
  activity: 'active' | 'resting' | 'inactive';
  rssi: number;
  battery_mv: number;
  last_seen: string | null;
  // Derived
  status: 'healthy' | 'warning' | 'critical' | 'offline';
  temperature_history: { time: string; value: number }[];
  alerts: CalfAlert[];
}

export interface CalfAlert {
  id: string;
  calf_id: string;
  type: 'fever' | 'hypothermia' | 'inactive' | 'low_battery' | 'sos' | 'offline';
  message: string;
  severity: 'warning' | 'critical';
  acknowledged: boolean;
  created_at: string;
}

export interface HerdStats {
  totalCalves: number;
  healthy: number;
  warnings: number;
  critical: number;
  offline: number;
  avgTemperature: number;
  activeAlerts: number;
}

function deriveStatus(temp: number, alerts: CalfAlert[], lastSeen: string | null): 'healthy' | 'warning' | 'critical' | 'offline' {
  if (!lastSeen) return 'offline';
  const lastSeenDate = new Date(lastSeen);
  const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);
  if (lastSeenDate < threeHoursAgo) return 'offline';

  const activeAlerts = alerts.filter(a => !a.acknowledged);
  if (activeAlerts.some(a => a.severity === 'critical')) return 'critical';
  if (activeAlerts.length > 0) return 'warning';
  return 'healthy';
}

async function fetchCalvesWithTelemetry(userId: string): Promise<CalfWithTelemetry[]> {
  // Fetch calves
  const { data: calves, error: calvesErr } = await supabase
    .from('calves')
    .select('*')
    .eq('user_id', userId);

  if (calvesErr) throw calvesErr;
  if (!calves?.length) return [];

  const calfIds = calves.map(c => c.id);

  // Fetch latest telemetry for each calf (last reading)
  // We'll get recent telemetry and pick the latest per calf
  const { data: telemetry, error: telErr } = await supabase
    .from('telemetry')
    .select('*')
    .in('calf_id', calfIds)
    .order('created_at', { ascending: false })
    .limit(1000);

  if (telErr) throw telErr;

  // Fetch active (unacknowledged) alerts
  const { data: alerts, error: alertErr } = await supabase
    .from('alerts')
    .select('*')
    .in('calf_id', calfIds)
    .eq('acknowledged', false);

  if (alertErr) throw alertErr;

  // Group telemetry by calf_id
  const telByCalf = new Map<string, any[]>();
  for (const t of (telemetry || [])) {
    const existing = telByCalf.get(t.calf_id) || [];
    existing.push(t);
    telByCalf.set(t.calf_id, existing);
  }

  // Group alerts by calf_id
  const alertsByCalf = new Map<string, CalfAlert[]>();
  for (const a of (alerts || [])) {
    const existing = alertsByCalf.get(a.calf_id) || [];
    existing.push(a as CalfAlert);
    alertsByCalf.set(a.calf_id, existing);
  }

  return calves.map(calf => {
    const calfTelemetry = telByCalf.get(calf.id) || [];
    const latest = calfTelemetry[0]; // Already sorted desc
    const calfAlerts = alertsByCalf.get(calf.id) || [];

    // Build 24h temperature history
    const tempHistory = calfTelemetry
      .filter((t: any) => t.temperature > 0)
      .slice(0, 288) // max ~24h at 5min intervals
      .reverse()
      .map((t: any) => ({
        time: new Date(t.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
        value: Number(t.temperature),
      }));

    const lastSeen = latest?.created_at || null;

    return {
      id: calf.id,
      user_id: calf.user_id,
      calf_number: calf.calf_number,
      gender: calf.gender as 'male' | 'female',
      tag_id: calf.tag_id,
      tag_mac: calf.tag_mac,
      birth_date: calf.birth_date,
      age: calf.age,
      notes: calf.notes,
      temperature: latest ? Number(latest.temperature) : 0,
      motion_state: latest ? latest.motion_state : 0,
      activity: latest?.activity || 'inactive',
      rssi: latest?.rssi || 0,
      battery_mv: latest?.battery_mv || 0,
      last_seen: lastSeen,
      status: deriveStatus(latest ? Number(latest.temperature) : 0, calfAlerts, lastSeen),
      temperature_history: tempHistory,
      alerts: calfAlerts,
    } as CalfWithTelemetry;
  });
}

export function useCalves() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const userId = session?.user?.id;

  const query = useQuery({
    queryKey: ['calves', userId],
    queryFn: () => fetchCalvesWithTelemetry(userId!),
    enabled: !!userId,
    refetchInterval: 60000, // Also poll every 60s as fallback
  });

  // Realtime subscription for telemetry & alerts
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('calves-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'telemetry' }, () => {
        queryClient.invalidateQueries({ queryKey: ['calves', userId] });
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'alerts' }, () => {
        queryClient.invalidateQueries({ queryKey: ['calves', userId] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'calves' }, () => {
        queryClient.invalidateQueries({ queryKey: ['calves', userId] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);

  // Compute herd stats
  const calves = query.data || [];
  const onlineCalves = calves.filter(c => c.status !== 'offline');

  const stats: HerdStats = {
    totalCalves: calves.length,
    healthy: calves.filter(c => c.status === 'healthy').length,
    warnings: calves.filter(c => c.status === 'warning').length,
    critical: calves.filter(c => c.status === 'critical').length,
    offline: calves.filter(c => c.status === 'offline').length,
    avgTemperature: onlineCalves.length
      ? +(onlineCalves.reduce((s, c) => s + c.temperature, 0) / onlineCalves.length).toFixed(1)
      : 0,
    activeAlerts: calves.flatMap(c => c.alerts).filter(a => !a.acknowledged).length,
  };

  const allAlerts = calves
    .flatMap(c => c.alerts.map(a => ({ ...a, calfLabel: `#${c.calf_number}` })))
    .sort((a, b) => (a.severity === 'critical' ? -1 : 1) - (b.severity === 'critical' ? -1 : 1));

  return {
    calves,
    stats,
    allAlerts,
    isLoading: query.isLoading,
    error: query.error,
  };
}

export function getCalfLabel(calf: { calf_number: number }) {
  return `#${calf.calf_number}`;
}
