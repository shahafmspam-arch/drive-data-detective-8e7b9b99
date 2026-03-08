import { CalfData } from '@/data/mockCalves';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Thermometer, Activity, Battery, Signal, Clock, Tag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

interface CalfDetailDialogProps {
  calf: CalfData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const batteryPercent = (mv: number) => Math.min(100, Math.max(0, Math.round(((mv - 2000) / 1400) * 100)));

export const CalfDetailDialog = ({ calf, open, onOpenChange }: CalfDetailDialogProps) => {
  if (!calf) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl flex items-center gap-3">
            {calf.name}
            <Badge variant="outline" className="text-xs">
              {calf.breed} · {calf.age}
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
                <p className="font-semibold">{batteryPercent(calf.batteryMv)}% ({calf.batteryMv}mV)</p>
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
          {calf.temperatureHistory.length > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-2">Temperature (24h)</h3>
              <div className="h-40 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={calf.temperatureHistory}>
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

          {/* Activity breakdown */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex-1 p-3 rounded-md bg-success/5 border border-success/20 text-center">
              <p className="text-xs text-muted-foreground">Active Today</p>
              <p className="font-semibold">{Math.round(calf.dailyActivityMinutes / 60)}h {calf.dailyActivityMinutes % 60}m</p>
            </div>
            <div className="flex-1 p-3 rounded-md bg-info/5 border border-info/20 text-center">
              <p className="text-xs text-muted-foreground">Rest Today</p>
              <p className="font-semibold">{Math.round(calf.dailyRestMinutes / 60)}h {calf.dailyRestMinutes % 60}m</p>
            </div>
          </div>

          {/* Tag info */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Tag className="h-3 w-3" />
            <span>MAC: {calf.tagMac}</span>
            <Clock className="h-3 w-3 ml-3" />
            <span>Last seen: {calf.lastSeen}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
