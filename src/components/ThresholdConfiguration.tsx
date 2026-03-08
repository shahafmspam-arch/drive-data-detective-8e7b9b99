import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Thermometer, Footprints, Wifi, WifiOff, Battery, Loader2, Save, RotateCcw } from 'lucide-react';

interface ThresholdData {
  high_temp_enabled: boolean;
  high_temp_threshold: number;
  low_step_enabled: boolean;
  low_step_daily_min: number;
  mac_prefix: string;
  offline_enabled: boolean;
  offline_seconds: number;
  low_voltage_enabled: boolean;
  low_voltage_threshold: number;
}

const defaults: ThresholdData = {
  high_temp_enabled: true,
  high_temp_threshold: 39.5,
  low_step_enabled: true,
  low_step_daily_min: 100,
  mac_prefix: 'f0c812',
  offline_enabled: true,
  offline_seconds: 10800,
  low_voltage_enabled: true,
  low_voltage_threshold: 2.2,
};

const SectionHeader = ({ icon: Icon, title, enabled, onToggle }: {
  icon: React.ElementType; title: string; enabled: boolean; onToggle: (v: boolean) => void;
}) => (
  <div className="flex items-center justify-between mb-4 pb-2 border-b border-border">
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 text-primary" />
      <h3 className="font-heading font-semibold text-base">{title}</h3>
    </div>
    <Switch checked={enabled} onCheckedChange={onToggle} />
  </div>
);

export const ThresholdConfiguration = () => {
  const { session } = useAuth();
  const { toast } = useToast();
  const [data, setData] = useState<ThresholdData>(defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const userId = session?.user?.id;

  useEffect(() => {
    if (!userId) return;
    const load = async () => {
      const { data: row } = await supabase
        .from('threshold_settings')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (row) {
        setData({
          high_temp_enabled: row.high_temp_enabled,
          high_temp_threshold: Number(row.high_temp_threshold),
          low_step_enabled: row.low_step_enabled,
          low_step_daily_min: row.low_step_daily_min,
          mac_prefix: row.mac_prefix,
          offline_enabled: row.offline_enabled,
          offline_seconds: row.offline_seconds,
          low_voltage_enabled: row.low_voltage_enabled,
          low_voltage_threshold: Number(row.low_voltage_threshold),
        });
      }
      setLoading(false);
    };
    load();
  }, [userId]);

  const handleSave = async () => {
    if (!userId) return;
    setSaving(true);
    try {
      // Upsert
      const { error } = await supabase
        .from('threshold_settings')
        .upsert({
          user_id: userId,
          ...data,
        }, { onConflict: 'user_id' });

      if (error) throw error;
      toast({ title: 'Thresholds saved', description: 'Your cattle threshold settings have been updated.' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => setData(defaults);

  const update = <K extends keyof ThresholdData>(key: K, value: ThresholdData[K]) => {
    setData(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* High Temperature Alert */}
      <div className="glass-card rounded-lg p-6">
        <SectionHeader
          icon={Thermometer}
          title="High Temperature Alert"
          enabled={data.high_temp_enabled}
          onToggle={v => update('high_temp_enabled', v)}
        />
        <div className={data.high_temp_enabled ? '' : 'opacity-50 pointer-events-none'}>
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">High Temperature Threshold (°C)</Label>
            <Input
              type="number"
              step="0.1"
              min="35"
              max="45"
              value={data.high_temp_threshold}
              onChange={e => update('high_temp_threshold', parseFloat(e.target.value) || 0)}
              className="w-40"
            />
            <p className="text-xs text-muted-foreground">Alert when calf temperature exceeds this value</p>
          </div>
        </div>
      </div>

      {/* Low Step Alert */}
      <div className="glass-card rounded-lg p-6">
        <SectionHeader
          icon={Footprints}
          title="Low Step Alert"
          enabled={data.low_step_enabled}
          onToggle={v => update('low_step_enabled', v)}
        />
        <div className={data.low_step_enabled ? '' : 'opacity-50 pointer-events-none'}>
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Daily Step Increase Less Than (Steps)</Label>
            <Input
              type="number"
              min="0"
              max="10000"
              value={data.low_step_daily_min}
              onChange={e => update('low_step_daily_min', parseInt(e.target.value) || 0)}
              className="w-40"
            />
            <p className="text-xs text-muted-foreground">Alert when daily activity steps fall below this threshold</p>
          </div>
        </div>
      </div>

      {/* MAC Prefix */}
      <div className="glass-card rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border">
          <Wifi className="h-4 w-4 text-primary" />
          <h3 className="font-heading font-semibold text-base">MAC Prefix</h3>
        </div>
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">BLE Tag MAC Address Prefix</Label>
          <Input
            value={data.mac_prefix}
            onChange={e => update('mac_prefix', e.target.value)}
            placeholder="f0c812"
            className="w-48 font-mono"
          />
          <p className="text-xs text-muted-foreground">Only accept tags with this MAC prefix from the gateway</p>
        </div>
      </div>

      {/* Offline Alert */}
      <div className="glass-card rounded-lg p-6">
        <SectionHeader
          icon={WifiOff}
          title="Offline Alert"
          enabled={data.offline_enabled}
          onToggle={v => update('offline_enabled', v)}
        />
        <div className={data.offline_enabled ? '' : 'opacity-50 pointer-events-none'}>
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Offline Time Threshold (Seconds)</Label>
            <Input
              type="number"
              min="60"
              max="86400"
              value={data.offline_seconds}
              onChange={e => update('offline_seconds', parseInt(e.target.value) || 0)}
              className="w-40"
            />
            <p className="text-xs text-muted-foreground">
              Alert when a tag hasn't reported for this duration ({Math.round(data.offline_seconds / 60)} min / {(data.offline_seconds / 3600).toFixed(1)} hrs)
            </p>
          </div>
        </div>
      </div>

      {/* Low Voltage Alert */}
      <div className="glass-card rounded-lg p-6">
        <SectionHeader
          icon={Battery}
          title="Low Voltage Alert"
          enabled={data.low_voltage_enabled}
          onToggle={v => update('low_voltage_enabled', v)}
        />
        <div className={data.low_voltage_enabled ? '' : 'opacity-50 pointer-events-none'}>
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Low Voltage Threshold (Volts)</Label>
            <Input
              type="number"
              step="0.1"
              min="1.0"
              max="4.0"
              value={data.low_voltage_threshold}
              onChange={e => update('low_voltage_threshold', parseFloat(e.target.value) || 0)}
              className="w-40"
            />
            <p className="text-xs text-muted-foreground">
              Alert when tag battery drops below {data.low_voltage_threshold}V ({Math.round(data.low_voltage_threshold * 1000)}mV)
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={handleReset} className="gap-2">
          <RotateCcw className="h-4 w-4" />
          Reset to Defaults
        </Button>
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Thresholds
        </Button>
      </div>
    </div>
  );
};
