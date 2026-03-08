import { HerdStats } from '@/hooks/useCalves';
import { Activity, Thermometer, AlertTriangle, Wifi } from 'lucide-react';

interface HerdOverviewProps {
  stats: HerdStats;
}

const StatCard = ({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: React.ElementType; color: string }) => (
  <div className="glass-card rounded-lg p-5 stat-glow">
    <div className="flex items-center justify-between mb-2">
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      <div className={`p-2 rounded-md ${color}`}>
        <Icon className="h-4 w-4" />
      </div>
    </div>
    <p className="text-2xl font-heading font-bold">{value}</p>
  </div>
);

export const HerdOverview = ({ stats }: HerdOverviewProps) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard label="Total Calves" value={stats.totalCalves} icon={Activity} color="bg-primary/10 text-primary" />
      <StatCard label="Avg Temperature" value={`${stats.avgTemperature}°C`} icon={Thermometer} color="bg-info/10 text-info" />
      <StatCard label="Active Alerts" value={stats.activeAlerts} icon={AlertTriangle} color="bg-destructive/10 text-destructive" />
      <StatCard label="Online" value={`${stats.totalCalves - stats.offline}/${stats.totalCalves}`} icon={Wifi} color="bg-success/10 text-success" />
    </div>
  );
};
