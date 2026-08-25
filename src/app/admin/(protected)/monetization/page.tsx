
'use client';

import { useIntegrations } from '@/contexts/integrations-context';
import { AppCard } from '@/components/integrations/app-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { TrendingUp, DollarSign, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function MonetizationPage() {
  const { integrations } = useIntegrations();
  
  const paywallIntegration = integrations.find(int => int.id === 'paywall-feature');

  const otherMonetizationIntegrations = integrations.filter(
    (int) =>
      int.category === 'Monetization' &&
      int.id !== 'stripe' &&
      int.id !== 'advertising' &&
      int.id !== 'paywall-feature'
  );

  return (
    <div className="space-y-8">
       <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle className="flex items-center gap-2"><DollarSign /> Monetization</CardTitle>
                <CardDescription>
                    Explore different ways to generate revenue from your content.
                </CardDescription>
            </div>
            <Button asChild>
                <Link href="/admin/monetization/my-earnings">
                    <TrendingUp className="mr-2" /> View Earnings
                </Link>
            </Button>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paywallIntegration && (
               <Card className="flex flex-col">
                  <CardHeader className="flex-col items-start gap-3 sm:flex-row sm:gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 flex items-center justify-center bg-secondary rounded-lg">
                        <Lock className="w-6 h-6 text-secondary-foreground" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg">{paywallIntegration.name}</CardTitle>
                      <CardDescription className="mt-1 line-clamp-2">{paywallIntegration.description}</CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-grow"></CardContent>
                  <CardFooter className="flex items-center justify-end gap-2">
                    <Button asChild>
                        <Link href="/admin/paywall">Configure</Link>
                    </Button>
                  </CardFooter>
                </Card>
            )}
            {otherMonetizationIntegrations.map((integration) => (
                <AppCard key={integration.id} integration={integration} />
            ))}
        </CardContent>
      </Card>
    </div>
  );
}
