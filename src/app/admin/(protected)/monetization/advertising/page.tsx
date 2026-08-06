'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BadgeDollarSign } from "lucide-react";
import { AppCard } from '@/components/integrations/app-card';
import { useIntegrations } from '@/contexts/integrations-context';
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AdvertisingPage() {
    const { integrations } = useIntegrations();
    const adIntegrations = integrations.filter(int => int.category === 'Advertising' && int.installed);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><BadgeDollarSign /> Ad Networks</CardTitle>
                <CardDescription>Manage your connections to ad networks to monetize your content.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {adIntegrations.length > 0 ? adIntegrations.map(integration => (
                    <AppCard key={integration.id} integration={integration} />
                )) : (
                     <div className="p-8 border-2 border-dashed rounded-lg text-center text-muted-foreground col-span-full">
                        <p>No installed advertising add-ons found.</p>
                        <Button variant="link" asChild>
                            <Link href="/admin/marketplace">Explore the Marketplace</Link>
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
