import { useLayoutConfig, LayoutMode } from '@/contexts/LayoutConfigContext';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RotateCcw, Layout, Globe, PanelLeft, Navigation } from 'lucide-react';

const ColorInput = ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => (
  <div className="flex items-center justify-between gap-4">
    <Label className="text-sm text-muted-foreground flex-1">{label}</Label>
    <div className="flex items-center gap-2">
      <div
        className="h-8 w-8 rounded-md border border-border cursor-pointer flex-shrink-0"
        style={{ backgroundColor: value }}
      >
        <input
          type="color"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full h-full opacity-0 cursor-pointer"
        />
      </div>
      <Input
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-24 h-8 text-xs font-mono"
      />
    </div>
  </div>
);

const SectionHeader = ({ icon: Icon, title }: { icon: React.ElementType; title: string }) => (
  <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border">
    <Icon className="h-4 w-4 text-primary" />
    <h3 className="font-heading font-semibold text-base">{title}</h3>
  </div>
);

const layoutModes: { value: LayoutMode; label: string; desc: string }[] = [
  { value: 'default', label: 'Default', desc: 'Sidebar + top bar' },
  { value: 'classic', label: 'Classic', desc: 'Traditional sidebar layout' },
  { value: 'single-column', label: 'Single Column', desc: 'Content centered' },
  { value: 'double-column', label: 'Double Column', desc: 'Split panel layout' },
];

export const LayoutConfiguration = () => {
  const { config, updateConfig, resetConfig } = useLayoutConfig();

  return (
    <div className="space-y-6">
      {/* Layout Mode */}
      <div className="glass-card rounded-lg p-6">
        <SectionHeader icon={Layout} title="Layout Mode" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {layoutModes.map(mode => (
            <button
              key={mode.value}
              onClick={() => updateConfig('layoutMode', mode.value)}
              className={`p-3 rounded-lg border-2 text-left transition-all ${
                config.layoutMode === mode.value
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-muted-foreground/30'
              }`}
            >
              <p className="font-medium text-sm">{mode.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{mode.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Global */}
      <div className="glass-card rounded-lg p-6">
        <SectionHeader icon={Globe} title="Global" />
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm">Dark Mode</Label>
              <p className="text-xs text-muted-foreground">Switch between light and dark themes</p>
            </div>
            <Switch
              checked={config.darkMode}
              onCheckedChange={v => updateConfig('darkMode', v)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm">Page Switching Animation</Label>
              <p className="text-xs text-muted-foreground">Animate background when switching pages</p>
            </div>
            <Switch
              checked={config.pageTransition}
              onCheckedChange={v => updateConfig('pageTransition', v)}
            />
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="glass-card rounded-lg p-6">
        <SectionHeader icon={PanelLeft} title="Sidebar" />
        <div className="space-y-5">
          <ColorInput
            label="Background color"
            value={config.sidebarBg}
            onChange={v => updateConfig('sidebarBg', v)}
          />
          <ColorInput
            label="Text color"
            value={config.sidebarTextColor}
            onChange={v => updateConfig('sidebarTextColor', v)}
          />
          <ColorInput
            label="Active item background"
            value={config.sidebarActiveBg}
            onChange={v => updateConfig('sidebarActiveBg', v)}
          />
          <ColorInput
            label="Active item text color"
            value={config.sidebarActiveTextColor}
            onChange={v => updateConfig('sidebarActiveTextColor', v)}
          />

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm">Show Logo Bar</Label>
              <p className="text-xs text-muted-foreground">Display the top bar with logo</p>
            </div>
            <Switch
              checked={config.showSidebarHeader}
              onCheckedChange={v => updateConfig('showSidebarHeader', v)}
            />
          </div>

          <ColorInput
            label="Logo bar background"
            value={config.sidebarHeaderBg}
            onChange={v => updateConfig('sidebarHeaderBg', v)}
          />

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm text-muted-foreground">Width (unfolded)</Label>
              <span className="text-xs font-mono text-muted-foreground">{config.sidebarWidth}px</span>
            </div>
            <Slider
              value={[config.sidebarWidth]}
              onValueChange={([v]) => updateConfig('sidebarWidth', v)}
              min={200}
              max={400}
              step={4}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label className="text-sm text-muted-foreground">Default icon style</Label>
            <Select
              value={config.sidebarDefaultIcon}
              onValueChange={(v: 'lucide' | 'circle' | 'dot') => updateConfig('sidebarDefaultIcon', v)}
            >
              <SelectTrigger className="w-32 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lucide">Lucide Icons</SelectItem>
                <SelectItem value="circle">Circles</SelectItem>
                <SelectItem value="dot">Dots</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm">Collapsed by Default</Label>
              <p className="text-xs text-muted-foreground">Start with sidebar collapsed</p>
            </div>
            <Switch
              checked={config.sidebarCollapsed}
              onCheckedChange={v => updateConfig('sidebarCollapsed', v)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm">Accordion Mode</Label>
              <p className="text-xs text-muted-foreground">Only one group open at a time</p>
            </div>
            <Switch
              checked={config.sidebarAccordion}
              onCheckedChange={v => updateConfig('sidebarAccordion', v)}
            />
          </div>
        </div>
      </div>

      {/* Top Bar */}
      <div className="glass-card rounded-lg p-6">
        <SectionHeader icon={Navigation} title="Top Bar" />
        <div className="space-y-5">
          <ColorInput
            label="Background color"
            value={config.topbarBg}
            onChange={v => updateConfig('topbarBg', v)}
          />
          <ColorInput
            label="Text color"
            value={config.topbarTextColor}
            onChange={v => updateConfig('topbarTextColor', v)}
          />
          <ColorInput
            label="Hover background"
            value={config.topbarHoverBg}
            onChange={v => updateConfig('topbarHoverBg', v)}
          />
          <ColorInput
            label="Active item background"
            value={config.topbarActiveBg}
            onChange={v => updateConfig('topbarActiveBg', v)}
          />
          <ColorInput
            label="Active item text color"
            value={config.topbarActiveTextColor}
            onChange={v => updateConfig('topbarActiveTextColor', v)}
          />
        </div>
      </div>

      {/* Reset */}
      <div className="flex justify-end">
        <Button variant="outline" onClick={resetConfig} className="gap-2">
          <RotateCcw className="h-4 w-4" />
          Reset to Defaults
        </Button>
      </div>
    </div>
  );
};
