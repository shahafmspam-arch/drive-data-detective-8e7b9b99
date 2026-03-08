import { useState } from 'react';
import { mockCalves, getHerdStats, getAllAlerts } from '@/data/mockCalves';
import { HerdOverview } from '@/components/HerdOverview';
import { CalfCard } from '@/components/CalfCard';
import { AlertPanel } from '@/components/AlertPanel';
import { CalfDetailDialog } from '@/components/CalfDetailDialog';
import { StatusBar } from '@/components/StatusBar';
import { Heart, Wifi, WifiOff } from 'lucide-react';

const Index = () => {
  const [selectedCalfId, setSelectedCalfId] = useState<string | null>(null);
  const stats = getHerdStats();
  const alerts = getAllAlerts();
  const selectedCalf = mockCalves.find(c => c.id === selectedCalfId) ?? null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/60 backdrop-blur-sm sticky top-0 z-10">
        <div className="container max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary rounded-lg">
              <Heart className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-heading font-bold text-xl">CalfWatch</h1>
              <p className="text-xs text-muted-foreground">BLE Health Monitoring Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-success/10 text-success">
              <Wifi className="h-3.5 w-3.5" />
              <span className="font-medium text-xs">Gateway Online</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Stats row */}
        <HerdOverview stats={stats} />

        {/* Health bar */}
        <StatusBar stats={stats} />

        {/* Calves grid + Alerts sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <h2 className="font-heading font-semibold text-lg mb-4">Calves</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {mockCalves.map(calf => (
                <CalfCard key={calf.id} calf={calf} onClick={setSelectedCalfId} />
              ))}
            </div>
          </div>
          <div>
            <AlertPanel alerts={alerts} />
          </div>
        </div>
      </main>

      {/* Detail dialog */}
      <CalfDetailDialog
        calf={selectedCalf}
        open={!!selectedCalfId}
        onOpenChange={(open) => !open && setSelectedCalfId(null)}
      />
    </div>
  );
};

export default Index;
