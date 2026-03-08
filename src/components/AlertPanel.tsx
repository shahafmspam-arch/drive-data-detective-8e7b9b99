import { AlertTriangle, Flame, Snowflake, Moon, Battery, AlertCircle, WifiOff } from 'lucide-react';

interface AlertItem {
  id: string;
  calf_id: string;
  calfLabel: string;
  type: 'fever' | 'hypothermia' | 'inactive' | 'low_battery' | 'sos' | 'offline';
  message: string;
  severity: 'warning' | 'critical';
  acknowledged: boolean;
  created_at: string;
}

interface AlertPanelProps {
  alerts: AlertItem[];
}

const alertIcon: Record<string, React.ElementType> = {
  fever: Flame,
  hypothermia: Snowflake,
  inactive: Moon,
  low_battery: Battery,
  sos: AlertCircle,
  offline: WifiOff,
};

export const AlertPanel = ({ alerts }: AlertPanelProps) => {
  const unacknowledged = alerts.filter(a => !a.acknowledged);

  return (
    <div className="glass-card rounded-lg p-5">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="h-5 w-5 text-destructive" />
        <h2 className="font-heading font-semibold text-lg">Active Alerts</h2>
        {unacknowledged.length > 0 && (
          <span className="ml-auto bg-destructive text-destructive-foreground text-xs font-bold px-2 py-0.5 rounded-full">
            {unacknowledged.length}
          </span>
        )}
      </div>

      {unacknowledged.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">No active alerts 🎉</p>
      ) : (
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {unacknowledged.map(alert => {
            const Icon = alertIcon[alert.type] || AlertCircle;
            const isCritical = alert.severity === 'critical';
            return (
              <div
                key={alert.id}
                className={`flex items-start gap-3 p-3 rounded-md border ${
                  isCritical
                    ? 'bg-destructive/5 border-destructive/20'
                    : 'bg-warning/5 border-warning/20'
                }`}
              >
                <Icon className={`h-4 w-4 mt-0.5 flex-shrink-0 ${isCritical ? 'text-destructive' : 'text-warning'}`} />
                <div className="min-w-0">
                  <p className="text-sm font-medium">{alert.calfLabel}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{alert.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">{new Date(alert.created_at).toLocaleString()}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
