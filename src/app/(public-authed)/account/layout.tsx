
'use client';

import { PublicHeader } from '@/components/blog/public-header';
import { PublicFooter } from '@/components/blog/public-footer';
import type { ReactNode } from 'react';
import { ExpandableBanner } from '@/components/expandable-banner';
import { usePublicSubscription } from '@/hooks/use-public-subscription';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function AccountLayout({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = usePublicSubscription();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);
  
  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="bg-background text-foreground">
      <ExpandableBanner />
      <PublicHeader />
      <main className="w-full py-12">
        <div className="max-w-4xl mx-auto px-4 lg:px-6">
            {children}
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
