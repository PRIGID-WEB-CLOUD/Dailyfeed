
'use client';

import type { ReactNode } from 'react';
import { PublicHeader } from '@/components/blog/public-header';
import { PublicFooter } from '@/components/blog/public-footer';
import { ExpandableBanner } from '@/components/expandable-banner';

export default function PublicLayout({ children }: { children: ReactNode }) {
  // Providers are now handled in the root layout (src/app/layout.tsx)
  // to ensure a single source of truth for settings and banner content.
  return (
    <>
      <ExpandableBanner />
      <PublicHeader />
      <div className="flex-1">{children}</div>
      <PublicFooter />
    </>
  );
}
