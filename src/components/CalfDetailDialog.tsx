import { CalfWithTelemetry, getCalfLabel } from '@/hooks/useCalves';
import { calcAge } from '@/lib/calcAge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Thermometer, Activity, Battery, Signal, Clock, Tag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

interface CalfDetailDialogProps {
  calf: CalfWithTelemetry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const batteryPercent = (mv: number) => Math.min(100, Math.max(0, Math.round(((mv - 2000) / 1400) * 100)));

export const CalfDetailDialog = ({ calf, open, onOpenChange }: CalfDetailDialogProps) => {
  if (!calf) return null;

  const age = calf.birth_date ? calcAge(calf.birth_date) : (calf.age || 'N/A');
  const genderLabel = calf.gender === 'male' ? '♂ Male' : '♀ Female';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl flex items-center gap-3">
            Calf {getCalfLabel(calf)}
            <Badge variant="outline" className="text-xs">
              {genderLabel} · {age}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Vitals */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 p-3 rounded-md bg-muted/50">
              <Thermometer className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Temperature</p>
                <p className={`font-semibold ${calf.temperature > 39.5 ? 'text-destructive' : ''}`}>
                  {calf.temperature}°C
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-md bg-muted/50">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Activity</p>
                <p className="font-semibold capitalize">{calf.activity}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-md bg-muted/50">
              <Battery className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Battery</p>
                <p className="font-semibold">{batteryPercent(calf.battery_mv)}% ({calf.battery_mv}mV)</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-md bg-muted/50">
              <Signal className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Signal</p>
                <p className="font-semibold">{calf.rssi} dBm</p>
              </div>
            </div>
          </div>

          {/* Temp chart */}
          {calf.temperature_history.length > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-2">Temperature (24h)</h3>
              <div className="h-40 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={calf.temperature_history}>
                    <XAxis dataKey="time" tick={{ fontSize: 10 }} interval={3} stroke="hsl(var(--muted-foreground))" />
                    <YAxis domain={[37, 41]} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: 12,
                      }}
                    />
                    <ReferenceLine y={39.5} stroke="hsl(var(--destructive))" strokeDasharray="4 4" label={{ value: 'Fever', fontSize: 10, fill: 'hsl(var(--destructive))' }} />
                    <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Tag info */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Tag className="h-3 w-3" />
            <span>Tag: {calf.tag_id} · MAC: {calf.tag_mac}</span>
            <Clock className="h-3 w-3 ml-3" />
            <span>Last seen: {calf.last_seen ? new Date(calf.last_seen).toLocaleString() : 'Never'}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
