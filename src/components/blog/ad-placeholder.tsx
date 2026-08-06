
'use client';

import { useIntegrations } from '@/contexts/integrations-context';
import { BadgeDollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AdPlaceholder() {
  const { integrations } = useIntegrations();
  
  const connectedAdProvider = integrations.find(
    (int) => int.category === 'Advertising' && int.connected
  );

  // Only render the ad placeholder if there's a connected provider.
  if (!connectedAdProvider) {
    return null;
  }

  const adProviderName = connectedAdProvider.name;

  return (
    <div className="my-8 flex items-center justify-center">
      <div
        className={cn(
          'flex h-[90px] w-[728px] max-w-full items-center justify-center rounded-lg border bg-muted/50 p-2'
        )}
      >
        <div className="flex w-full items-center justify-between text-center text-muted-foreground">
          <BadgeDollarSign className="ml-2 mr-4 h-8 w-8" />
          <div className="flex-grow text-left">
            <p className="text-sm font-semibold">{adProviderName}</p>
            <p className="text-xs">
              Sponsored Ad Slot
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
