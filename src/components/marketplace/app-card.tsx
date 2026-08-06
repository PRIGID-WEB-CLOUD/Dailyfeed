'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useIntegrations, type Integration } from '@/contexts/integrations-context';
import { BadgeDollarSign, BarChart3, Bot, CreditCard, Lock, Mail, Share2, Bird, Zap, Megaphone } from 'lucide-react';
import Link from 'next/link';

const iconMap: Record<string, React.ElementType> = {
  Bird,
  Share2,
  Mail,
  BarChart3,
  Bot,
  CreditCard,
  BadgeDollarSign,
  Lock,
  Zap,
  Megaphone,
};

export function AppCard({ integration }: { integration: Integration }) {
  const { toast } = useToast();
  const { updateIntegration } = useIntegrations();

  const handleInstall = () => {
    updateIntegration(integration.id, { installed: true });
    toast({
      title: `${integration.name} Installed`,
      description: `The extension has been successfully installed.`,
    });
  };

  const handleUninstall = () => {
    updateIntegration(integration.id, { installed: false, connected: false, enabled: false });
    toast({
      variant: 'destructive',
      title: `${integration.name} Uninstalled`,
      description: `The extension has been removed.`,
    });
  };

  const Icon = iconMap[integration.icon] || Zap;

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex-row items-start gap-4">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 flex items-center justify-center bg-secondary rounded-lg">
            <Icon className="w-6 h-6 text-secondary-foreground" />
          </div>
        </div>
        <div className="flex-1">
          <CardTitle className="text-lg">{integration.name}</CardTitle>
          <CardDescription className="mt-1 line-clamp-2">{integration.description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex-grow"></CardContent>
      <CardFooter className="flex items-center justify-end gap-2">
        {integration.installed ? (
          <>
            {integration.managementUrl && (
               <Button asChild variant="outline">
                <Link href={integration.managementUrl}>Manage</Link>
              </Button>
            )}
            <Button variant="destructive" onClick={handleUninstall}>
              Uninstall
            </Button>
          </>
        ) : (
          <Button onClick={handleInstall}>Install</Button>
        )}
      </CardFooter>
    </Card>
  );
}
