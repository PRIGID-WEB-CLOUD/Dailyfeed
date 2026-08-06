'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Megaphone } from "lucide-react";
import { AppCard } from '@/components/integrations/app-card';
import { useIntegrations } from '@/contexts/integrations-context';
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function MarketingPage() {
    const { integrations } = useIntegrations();
    const marketingIntegrations = integrations.filter(int => int.category === 'Marketing' && int.installed);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Megaphone /> Marketing Tools</CardTitle>
                <CardDescription>Manage your connections to marketing platforms like Mailchimp.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {marketingIntegrations.length > 0 ? marketingIntegrations.map(integration => (
                    <AppCard key={integration.id} integration={integration} />
                )) : (
                     <div className="p-8 border-2 border-dashed rounded-lg text-center text-muted-foreground col-span-full">
                        <p>No installed marketing add-ons found.</p>
                        <Button variant="link" asChild>
                            <Link href="/admin/marketplace">Explore the Marketplace</Link>
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
