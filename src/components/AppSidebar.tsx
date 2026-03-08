import { LayoutDashboard, Tags, Settings, Heart, Beef, Circle } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useLocation } from 'react-router-dom';
import { useLayoutConfig } from '@/contexts/LayoutConfigContext';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from '@/components/ui/sidebar';

const menuItems = [
  { title: 'Overview', url: '/', icon: LayoutDashboard },
  { title: 'Calves', url: '/calves', icon: Beef },
  { title: 'Tag Management', url: '/tags', icon: Tags },
  { title: 'Settings', url: '/settings', icon: Settings },
];

const DotIcon = ({ className }: { className?: string }) => (
  <div className={`h-2 w-2 rounded-full bg-current ${className || ''}`} />
);

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const { config } = useLayoutConfig();

  const getIcon = (item: typeof menuItems[0]) => {
    if (config.sidebarDefaultIcon === 'circle') return Circle;
    if (config.sidebarDefaultIcon === 'dot') return DotIcon as any;
    return item.icon;
  };

  return (
    <Sidebar
      collapsible="icon"
      className="border-r"
      style={{
        '--sidebar-width': `${config.sidebarWidth}px`,
      } as React.CSSProperties}
    >
      <div
        className="h-full flex flex-col"
        style={{
          backgroundColor: config.sidebarBg,
          color: config.sidebarTextColor,
        }}
      >
        {config.showSidebarHeader && (
          <SidebarHeader className="p-4" style={{ backgroundColor: config.sidebarHeaderBg }}>
            <div className="flex items-center gap-3">
              <div
                className="p-2 rounded-lg flex-shrink-0"
                style={{ backgroundColor: config.sidebarActiveTextColor + '20', color: config.sidebarActiveTextColor }}
              >
                <Heart className="h-5 w-5" />
              </div>
              {!collapsed && (
                <div>
                  <h1 className="font-heading font-bold text-base" style={{ color: config.sidebarTextColor }}>CalfWatch</h1>
                  <p className="text-[10px]" style={{ color: config.sidebarTextColor + '99' }}>BLE Health Monitor</p>
                </div>
              )}
            </div>
          </SidebarHeader>
        )}
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel style={{ color: config.sidebarTextColor + '80' }}>Navigation</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {menuItems.map((item) => {
                  const IconComp = getIcon(item);
                  const isActive = item.url === '/'
                    ? location.pathname === '/'
                    : location.pathname.startsWith(item.url);

                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink
                          to={item.url}
                          end={item.url === '/'}
                          className="transition-colors rounded-md"
                          activeClassName=""
                          style={{
                            backgroundColor: isActive ? config.sidebarActiveBg : 'transparent',
                            color: isActive ? config.sidebarActiveTextColor : config.sidebarTextColor,
                          }}
                        >
                          <IconComp className="mr-2 h-4 w-4" />
                          {!collapsed && <span>{item.title}</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </div>
    </Sidebar>
  );
}
