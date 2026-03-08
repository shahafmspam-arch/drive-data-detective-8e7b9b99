import { CalfTag, CalfStatus, getCalfLabel } from '@/data/mockCalves';
import { Thermometer, Activity, Battery, Signal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface CalfCardProps {
  calf: CalfTag;
  onClick: (tagId: string) => void;
}

const statusConfig: Record<CalfStatus, { label: string; className: string }> = {
  healthy: { label: 'Healthy', className: 'bg-success/15 text-success border-success/30' },
  warning: { label: 'Warning', className: 'bg-warning/15 text-warning-foreground border-warning/30' },
  critical: { label: 'Critical', className: 'bg-destructive/15 text-destructive border-destructive/30 animate-pulse-soft' },
  offline: { label: 'Offline', className: 'bg-muted text-muted-foreground border-muted' },
};

const activityIcon = (activity: CalfTag['activity']) => {
  if (activity === 'active') return '🟢';
  if (activity === 'resting') return '🔵';
  return '⚪';
};

const batteryPercent = (mv: number) => {
  if (mv === 0) return 0;
  return Math.min(100, Math.max(0, Math.round(((mv - 2000) / 1400) * 100)));
};

const genderIcon = (g: CalfTag['gender']) => g === 'male' ? '♂' : '♀';

export const CalfCard = ({ calf, onClick }: CalfCardProps) => {
  const sc = statusConfig[calf.status];
  const bp = batteryPercent(calf.batteryMv);

  return (
    <button
      onClick={() => onClick(calf.tagId)}
      className="glass-card rounded-lg p-4 text-left transition-all hover:shadow-md hover:scale-[1.01] w-full"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-heading font-semibold text-lg">
            Calf {getCalfLabel(calf)} {genderIcon(calf.gender)}
          </h3>
          <p className="text-xs text-muted-foreground">{calf.tagId} · {calf.age}</p>
        </div>
        <Badge variant="outline" className={sc.className}>
          {sc.label}
        </Badge>
      </div>

      {calf.status !== 'offline' ? (
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <Thermometer className="h-3.5 w-3.5 text-muted-foreground" />
            <span className={calf.temperature > 39.5 ? 'text-destructive font-medium' : ''}>
              {calf.temperature}°C
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Activity className="h-3.5 w-3.5 text-muted-foreground" />
            <span>{activityIcon(calf.activity)} {calf.activity}</span>
          </div>
          <div className="flex items-center gap-2">
            <Battery className="h-3.5 w-3.5 text-muted-foreground" />
            <span className={bp < 30 ? 'text-warning font-medium' : ''}>{bp}%</span>
          </div>
          <div className="flex items-center gap-2">
            <Signal className="h-3.5 w-3.5 text-muted-foreground" />
            <span>{calf.rssi} dBm</span>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground italic">No signal — last seen {calf.lastSeen}</p>
      )}

      {calf.alerts.length > 0 && (
        <div className="mt-3 pt-3 border-t border-border">
          <p className="text-xs text-destructive font-medium">
            {calf.alerts.filter(a => !a.acknowledged).length} active alert(s)
          </p>
        </div>
      )}
    </button>
  );
};
