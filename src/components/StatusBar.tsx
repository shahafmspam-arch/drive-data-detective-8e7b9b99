import { HerdStats } from '@/hooks/useCalves';
import { X } from 'lucide-react';

export type StatusFilter = 'healthy' | 'warning' | 'critical' | 'offline' | null;

interface StatusBarProps {
  stats: HerdStats;
  activeFilter?: StatusFilter;
  onFilterChange?: (filter: StatusFilter) => void;
}

export const StatusBar = ({ stats, activeFilter, onFilterChange }: StatusBarProps) => {
  const segments = [
    { key: 'healthy' as const, count: stats.healthy, color: 'bg-success', label: 'Healthy' },
    { key: 'warning' as const, count: stats.warnings, color: 'bg-warning', label: 'Warning' },
    { key: 'critical' as const, count: stats.critical, color: 'bg-destructive', label: 'Critical' },
    { key: 'offline' as const, count: stats.offline, color: 'bg-muted-foreground/40', label: 'Offline' },
  ];

  const handleClick = (key: StatusFilter) => {
    onFilterChange?.(activeFilter === key ? null : key);
  };

  return (
    <div className="glass-card rounded-lg p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-heading font-semibold text-sm text-muted-foreground uppercase tracking-wide">Herd Health Distribution</h2>
        {activeFilter && (
          <button
            onClick={() => onFilterChange?.(null)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-muted"
          >
            <X className="h-3 w-3" />
            Clear filter
          </button>
        )}
      </div>
      <div className="flex rounded-full overflow-hidden h-3 mb-3">
        {segments.map(s => (
          s.count > 0 && (
            <div
              key={s.key}
              className={`${s.color} transition-all cursor-pointer hover:opacity-80 ${activeFilter && activeFilter !== s.key ? 'opacity-30' : ''}`}
              style={{ width: `${(s.count / stats.totalCalves) * 100}%` }}
              onClick={() => handleClick(s.key)}
              title={`Filter by ${s.label}`}
            />
          )
        ))}
      </div>
      <div className="flex flex-wrap gap-4 text-xs">
        {segments.map(s => (
          <button
            key={s.key}
            onClick={() => handleClick(s.key)}
            className={`flex items-center gap-1.5 transition-opacity cursor-pointer hover:opacity-80 ${activeFilter && activeFilter !== s.key ? 'opacity-30' : ''} ${activeFilter === s.key ? 'ring-1 ring-foreground/20 rounded-full px-2 py-0.5' : ''}`}
          >
            <div className={`h-2.5 w-2.5 rounded-full ${s.color}`} />
            <span className="text-muted-foreground">{s.label}</span>
            <span className="font-semibold">{s.count}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
