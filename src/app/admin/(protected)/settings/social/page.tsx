'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Share2 } from "lucide-react";
import { AppCard } from '@/components/integrations/app-card';
import { useIntegrations } from '@/contexts/integrations-context';
import Link from "next/link";
import { Button } from "@/components/ui/button";


export default function SocialConnectionsPage() {
    const { integrations } = useIntegrations();
    const socialIntegrations = integrations.filter(int => int.category === 'Social Media' && int.installed);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Share2 /> Social Media Connections</CardTitle>
                <CardDescription>Manage your connections to social media platforms like Twitter and Facebook.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {socialIntegrations.length > 0 ? socialIntegrations.map(integration => (
                    <AppCard key={integration.id} integration={integration} />
                )) : (
                     <div className="p-8 border-2 border-dashed rounded-lg text-center text-muted-foreground col-span-full">
                        <p>No installed social media add-ons found.</p>
                        <Button variant="link" asChild>
                            <Link href="/admin/marketplace">Explore the Marketplace</Link>
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

    
