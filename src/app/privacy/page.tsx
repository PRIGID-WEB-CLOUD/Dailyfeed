
'use client';
import { PublicPage } from '@/components/blog/public-page';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect, useState } from 'react';
import { initialSettings } from '@/lib/initial-settings';

export default function PrivacyPage() {
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // On public pages, settings are not in context. We need to handle this gracefully.
    const settings = initialSettings;
    setContent(settings.staticPages.privacy);
    setIsLoading(false);
  }, []);

  return (
    <PublicPage title="Privacy Policy">
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-6 w-full" />
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
