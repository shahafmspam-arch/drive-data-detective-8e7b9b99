import { useState } from 'react';
import { mockCalves, getHerdStats, getAllAlerts } from '@/data/mockCalves';
import { HerdOverview } from '@/components/HerdOverview';
import { CalfCard } from '@/components/CalfCard';
import { AlertPanel } from '@/components/AlertPanel';
import { CalfDetailDialog } from '@/components/CalfDetailDialog';
import { StatusBar } from '@/components/StatusBar';

const Index = () => {
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const stats = getHerdStats();
  const alerts = getAllAlerts();
  const selectedCalf = mockCalves.find(c => c.tagId === selectedTagId) ?? null;

  return (
    <div className="space-y-6">
      <HerdOverview stats={stats} />
      <StatusBar stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <h2 className="font-heading font-semibold text-lg mb-4">Calves</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {mockCalves.map(calf => (
              <CalfCard key={calf.tagId} calf={calf} onClick={setSelectedTagId} />
            ))}
          </div>
        </div>
        <div>
          <AlertPanel alerts={alerts} />
        </div>
      </div>

      <CalfDetailDialog
        calf={selectedCalf}
        open={!!selectedTagId}
        onOpenChange={(open) => !open && setSelectedTagId(null)}
      />
    </div>
  );
};

export default Index;
