import { HerdStats } from '@/data/mockCalves';

interface StatusBarProps {
  stats: HerdStats;
}

export const StatusBar = ({ stats }: StatusBarProps) => {
  const segments = [
    { count: stats.healthy, color: 'bg-success', label: 'Healthy' },
    { count: stats.warnings, color: 'bg-warning', label: 'Warning' },
    { count: stats.critical, color: 'bg-destructive', label: 'Critical' },
    { count: stats.offline, color: 'bg-muted-foreground/40', label: 'Offline' },
  ];

  return (
    <div className="glass-card rounded-lg p-5">
      <h2 className="font-heading font-semibold text-sm mb-3 text-muted-foreground uppercase tracking-wide">Herd Health Distribution</h2>
      <div className="flex rounded-full overflow-hidden h-3 mb-3">
        {segments.map(s => (
          s.count > 0 && (
            <div
              key={s.label}
              className={`${s.color} transition-all`}
              style={{ width: `${(s.count / stats.totalCalves) * 100}%` }}
            />
          )
        ))}
      </div>
      <div className="flex flex-wrap gap-4 text-xs">
        {segments.map(s => (
          <div key={s.label} className="flex items-center gap-1.5">
            <div className={`h-2.5 w-2.5 rounded-full ${s.color}`} />
            <span className="text-muted-foreground">{s.label}</span>
            <span className="font-semibold">{s.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
