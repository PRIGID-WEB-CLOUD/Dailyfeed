
'use client';

import { PublicHeader } from '@/components/blog/public-header';
import { PublicFooter } from '@/components/blog/public-footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { ExpandableBanner } from '@/components/expandable-banner';
import { usePublicSubscription } from '@/hooks/use-public-subscription';
import { useSettings } from '@/contexts/settings-context';

const tiers = [
  {
    name: 'Premium',
    price: '$10',
    priceSuffix: '/ month',
    features: [
      'Unlimited access to all articles',
      'Exclusive premium content',
      'Ad-free reading experience',
      'Support independent writing',
    ],
    cta: 'Upgrade to Premium',
    isCurrent: false,
    href: '/login',
  },
];

export default function SubscribePage() {
  const { isAuthenticated, isLoading: isSubscriptionLoading } = usePublicSubscription();
  const { settings, isLoading: isSettingsLoading } = useSettings();

  const isLoading = isSubscriptionLoading || isSettingsLoading;
  const isPaymentConfigured = settings.paywall.enabled && settings.paywall.paymentProvider && settings.paywall.paymentProvider !== 'none';

  return (
    <div className="bg-background text-foreground">
      <ExpandableBanner />
      <PublicHeader />
      <main className="w-full py-12">
        <div className="max-w-4xl mx-auto px-4 lg:px-6">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold font-headline mt-4 mb-4">
              Choose Your Plan
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Support our work and get unlimited access to all of our content.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
            {tiers.map((tier) => (
              <Card key={tier.name} className={tier.name === 'Premium' ? 'border-primary md:col-start-2' : ''}>
                <CardHeader className="pb-4">
                  <CardTitle className="text-2xl font-headline">{tier.name}</CardTitle>
                  <CardDescription>
                    <span className="text-4xl font-bold">{tier.price}</span>
                    {tier.priceSuffix && <span className="text-muted-foreground">{tier.priceSuffix}</span>}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <ul className="space-y-3">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2">
                        <Check className="h-5 w-5 text-primary" />
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                    {isAuthenticated ? (
                        <Button
                          className="w-full"
                          disabled
                          variant="secondary"
                          size="lg"
                        >
                            You are already subscribed!
                        </Button>
                    ) : (
                       isPaymentConfigured && (
                           <Button
                                className="w-full"
                                disabled={isLoading}
                                variant={tier.name === 'Premium' ? 'default' : 'outline'}
                                size="lg"
                                asChild={!isLoading}
                            >
                                {isLoading ? (
                                    <div className="flex items-center justify-center">
                                     <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                     Loading...
                                    </div>
                                ): (
                                    <Link href={tier.href}>{tier.cta}</Link>
                                )}
                            </Button>
                       )
                    )}
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
