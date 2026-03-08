import { useState, useMemo } from 'react';
import { mockCalves, CalfTag, getCalfLabel } from '@/data/mockCalves';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CalfDetailDialog } from '@/components/CalfDetailDialog';
import { Thermometer, Activity, Battery, Signal, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

const batteryPercent = (mv: number) => mv === 0 ? 0 : Math.min(100, Math.max(0, Math.round(((mv - 2000) / 1400) * 100)));

const statusColors: Record<string, string> = {
  healthy: 'bg-success/15 text-success border-success/30',
  warning: 'bg-warning/15 text-warning-foreground border-warning/30',
  critical: 'bg-destructive/15 text-destructive border-destructive/30',
  offline: 'bg-muted text-muted-foreground border-muted',
};

type SortKey = 'calfNumber' | 'gender' | 'temperature' | 'activity' | 'status' | 'batteryMv' | 'rssi' | 'lastSeen' | 'age';
type SortDir = 'asc' | 'desc';

const statusOrder: Record<string, number> = { critical: 0, warning: 1, healthy: 2, offline: 3 };
const activityOrder: Record<string, number> = { inactive: 0, resting: 1, active: 2 };

function sortCalves(calves: CalfTag[], key: SortKey, dir: SortDir): CalfTag[] {
  return [...calves].sort((a, b) => {
    let cmp = 0;
    switch (key) {
      case 'calfNumber': cmp = a.calfNumber - b.calfNumber; break;
      case 'gender': cmp = a.gender.localeCompare(b.gender); break;
      case 'temperature': cmp = a.temperature - b.temperature; break;
      case 'activity': cmp = activityOrder[a.activity] - activityOrder[b.activity]; break;
      case 'status': cmp = statusOrder[a.status] - statusOrder[b.status]; break;
      case 'batteryMv': cmp = a.batteryMv - b.batteryMv; break;
      case 'rssi': cmp = a.rssi - b.rssi; break;
      case 'lastSeen': cmp = a.lastSeen.localeCompare(b.lastSeen); break;
      case 'age': cmp = a.age.localeCompare(b.age); break;
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
  const [sortKey, setSortKey] = useState<SortKey>('calfNumber');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sorted = useMemo(() => sortCalves(mockCalves, sortKey, sortDir), [sortKey, sortDir]);
  const selectedCalf = mockCalves.find(c => c.tagId === selectedTagId) ?? null;

  const headProps = { currentKey: sortKey, currentDir: sortDir, onSort: handleSort };

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
              <SortableHead label="Calf #" sortKey="calfNumber" {...headProps} />
              <SortableHead label="Gender" sortKey="gender" {...headProps} />
              <SortableHead label="Age" sortKey="age" {...headProps} />
              <SortableHead label="Status" sortKey="status" {...headProps} />
              <SortableHead label="Temp" sortKey="temperature" {...headProps} />
              <SortableHead label="Activity" sortKey="activity" {...headProps} />
              <SortableHead label="Battery" sortKey="batteryMv" {...headProps} />
              <SortableHead label="Signal" sortKey="rssi" {...headProps} />
              <SortableHead label="Last Seen" sortKey="lastSeen" {...headProps} />
              <TableHead>Alerts</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map(calf => {
              const bp = batteryPercent(calf.batteryMv);
              const activeAlerts = calf.alerts.filter(a => !a.acknowledged).length;
              return (
                <TableRow
                  key={calf.tagId}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => setSelectedTagId(calf.tagId)}
                >
                  <TableCell className="font-heading font-semibold">
                    {getCalfLabel(calf)}
                    <span className="text-xs text-muted-foreground ml-2 font-normal">{calf.tagId}</span>
                  </TableCell>
                  <TableCell>{calf.gender === 'male' ? '♂' : '♀'}</TableCell>
                  <TableCell>{calf.age}</TableCell>
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
                    {calf.batteryMv > 0 ? (
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
                  <TableCell className="text-xs text-muted-foreground">{calf.lastSeen}</TableCell>
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
          </TableBody>
        </Table>
      </div>

      <CalfDetailDialog
        calf={selectedCalf}
        open={!!selectedTagId}
        onOpenChange={open => !open && setSelectedTagId(null)}
      />
    </div>
  );
};

export default Calves;
