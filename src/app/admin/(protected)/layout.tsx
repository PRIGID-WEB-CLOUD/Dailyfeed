'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminSubscription } from '@/hooks/use-subscription';
import { Loader2 } from 'lucide-react';
import {
  SidebarProvider,
  Sidebar,
  SidebarInset,
  SidebarRail,
} from '@/components/ui/sidebar';
import { Nav } from '@/components/nav';
import { Header } from '@/components/header';
import type { ReactNode } from 'react';
import { SettingsProvider } from '@/contexts/settings-context';
import { BannerProvider } from '@/contexts/banner-context';
import { IntegrationsProvider } from '@/contexts/integrations-context';

export default function ProtectedAdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const {
    isAuthenticated,
    isLoading,
    user,
    logout,
  } = useAdminSubscription();

  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/admin/login');
    }
  }, [isLoading, isAuthenticated, router]);

  const handleLogout = async () => {
    await logout();
    router.replace('/admin/login');
  };

  /*
   * Keep the authentication loading state isolated.
   * Do not render the admin shell until the authentication
   * state and user profile are available.
   */
  if (isLoading || !isAuthenticated || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <IntegrationsProvider>
      <SettingsProvider>
        <BannerProvider>
          <SidebarProvider>
            <div className="flex h-screen w-full min-w-0 admin-dark">
              
              {/* Admin Sidebar */}
              <Sidebar>
                <Nav />
                <SidebarRail />
              </Sidebar>

              {/* Main Application Area */}
              <SidebarInset className="min-w-0 flex-1 overflow-x-hidden">
                
                {/* Admin Header */}
                <Header
                  user={user}
                  onLogout={handleLogout}
                />

                {/* Page Content */}
                <main className="min-w-0 flex-1 overflow-x-hidden p-3 sm:p-6">
                  {children}
                </main>

              </SidebarInset>
            </div>
          </SidebarProvider>
        </BannerProvider>
      </SettingsProvider>
    </IntegrationsProvider>
  );
}    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <IntegrationsProvider>
      <SettingsProvider>
        <BannerProvider>
          <SidebarProvider>
            <div className="flex h-screen min-w-0 admin-dark">
              <Sidebar>
                <Nav />
                <SidebarRail />
              </Sidebar>
              <SidebarInset className="w-0 min-w-0 max-w-full flex-1 overflow-x-hidden">
                <Header user={user} onLogout={handleLogout} />
                <main className="w-full min-w-0 max-w-full flex-1 overflow-x-hidden p-3 sm:p-6">{children}</main>
              </SidebarInset>
            </div>
          </SidebarProvider>
        </BannerProvider>
      </SettingsProvider>
    </IntegrationsProvider>
  );
}
