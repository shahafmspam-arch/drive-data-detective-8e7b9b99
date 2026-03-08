import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';
import { User, Loader2, Check } from 'lucide-react';

export function ProfilePopover({ textColor }: { textColor?: string }) {
  const { profile, loading, updateProfile } = useProfile();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [farmName, setFarmName] = useState('');
  const [saving, setSaving] = useState(false);

  const handleOpen = (isOpen: boolean) => {
    if (isOpen && profile) {
      setDisplayName(profile.display_name || '');
      setFarmName(profile.farm_name || '');
    }
    setOpen(isOpen);
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = (await updateProfile({
      display_name: displayName.trim() || null,
      farm_name: farmName.trim() || 'My Farm',
    })) || {};
    setSaving(false);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Profile updated' });
      setOpen(false);
    }
  };

  if (loading) return null;

  const label = profile?.display_name || profile?.farm_name || 'Profile';

  return (
    <Popover open={open} onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5 text-xs font-medium max-w-[160px]"
          style={{ color: textColor }}
        >
          <User className="h-3.5 w-3.5 flex-shrink-0" />
          <span className="truncate">{label}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72" align="end">
        <div className="space-y-3">
          <h4 className="font-heading font-semibold text-sm">Edit Profile</h4>
          <div className="space-y-1.5">
            <Label htmlFor="prof-name" className="text-xs">Display Name</Label>
            <Input
              id="prof-name"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="Your name"
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="prof-farm" className="text-xs">Farm Name</Label>
            <Input
              id="prof-farm"
              value={farmName}
              onChange={e => setFarmName(e.target.value)}
              placeholder="My Farm"
              className="h-8 text-sm"
            />
          </div>
          <Button size="sm" className="w-full gap-1.5" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            Save
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
