'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard } from "lucide-react";
import { AppCard } from '@/components/integrations/app-card';
import { useIntegrations } from '@/contexts/integrations-context';
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function PaymentsPage() {
    const { integrations } = useIntegrations();
    const paymentIntegrations = integrations.filter(int => int.id === 'stripe' && int.installed);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><CreditCard /> Payment Providers</CardTitle>
                <CardDescription>Manage your payment provider connections like Stripe.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {paymentIntegrations.length > 0 ? paymentIntegrations.map(integration => (
                    <AppCard key={integration.id} integration={integration} />
                )) : (
                     <div className="p-8 border-2 border-dashed rounded-lg text-center text-muted-foreground col-span-full">
                        <p>No installed payment add-ons found.</p>
                        <Button variant="link" asChild>
                            <Link href="/admin/marketplace">Explore the Marketplace</Link>
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
