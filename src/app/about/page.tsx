
'use client';

import { PublicPage } from '@/components/blog/public-page';
import { useSettings } from '@/contexts/settings-context';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect, useState } from 'react';
import { initialSettings } from '@/lib/initial-settings';


export default function AboutPage() {
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // On public pages, settings are not in context. We need to handle this gracefully.
    // For this demo, we'll use initialSettings as a fallback.
    // A production app might fetch this server-side or from a global state/cache.
    const settings = initialSettings; // Fallback to initial settings
    setContent(settings.staticPages.about);
    setIsLoading(false);
  }, []);

  return (
    <PublicPage title="About Us">
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-3/4" />
        </div>
      ) : (
        <div dangerouslySetInnerHTML={{ __html: content.replace(/\n/g, '<br />') || '' }} />
      )}
    </PublicPage>
  );
}
