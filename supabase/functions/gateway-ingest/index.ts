import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface GatewayPayload {
  user_id: string; // farm owner's user_id
  readings: {
    tag_mac: string;
    temperature: number;
    motion_state: 0 | 1;
    rssi: number;
    battery_mv: number;
  }[];
}

// Alert thresholds
const FEVER_WARNING = 39.5;
const FEVER_CRITICAL = 40.0;
const HYPOTHERMIA_THRESHOLD = 37.0;
const LOW_BATTERY_MV = 2200;

function deriveActivity(motionState: number, temperature: number): string {
  if (motionState === 1) return 'active';
  if (temperature > 0) return 'resting';
  return 'inactive';
}

function generateAlerts(
  calfId: string,
  calfLabel: string,
  temperature: number,
  batteryMv: number,
  activity: string,
): { type: string; message: string; severity: string }[] {
  const alerts: { type: string; message: string; severity: string }[] = [];

  if (temperature >= FEVER_CRITICAL) {
    alerts.push({ type: 'fever', message: `High fever detected: ${temperature}°C`, severity: 'critical' });
  } else if (temperature >= FEVER_WARNING) {
    alerts.push({ type: 'fever', message: `Temperature elevated: ${temperature}°C (threshold: ${FEVER_WARNING}°C)`, severity: 'warning' });
  }

  if (temperature > 0 && temperature < HYPOTHERMIA_THRESHOLD) {
    alerts.push({ type: 'hypothermia', message: `Low temperature: ${temperature}°C`, severity: 'critical' });
  }

  if (batteryMv > 0 && batteryMv < LOW_BATTERY_MV) {
    alerts.push({ type: 'low_battery', message: `Tag battery low: ${batteryMv}mV`, severity: 'warning' });
  }

  if (activity === 'inactive') {
    alerts.push({ type: 'inactive', message: 'No movement detected', severity: 'warning' });
  }

  return alerts;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const payload: GatewayPayload = await req.json();

    if (!payload.user_id || !payload.readings?.length) {
      return new Response(JSON.stringify({ error: 'Missing user_id or readings' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get all calves for this user, keyed by tag_mac
    const { data: calves, error: calvesError } = await supabase
      .from('calves')
      .select('id, tag_mac, calf_number')
      .eq('user_id', payload.user_id);

    if (calvesError) throw calvesError;

    const calfByMac = new Map(calves?.map(c => [c.tag_mac, c]) || []);

    const telemetryRows: any[] = [];
    const alertRows: any[] = [];
    const unknownMacs: string[] = [];

    for (const reading of payload.readings) {
      const calf = calfByMac.get(reading.tag_mac);
      if (!calf) {
        unknownMacs.push(reading.tag_mac);
        continue;
      }

      const activity = deriveActivity(reading.motion_state, reading.temperature);

      telemetryRows.push({
        calf_id: calf.id,
        temperature: reading.temperature,
        motion_state: reading.motion_state,
        activity,
        rssi: reading.rssi,
        battery_mv: reading.battery_mv,
      });

      const alerts = generateAlerts(
        calf.id,
        `#${calf.calf_number}`,
        reading.temperature,
        reading.battery_mv,
        activity,
      );

      for (const alert of alerts) {
        alertRows.push({
          calf_id: calf.id,
          type: alert.type,
          message: alert.message,
          severity: alert.severity,
        });
      }
    }

    // Batch insert telemetry
    if (telemetryRows.length > 0) {
      const { error: telError } = await supabase.from('telemetry').insert(telemetryRows);
      if (telError) throw telError;
    }

    // Batch insert alerts
    if (alertRows.length > 0) {
      const { error: alertError } = await supabase.from('alerts').insert(alertRows);
      if (alertError) throw alertError;
    }

    return new Response(JSON.stringify({
      success: true,
      processed: telemetryRows.length,
      alerts_created: alertRows.length,
      unknown_macs: unknownMacs,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
