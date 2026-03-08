import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { LayoutConfigProvider, useLayoutConfig } from "@/contexts/LayoutConfigContext";
import Index from "./pages/Index";
import Calves from "./pages/Calves";
import TagManagement from "./pages/TagManagement";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import { Wifi, LogOut, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProfilePopover } from "@/components/ProfilePopover";

const queryClient = new QueryClient();

const ProtectedLayout = ({ children }: { children: React.ReactNode }) => {
  const { signOut } = useAuth();
  const { config } = useLayoutConfig();

  const isSingleColumn = config.layoutMode === 'single-column';

  return (
    <SidebarProvider defaultOpen={!config.sidebarCollapsed}>
      <div className="min-h-screen flex w-full">
        {!isSingleColumn && <AppSidebar />}
        <div className="flex-1 flex flex-col min-w-0">
          <header
            className="h-14 flex items-center justify-between border-b sticky top-0 z-10 px-4 backdrop-blur-sm"
            style={{
              backgroundColor: config.topbarBg,
              color: config.topbarTextColor,
            }}
          >
            {!isSingleColumn && <SidebarTrigger style={{ color: config.topbarTextColor }} />}
            {isSingleColumn && <div />}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-success/10 text-success">
                <Wifi className="h-3.5 w-3.5" />
                <span className="font-medium text-xs">Gateway Online</span>
              </div>
              <ProfilePopover textColor={config.topbarTextColor} />
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                style={{ color: config.topbarTextColor }}
                onClick={signOut}
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </header>
          <main
            className={`flex-1 p-6 ${config.pageTransition ? 'animate-in fade-in duration-300' : ''}`}
          >
            {config.layoutMode === 'double-column' ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="col-span-full">{children}</div>
              </div>
            ) : isSingleColumn ? (
              <div className="max-w-4xl mx-auto">{children}</div>
            ) : (
              children
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

const AppRoutes = () => {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <ProtectedLayout>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/calves" element={<Calves />} />
        <Route path="/tags" element={<TagManagement />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </ProtectedLayout>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <LayoutConfigProvider>
            <AppRoutes />
          </LayoutConfigProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
