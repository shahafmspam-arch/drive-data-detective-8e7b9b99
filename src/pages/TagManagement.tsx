import { useState, useMemo } from 'react';
import { useCalves, CalfWithTelemetry } from '@/hooks/useCalves';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, Trash2, Tag, Battery, Signal, Loader2, CalendarIcon, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { calcAge } from '@/lib/calcAge';

const batteryPercent = (mv: number) => Math.min(100, Math.max(0, Math.round(((mv - 2000) / 1400) * 100)));

const statusColors: Record<string, string> = {
  healthy: 'bg-success/15 text-success border-success/30',
  warning: 'bg-warning/15 text-warning-foreground border-warning/30',
  critical: 'bg-destructive/15 text-destructive border-destructive/30',
  offline: 'bg-muted text-muted-foreground border-muted',
};

interface TagFormData {
  tagId: string;
  tagMac: string;
  calfNumber: string;
  gender: 'male' | 'female';
  birthDate: Date | undefined;
  notes: string;
}

const emptyForm: TagFormData = { tagId: '', tagMac: '', calfNumber: '', gender: 'female', birthDate: undefined, notes: '' };

type SortKey = 'tag_id' | 'calf_number' | 'gender' | 'birth_date' | 'status' | 'battery_mv' | 'rssi';
type SortDir = 'asc' | 'desc';

const statusOrder: Record<string, number> = { critical: 0, warning: 1, healthy: 2, offline: 3 };

