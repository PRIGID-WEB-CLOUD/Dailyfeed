
'use client';

import type { ReactNode } from 'react';
import React, { useState, useEffect } from 'react';
import Script from 'next/script';
import { usePathname } from 'next/navigation';
import './globals.css';
import { Toaster as OldToaster } from '@/components/ui/toaster';
import { Toaster as SonnerToaster } from '@/components/ui/sonner';
import { AdminSubscriptionProvider, useAdminSubscription } from '@/hooks/use-subscription';
import { PublicSubscriptionProvider, usePublicSubscription } from '@/hooks/use-public-subscription';
import { SettingsProvider, useSettings } from '@/contexts/settings-context';
import { BannerProvider } from '@/contexts/banner-context';
import { IntegrationsProvider, useIntegrations } from '@/contexts/integrations-context';
import { ThemeProvider } from '@/components/theme-provider';
import { Loader2 } from 'lucide-react';


function DynamicStyles() {
  const { settings } = useSettings();
  const { primaryColor, backgroundColor, accentColor } = settings.appearance;

  const css = `
    :root {
      --primary: ${primaryColor};
      --background: ${backgroundColor};
      --accent: ${accentColor};
    }
    .dark {
      /* You might want to define dark theme adjustments here or in settings */
    }
  `;

  return <style>{css}</style>;
}

function AnalyticsScripts() {
  const { getIntegration } = useIntegrations();
  const gaIntegration = getIntegration('google-analytics');

  if (!gaIntegration?.connected || !gaIntegration.credentials?.trackingId) {
    return null;
  }

  const gaId = gaIntegration.credentials.trackingId;

  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${gaId}');
          `,
        }}
      />
    </>
  );
}


function AppProviders({ children }: { children: ReactNode }) {
  const { isLoading: isAdminLoading } = useAdminSubscription();
  const { isLoading: isPublicLoading } = usePublicSubscription();
  const [isClient, setIsClient] = useState(false);
  const pathname = usePathname();
  const isAdminPage = pathname.startsWith('/admin');

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Admin routes only need the admin auth check. Waiting for the public
  // profile listener here can blank the entire admin app if that stream fails.
  const showLoader = isClient && (isAdminPage ? isAdminLoading : isPublicLoading);

  if (showLoader) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  const content = (
    <SettingsProvider>
      <BannerProvider>
          <DynamicStyles />
          <div className="flex min-h-screen flex-col">
            {children}
          </div>
          <OldToaster />
          <SonnerToaster />
      </BannerProvider>
    </SettingsProvider>
  );

  // Conditionally wrap with ThemeProvider only for non-admin pages
  if (!isAdminPage) {
    return (
       <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
         {content}
       </ThemeProvider>
    );
  }

  return content;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AdminSubscriptionProvider>
      <PublicSubscriptionProvider>
        <IntegrationsProvider>
            <html lang="en" suppressHydrationWarning>
              <head>
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=PT+Sans:wght@400;700&display=swap" rel="stylesheet" />
                <AnalyticsScripts />
              </head>
              <body className="font-body antialiased">
                <AppProviders>
                  {children}
                </AppProviders>
              </body>
            </html>
        </IntegrationsProvider>
      </PublicSubscriptionProvider>
    </AdminSubscriptionProvider>
  );
}
