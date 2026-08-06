
'use client';

import { useState } from 'react';
import { ChevronDown, X, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Skeleton } from './ui/skeleton';
import { useSettings } from '@/contexts/settings-context';

export function ExpandableBanner() {
  const { settings, isLoading } = useSettings();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isClosed, setIsClosed] = useState(false);

  const bannerContent = settings.banner;

  if (isClosed) {
    return null;
  }

  return (
    <div
      className={cn(
        'relative bg-primary text-primary-foreground transition-all duration-300 ease-in-out',
        isExpanded ? 'h-40' : 'h-12'
      )}
    >
      <div className="mx-auto flex h-full max-w-7xl items-center justify-center px-4">
        <div className="flex items-center gap-4">
          <Zap className="hidden h-6 w-6 flex-shrink-0 sm:block" />
          {isLoading ? (
            <Skeleton className="h-5 w-96 bg-primary/50" />
          ) : (
            <p className="text-center text-sm font-medium">
              <span className="font-semibold">{bannerContent.headline}</span>
              {isExpanded
                ? bannerContent.expandedText
                : bannerContent.collapsedText}
            </p>
          )}
        </div>
      </div>

      <div className="absolute right-4 top-1/2 -translate-y-1/2">
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-primary-foreground hover:bg-primary/80 hover:text-primary-foreground"
            onClick={() => setIsExpanded(!isExpanded)}
            disabled={isLoading}
          >
            <ChevronDown
              className={cn(
                'h-5 w-5 transition-transform duration-300',
                isExpanded && 'rotate-180'
              )}
            />
            <span className="sr-only">{isExpanded ? 'Collapse' : 'Expand'}</span>
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-primary-foreground hover:bg-primary/80 hover:text-primary-foreground"
            onClick={() => setIsClosed(true)}
            disabled={isLoading}
          >
            <X className="h-5 w-5" />
            <span className="sr-only">Close banner</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