function sortTags(calves: CalfWithTelemetry[], key: SortKey, dir: SortDir): CalfWithTelemetry[] {
  return [...calves].sort((a, b) => {
    let cmp = 0;
    switch (key) {
      case 'tag_id': cmp = a.tag_id.localeCompare(b.tag_id); break;
      case 'calf_number': cmp = a.calf_number - b.calf_number; break;
      case 'gender': cmp = a.gender.localeCompare(b.gender); break;
      case 'birth_date': cmp = (a.birth_date || '').localeCompare(b.birth_date || ''); break;
      case 'status': cmp = (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9); break;
      case 'battery_mv': cmp = a.battery_mv - b.battery_mv; break;
      case 'rssi': cmp = a.rssi - b.rssi; break;
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

const TagManagement = () => {
  const { toast } = useToast();
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const { calves, isLoading } = useCalves();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<TagFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>('calf_number');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const handleSort = (key: SortKey) => {
    if (key === sortKey) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const sorted = useMemo(() => sortTags(calves, sortKey, sortDir), [calves, sortKey, sortDir]);
  const headProps = { currentKey: sortKey, currentDir: sortDir, onSort: handleSort };

  const userId = session?.user?.id;

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (calf: CalfWithTelemetry) => {
    setEditingId(calf.id);
    setForm({
      tagId: calf.tag_id,
      tagMac: calf.tag_mac,
      calfNumber: String(calf.calf_number),
      gender: calf.gender,
      birthDate: calf.birth_date ? new Date(calf.birth_date) : undefined,
      notes: calf.notes || '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.tagId || !form.tagMac || !form.calfNumber || !userId) {
      toast({ title: 'Missing fields', description: 'Tag ID, MAC, and Calf Number are required.', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const birthDateStr = form.birthDate ? format(form.birthDate, 'yyyy-MM-dd') : null;

      if (editingId) {
        const { error } = await supabase.from('calves').update({
          tag_id: form.tagId,
          tag_mac: form.tagMac,
          calf_number: Number(form.calfNumber),
          gender: form.gender,
          birth_date: birthDateStr,
          age: form.birthDate ? calcAge(form.birthDate) : null,
          notes: form.notes || null,
        }).eq('id', editingId);

        if (error) throw error;
        toast({ title: 'Tag updated', description: `Tag ${form.tagId} has been updated.` });
      } else {
        const { error } = await supabase.from('calves').insert({
          user_id: userId,
          tag_id: form.tagId,
          tag_mac: form.tagMac,
          calf_number: Number(form.calfNumber),
          gender: form.gender,
          birth_date: birthDateStr,
          age: form.birthDate ? calcAge(form.birthDate) : null,
          notes: form.notes || null,
        });

        if (error) throw error;
        toast({ title: 'Tag added', description: `Tag ${form.tagId} has been registered.` });
      }

      queryClient.invalidateQueries({ queryKey: ['calves', userId] });
      setDialogOpen(false);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (calf: CalfWithTelemetry) => {
    const { error } = await supabase.from('calves').delete().eq('id', calf.id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }
    queryClient.invalidateQueries({ queryKey: ['calves', userId] });
    toast({ title: 'Tag removed', description: `Tag ${calf.tag_id} has been deleted.` });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading font-bold text-2xl">Tag Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Register and manage BLE tags assigned to calves</p>
        </div>
        <Button onClick={openAdd} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Tag
        </Button>
      </div>

      <div className="glass-card rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableHead label="Tag ID" sortKey="tag_id" {...headProps} />
              <SortableHead label="Calf #" sortKey="calf_number" {...headProps} />
              <SortableHead label="Gender" sortKey="gender" {...headProps} />
              <TableHead>MAC Address</TableHead>
              <SortableHead label="Birth Date" sortKey="birth_date" {...headProps} />
              <TableHead>Age</TableHead>
              <SortableHead label="Status" sortKey="status" {...headProps} />
              <SortableHead label="Battery" sortKey="battery_mv" {...headProps} />
              <SortableHead label="Signal" sortKey="rssi" {...headProps} />
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {calves.map(calf => (
              <TableRow key={calf.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                    {calf.tag_id}
                  </div>
                </TableCell>
                <TableCell className="font-heading font-semibold">#{calf.calf_number}</TableCell>
                <TableCell>{calf.gender === 'male' ? '♂ Male' : '♀ Female'}</TableCell>
                <TableCell className="font-mono text-xs">{calf.tag_mac}</TableCell>
                <TableCell className="text-sm">
                  {calf.birth_date ? format(new Date(calf.birth_date), 'MMM d, yyyy') : '—'}
                </TableCell>
                <TableCell>{calf.birth_date ? calcAge(calf.birth_date) : (calf.age || 'N/A')}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={statusColors[calf.status]}>
                    {calf.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {calf.battery_mv > 0 ? (
                    <div className="flex items-center gap-1">
                      <Battery className="h-3.5 w-3.5 text-muted-foreground" />
                      {batteryPercent(calf.battery_mv)}%
                    </div>
                  ) : '—'}
                </TableCell>
                <TableCell>
                  {calf.rssi !== 0 ? (
                    <div className="flex items-center gap-1">
                      <Signal className="h-3.5 w-3.5 text-muted-foreground" />
                      {calf.rssi} dBm
                    </div>
                  ) : '—'}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(calf)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(calf)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {calves.length === 0 && (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                  No tags registered. Click "Add Tag" to get started.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-heading">{editingId ? 'Edit Tag' : 'Register New Tag'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tag ID</Label>
                <Input placeholder="TAG-0009" value={form.tagId} onChange={e => setForm(f => ({ ...f, tagId: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Calf Number</Label>
                <Input type="number" placeholder="109" value={form.calfNumber} onChange={e => setForm(f => ({ ...f, calfNumber: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>MAC Address</Label>
                <Input placeholder="f0c812210809" value={form.tagMac} onChange={e => setForm(f => ({ ...f, tagMac: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Gender</Label>
                <Select value={form.gender} onValueChange={(v: 'male' | 'female') => setForm(f => ({ ...f, gender: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="female">♀ Female</SelectItem>
                    <SelectItem value="male">♂ Male</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Birth Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !form.birthDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {form.birthDate ? (
                      <>
                        {format(form.birthDate, 'PPP')}
                        <span className="ml-auto text-xs text-muted-foreground">{calcAge(form.birthDate)}</span>
                      </>
                    ) : (
                      <span>Pick birth date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={form.birthDate}
                    onSelect={(date) => setForm(f => ({ ...f, birthDate: date }))}
                    disabled={(date) => date > new Date()}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Input placeholder="Any additional notes..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingId ? 'Save Changes' : 'Add Tag'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TagManagement;
