import { useState } from 'react';
import { mockCalves, CalfTag, CalfGender } from '@/data/mockCalves';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, Trash2, Tag, Battery, Signal } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
  gender: CalfGender;
  age: string;
  notes: string;
}

const emptyForm: TagFormData = { tagId: '', tagMac: '', calfNumber: '', gender: 'female', age: '', notes: '' };

const TagManagement = () => {
  const { toast } = useToast();
  const [tags, setTags] = useState<CalfTag[]>([...mockCalves]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [form, setForm] = useState<TagFormData>(emptyForm);

  const openAdd = () => {
    setEditingTag(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (tag: CalfTag) => {
    setEditingTag(tag.tagId);
    setForm({
      tagId: tag.tagId,
      tagMac: tag.tagMac,
      calfNumber: String(tag.calfNumber),
      gender: tag.gender,
      age: tag.age,
      notes: tag.notes || '',
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.tagId || !form.tagMac || !form.calfNumber) {
      toast({ title: 'Missing fields', description: 'Tag ID, MAC, and Calf Number are required.', variant: 'destructive' });
      return;
    }

    if (editingTag) {
      setTags(prev =>
        prev.map(t =>
          t.tagId === editingTag
            ? { ...t, tagId: form.tagId, tagMac: form.tagMac, calfNumber: Number(form.calfNumber), gender: form.gender, age: form.age, notes: form.notes }
            : t
        )
      );
      toast({ title: 'Tag updated', description: `Tag ${form.tagId} has been updated.` });
    } else {
      const newTag: CalfTag = {
        tagId: form.tagId,
        tagMac: form.tagMac,
        calfNumber: Number(form.calfNumber),
        gender: form.gender,
        age: form.age,
        status: 'offline',
        temperature: 0,
        temperatureHistory: [],
        activity: 'inactive',
        motionState: 0,
        rssi: 0,
        batteryMv: 0,
        lastSeen: 'Never',
        alerts: [],
        dailyActivityMinutes: 0,
        dailyRestMinutes: 0,
        notes: form.notes,
      };
      setTags(prev => [...prev, newTag]);
      toast({ title: 'Tag added', description: `Tag ${form.tagId} has been registered.` });
    }
    setDialogOpen(false);
  };

  const handleDelete = (tagId: string) => {
    setTags(prev => prev.filter(t => t.tagId !== tagId));
    toast({ title: 'Tag removed', description: `Tag ${tagId} has been deleted.` });
  };

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
              <TableHead>Tag ID</TableHead>
              <TableHead>Calf #</TableHead>
              <TableHead>Gender</TableHead>
              <TableHead>MAC Address</TableHead>
              <TableHead>Age</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Battery</TableHead>
              <TableHead>Signal</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tags.map(tag => (
              <TableRow key={tag.tagId}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                    {tag.tagId}
                  </div>
                </TableCell>
                <TableCell className="font-heading font-semibold">#{tag.calfNumber}</TableCell>
                <TableCell>{tag.gender === 'male' ? '♂ Male' : '♀ Female'}</TableCell>
                <TableCell className="font-mono text-xs">{tag.tagMac}</TableCell>
                <TableCell>{tag.age}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={statusColors[tag.status]}>
                    {tag.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {tag.batteryMv > 0 ? (
                    <div className="flex items-center gap-1">
                      <Battery className="h-3.5 w-3.5 text-muted-foreground" />
                      {batteryPercent(tag.batteryMv)}%
                    </div>
                  ) : '—'}
                </TableCell>
                <TableCell>
                  {tag.rssi !== 0 ? (
                    <div className="flex items-center gap-1">
                      <Signal className="h-3.5 w-3.5 text-muted-foreground" />
                      {tag.rssi} dBm
                    </div>
                  ) : '—'}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(tag)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(tag.tagId)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {tags.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
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
            <DialogTitle className="font-heading">{editingTag ? 'Edit Tag' : 'Register New Tag'}</DialogTitle>
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
                <Select value={form.gender} onValueChange={(v: CalfGender) => setForm(f => ({ ...f, gender: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="female">♀ Female</SelectItem>
                    <SelectItem value="male">♂ Male</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Age</Label>
              <Input placeholder="3 weeks" value={form.age} onChange={e => setForm(f => ({ ...f, age: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Input placeholder="Any additional notes..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editingTag ? 'Save Changes' : 'Add Tag'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TagManagement;
