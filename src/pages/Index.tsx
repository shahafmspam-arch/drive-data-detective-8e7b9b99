import { useState, useMemo } from 'react';
import { useCalves } from '@/hooks/useCalves';
import { HerdOverview } from '@/components/HerdOverview';
import { CalfCard } from '@/components/CalfCard';
import { AlertPanel } from '@/components/AlertPanel';
import { CalfDetailDialog } from '@/components/CalfDetailDialog';
import { StatusBar, StatusFilter } from '@/components/StatusBar';
import { Loader2 } from 'lucide-react';

const Index = () => {
  const [selectedCalfId, setSelectedCalfId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(null);
  const { calves, stats, allAlerts, isLoading } = useCalves();
  const selectedCalf = calves.find(c => c.id === selectedCalfId) ?? null;

  const filteredCalves = useMemo(
    () => statusFilter ? calves.filter(c => c.status === statusFilter) : calves,
    [calves, statusFilter]
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <HerdOverview stats={stats} />
      <StatusBar stats={stats} activeFilter={statusFilter} onFilterChange={setStatusFilter} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <h2 className="font-heading font-semibold text-lg mb-4">
            Calves
            {statusFilter && (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                — showing {filteredCalves.length} {statusFilter}
              </span>
            )}
          </h2>
          {filteredCalves.length === 0 ? (
            <div className="glass-card rounded-lg p-8 text-center text-muted-foreground">
              <p>{statusFilter ? `No ${statusFilter} calves found.` : 'No calves registered yet. Go to Tag Management to add your first calf.'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredCalves.map(calf => (
                <CalfCard key={calf.id} calf={calf} onClick={() => setSelectedCalfId(calf.id)} />
              ))}
            </div>
          )}
        </div>
        <div>
          <AlertPanel alerts={allAlerts} />
        </div>
      </div>

      <CalfDetailDialog
        calf={selectedCalf}
        open={!!selectedCalfId}
        onOpenChange={(open) => !open && setSelectedCalfId(null)}
      />
    </div>
  );
};

export default Index;
