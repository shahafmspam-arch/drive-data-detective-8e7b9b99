import { useState, useMemo } from 'react';
import { useCalves, CalfWithTelemetry, getCalfLabel } from '@/hooks/useCalves';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CalfDetailDialog } from '@/components/CalfDetailDialog';
import { Thermometer, Activity, Battery, Signal, ArrowUpDown, ArrowUp, ArrowDown, Loader2 } from 'lucide-react';

const batteryPercent = (mv: number) => mv === 0 ? 0 : Math.min(100, Math.max(0, Math.round(((mv - 2000) / 1400) * 100)));

const statusColors: Record<string, string> = {
  healthy: 'bg-success/15 text-success border-success/30',
  warning: 'bg-warning/15 text-warning-foreground border-warning/30',
  critical: 'bg-destructive/15 text-destructive border-destructive/30',
  offline: 'bg-muted text-muted-foreground border-muted',
};

type SortKey = 'calf_number' | 'gender' | 'temperature' | 'activity' | 'status' | 'battery_mv' | 'rssi' | 'last_seen' | 'age';
type SortDir = 'asc' | 'desc';

const statusOrder: Record<string, number> = { critical: 0, warning: 1, healthy: 2, offline: 3 };
const activityOrder: Record<string, number> = { inactive: 0, resting: 1, active: 2 };

function sortCalves(calves: CalfWithTelemetry[], key: SortKey, dir: SortDir): CalfWithTelemetry[] {
  return [...calves].sort((a, b) => {
    let cmp = 0;
    switch (key) {
      case 'calf_number': cmp = a.calf_number - b.calf_number; break;
      case 'gender': cmp = a.gender.localeCompare(b.gender); break;
      case 'temperature': cmp = a.temperature - b.temperature; break;
      case 'activity': cmp = (activityOrder[a.activity] || 0) - (activityOrder[b.activity] || 0); break;
      case 'status': cmp = (statusOrder[a.status] || 0) - (statusOrder[b.status] || 0); break;
      case 'battery_mv': cmp = a.battery_mv - b.battery_mv; break;
      case 'rssi': cmp = a.rssi - b.rssi; break;
      case 'last_seen': cmp = (a.last_seen || '').localeCompare(b.last_seen || ''); break;
      case 'age': cmp = (a.age || '').localeCompare(b.age || ''); break;
    }
    return dir === 'asc' ? cmp : -cmp;
  });
}

const SortableHead = ({ label, sortKey, currentKey, currentDir, onSort }: {
  label: string; sortKey: SortKey; currentKey: SortKey; currentDir: SortDir;
  onSort: (key: SortKey) => void;
}) => {
  const active = currentKey === sortKey;
  return (
    <TableHead>
      <Button variant="ghost" size="sm" className="gap-1 -ml-3 h-8 font-medium" onClick={() => onSort(sortKey)}>
        {label}
        {active ? (currentDir === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 text-muted-foreground/50" />}
      </Button>
    </TableHead>
  );
};

const activityIcon = (a: string) => a === 'active' ? '🟢' : a === 'resting' ? '🔵' : '⚪';

const Calves = () => {
  const { calves, isLoading } = useCalves();
  const [sortKey, setSortKey] = useState<SortKey>('calf_number');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [selectedCalfId, setSelectedCalfId] = useState<string | null>(null);

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sorted = useMemo(() => sortCalves(calves, sortKey, sortDir), [calves, sortKey, sortDir]);
  const selectedCalf = calves.find(c => c.id === selectedCalfId) ?? null;

  const headProps = { currentKey: sortKey, currentDir: sortDir, onSort: handleSort };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading font-bold text-2xl">Calves</h1>
        <p className="text-sm text-muted-foreground mt-1">All monitored calves — click any row for details</p>
      </div>

      <div className="glass-card rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableHead label="Calf #" sortKey="calf_number" {...headProps} />
              <SortableHead label="Gender" sortKey="gender" {...headProps} />
              <SortableHead label="Age" sortKey="age" {...headProps} />
              <SortableHead label="Status" sortKey="status" {...headProps} />
              <SortableHead label="Temp" sortKey="temperature" {...headProps} />
              <SortableHead label="Activity" sortKey="activity" {...headProps} />
              <SortableHead label="Battery" sortKey="battery_mv" {...headProps} />
              <SortableHead label="Signal" sortKey="rssi" {...headProps} />
              <SortableHead label="Last Seen" sortKey="last_seen" {...headProps} />
              <TableHead>Alerts</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map(calf => {
              const bp = batteryPercent(calf.battery_mv);
              const activeAlerts = calf.alerts.filter(a => !a.acknowledged).length;
              return (
                <TableRow
                  key={calf.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => setSelectedCalfId(calf.id)}
                >
                  <TableCell className="font-heading font-semibold">
                    {getCalfLabel(calf)}
                    <span className="text-xs text-muted-foreground ml-2 font-normal">{calf.tag_id}</span>
                  </TableCell>
                  <TableCell>{calf.gender === 'male' ? '♂' : '♀'}</TableCell>
                  <TableCell>{calf.age || 'N/A'}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusColors[calf.status]}>{calf.status}</Badge>
                  </TableCell>
                  <TableCell>
                    {calf.temperature > 0 ? (
                      <span className={`flex items-center gap-1 ${calf.temperature > 39.5 ? 'text-destructive font-medium' : ''}`}>
                        <Thermometer className="h-3.5 w-3.5 text-muted-foreground" />
                        {calf.temperature}°C
                      </span>
                    ) : '—'}
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center gap-1.5">
                      {activityIcon(calf.activity)}
                      <span className="capitalize">{calf.activity}</span>
                    </span>
                  </TableCell>
                  <TableCell>
                    {calf.battery_mv > 0 ? (
                      <span className={`flex items-center gap-1 ${bp < 30 ? 'text-warning font-medium' : ''}`}>
                        <Battery className="h-3.5 w-3.5 text-muted-foreground" />
                        {bp}%
                      </span>
                    ) : '—'}
                  </TableCell>
                  <TableCell>
                    {calf.rssi !== 0 ? (
                      <span className="flex items-center gap-1">
                        <Signal className="h-3.5 w-3.5 text-muted-foreground" />
                        {calf.rssi}
                      </span>
                    ) : '—'}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {calf.last_seen ? new Date(calf.last_seen).toLocaleString() : 'Never'}
                  </TableCell>
                  <TableCell>
                    {activeAlerts > 0 ? (
                      <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">
                        {activeAlerts}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
            {sorted.length === 0 && (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                  No calves registered yet. Go to Tag Management to add your first calf.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <CalfDetailDialog
        calf={selectedCalf}
        open={!!selectedCalfId}
        onOpenChange={open => !open && setSelectedCalfId(null)}
      />
    </div>
  );
};

export default Calves;
