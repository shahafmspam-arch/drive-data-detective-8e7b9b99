import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Loader2, AlertTriangle, Settings2, Wrench, Gauge } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LayoutConfiguration } from '@/components/LayoutConfiguration';
import { ThresholdConfiguration } from '@/components/ThresholdConfiguration';

const Settings = () => {
  const { session } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [clearing, setClearing] = useState(false);
  const userId = session?.user?.id;

  const handleClearAllData = async () => {
    if (!userId) return;
    setClearing(true);
    try {
      const { data: calves } = await supabase.from('calves').select('id').eq('user_id', userId);
      const calfIds = calves?.map(c => c.id) || [];

      if (calfIds.length > 0) {
        await supabase.from('alerts').delete().in('calf_id', calfIds);
        await supabase.from('telemetry').delete().in('calf_id', calfIds);
      }
      const { error } = await supabase.from('calves').delete().eq('user_id', userId);
      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['calves', userId] });
      toast({ title: 'Data cleared', description: 'All calves, telemetry, and alerts have been deleted.' });
      setConfirmOpen(false);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading font-bold text-2xl">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your farm configuration and layout preferences</p>
      </div>

      <Tabs defaultValue="thresholds" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="thresholds" className="gap-2">
            <Gauge className="h-4 w-4" />
            Thresholds
          </TabsTrigger>
          <TabsTrigger value="configuration" className="gap-2">
            <Settings2 className="h-4 w-4" />
            Layout
          </TabsTrigger>
          <TabsTrigger value="account" className="gap-2">
            <Wrench className="h-4 w-4" />
            Account & Data
          </TabsTrigger>
        </TabsList>

        <TabsContent value="thresholds">
          <ThresholdConfiguration />
        </TabsContent>

        <TabsContent value="configuration">
          <LayoutConfiguration />
        </TabsContent>

        <TabsContent value="account" className="space-y-6">
          <div className="glass-card rounded-lg p-6 space-y-4">
            <div>
              <h2 className="font-heading font-semibold text-lg">Account</h2>
              <p className="text-sm text-muted-foreground">{session?.user?.email}</p>
            </div>
          </div>

          <div className="glass-card rounded-lg p-6 border-destructive/20">
            <h2 className="font-heading font-semibold text-lg text-destructive mb-2">Danger Zone</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Clear all calves, telemetry readings, and alerts from your account. This action cannot be undone.
            </p>
            <Button variant="destructive" onClick={() => setConfirmOpen(true)} className="gap-2">
              <Trash2 className="h-4 w-4" />
              Clear All Data
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-heading flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Confirm Data Deletion
            </DialogTitle>
            <DialogDescription>
              This will permanently delete <strong>all calves, telemetry history, and alerts</strong> from your account. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={clearing}>Cancel</Button>
            <Button variant="destructive" onClick={handleClearAllData} disabled={clearing} className="gap-2">
              {clearing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Yes, Delete Everything
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Settings;
