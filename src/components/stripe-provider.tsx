
'use client';

import { ReactNode, useMemo } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { useIntegrations } from '@/contexts/integrations-context';
import { Loader2 } from 'lucide-react';

export function StripeProvider({ children }: { children: ReactNode }) {
  const { getIntegration, loading: isIntegrationsLoading } = useIntegrations();

  const stripePromise = useMemo(() => {
    if (isIntegrationsLoading) return null;
    
    const stripeIntegration = getIntegration('stripe');
    
    if (stripeIntegration?.connected && stripeIntegration.credentials?.publicKey) {
      return loadStripe(stripeIntegration.credentials.publicKey);
    }
    
    return null;
  }, [isIntegrationsLoading, getIntegration]);

  if (isIntegrationsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!stripePromise) {
    // If Stripe isn't configured, just render children without the provider.
    // Certain components might not work, but the app won't crash.
    return <>{children}</>;
  }

  return (
    <Elements stripe={stripePromise}>
      {children}
    </Elements>
  );
}
