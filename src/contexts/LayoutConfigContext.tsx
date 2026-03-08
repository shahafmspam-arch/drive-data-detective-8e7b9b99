import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type LayoutMode = 'default' | 'classic' | 'single-column' | 'double-column';

export interface LayoutConfig {
  // Layout
  layoutMode: LayoutMode;

  // Global
  darkMode: boolean;
  pageTransition: boolean;

  // Sidebar
  sidebarBg: string;
  sidebarTextColor: string;
  sidebarActiveBg: string;
  sidebarActiveTextColor: string;
  showSidebarHeader: boolean;
  sidebarHeaderBg: string;
  sidebarWidth: number;
  sidebarDefaultIcon: 'lucide' | 'circle' | 'dot';
  sidebarCollapsed: boolean;
  sidebarAccordion: boolean;

  // Top bar
  topbarBg: string;
  topbarTextColor: string;
  topbarHoverBg: string;
  topbarActiveBg: string;
  topbarActiveTextColor: string;
}

const defaultConfig: LayoutConfig = {
  layoutMode: 'default',
  darkMode: false,
  pageTransition: true,
  sidebarBg: '#1a2e1a',
  sidebarTextColor: '#d4d8d0',
  sidebarActiveBg: '#2a3e2a',
  sidebarActiveTextColor: '#c89030',
  showSidebarHeader: true,
  sidebarHeaderBg: '#1a2e1a',
  sidebarWidth: 256,
  sidebarDefaultIcon: 'lucide',
  sidebarCollapsed: false,
  sidebarAccordion: false,
  topbarBg: '#fdfcfa',
  topbarTextColor: '#1a3a1a',
  topbarHoverBg: '#f0ede8',
  topbarActiveBg: '#e8e4dc',
  topbarActiveTextColor: '#1a3a1a',
};

const STORAGE_KEY = 'calfwatch-layout-config';

interface LayoutConfigContextType {
  config: LayoutConfig;
  updateConfig: <K extends keyof LayoutConfig>(key: K, value: LayoutConfig[K]) => void;
  resetConfig: () => void;
}

const LayoutConfigContext = createContext<LayoutConfigContextType>({
  config: defaultConfig,
  updateConfig: () => {},
  resetConfig: () => {},
});

export const useLayoutConfig = () => useContext(LayoutConfigContext);

export const LayoutConfigProvider = ({ children }: { children: React.ReactNode }) => {
  const [config, setConfig] = useState<LayoutConfig>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? { ...defaultConfig, ...JSON.parse(stored) } : defaultConfig;
    } catch {
      return defaultConfig;
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  }, [config]);

  // Apply dark mode
  useEffect(() => {
    document.documentElement.classList.toggle('dark', config.darkMode);
  }, [config.darkMode]);

  const updateConfig = useCallback(<K extends keyof LayoutConfig>(key: K, value: LayoutConfig[K]) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  }, []);

  const resetConfig = useCallback(() => {
    setConfig(defaultConfig);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <LayoutConfigContext.Provider value={{ config, updateConfig, resetConfig }}>
      {children}
    </LayoutConfigContext.Provider>
  );
};
