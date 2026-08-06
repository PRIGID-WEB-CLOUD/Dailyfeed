
'use client';

import { useState } from 'react';
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
import { BadgeDollarSign, BarChart3, Bot, CreditCard, Lock, Mail, Share2, Bird, Zap, CheckCircle, Loader2 } from 'lucide-react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { cn } from '@/lib/utils';

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
};

const credentialRequirements: Record<string, { id: string; label: string; placeholder: string }[]> = {
  mailchimp: [
    { id: 'apiKey', label: 'API Key', placeholder: 'Enter your Mailchimp API Key' },
  ],
  stripe: [
    { id: 'publicKey', label: 'Publishable Key', placeholder: 'pk_test_...' },
    { id: 'secretKey', label: 'Secret Key', placeholder: 'sk_test_...' },
  ],
  paystack: [
    { id: 'publicKey', label: 'Public Key', placeholder: 'pk_test_...' },
    { id: 'secretKey', label: 'Secret Key', placeholder: 'sk_test_...' },
  ],
  twitter: [
    { id: 'apiKey', label: 'API Key', placeholder: 'Enter your Twitter API Key' },
    { id: 'apiSecret', label: 'API Secret Key', placeholder: 'Enter your Twitter API Secret' },
  ],
  facebook: [
    { id: 'pageId', label: 'Page ID', placeholder: 'Enter your Facebook Page ID' },
    { id: 'accessToken', label: 'Access Token', placeholder: 'Enter your Access Token' },
  ],
  'google-adsense': [
    { id: 'publisherId', label: 'Publisher ID', placeholder: 'pub-...' },
  ],
  'carbon-ads': [
    { id: 'serve', label: 'Serve ID', placeholder: 'Enter your Serve ID' },
    { id: 'placement', label: 'Placement', placeholder: 'Enter your Placement ID' },
  ],
  adthrive: [
    { id: 'siteId', label: 'Site ID', placeholder: 'Enter your AdThrive Site ID' },
  ],
  adsterra: [
    { id: 'partnerId', label: 'Partner ID', placeholder: 'Enter your Partner ID' },
    { id: 'zoneId', label: 'Zone ID', placeholder: 'Enter your Zone ID' },
  ],
  'google-analytics': [
    { id: 'trackingId', label: 'Measurement ID', placeholder: 'G-XXXXXXXXXX' },
  ]
};


export function AppCard({ integration }: { integration: Integration }) {
  const { toast } = useToast();
  const { updateIntegration } = useIntegrations();
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [isConnecting, setIsConnecting] = useState(false);

  const requiredFields = credentialRequirements[integration.id];

  const handleInputChange = (fieldId: string, value: string) => {
    setCredentials(prev => ({ ...prev, [fieldId]: value }));
  };

  const handleConnect = () => {
    if (requiredFields) {
      const allFieldsFilled = requiredFields.every(field => credentials[field.id]);
      if (!allFieldsFilled) {
        toast({ variant: 'destructive', title: 'Missing Information', description: 'Please fill in all required fields.' });
        return;
      }
    }
    
    setIsConnecting(true);
    setTimeout(() => {
      updateIntegration(integration.id, { connected: true, enabled: true, credentials });
      toast({ title: `${integration.name} Connected!`, description: 'The integration is now active.' });
      setIsConnecting(false);
    }, 1000);
  };
  
  const handleDisconnect = () => {
    updateIntegration(integration.id, { connected: false, enabled: false, credentials: {} });
    setCredentials({});
    toast({
      variant: 'destructive',
      title: `${integration.name} Disconnected`,
      description: `The integration has been disabled.`,
    });
  };

  const Icon = iconMap[integration.icon] || Zap;

  return (
    <Card className={cn("flex flex-col", integration.connected && "border-green-500")}>
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
      <CardContent className="flex-grow">
        {!integration.connected && requiredFields ? (
          <div className="space-y-4">
            {requiredFields.map(field => (
               <div key={field.id} className="space-y-2">
                <Label htmlFor={`${integration.id}-${field.id}`}>{field.label}</Label>
                <Input 
                  id={`${integration.id}-${field.id}`} 
                  placeholder={field.placeholder} 
                  value={credentials[field.id] || ''} 
                  onChange={(e) => handleInputChange(field.id, e.target.value)} 
                />
              </div>
            ))}
          </div>
        ) : integration.connected ? (
           <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <span className="font-semibold">Connected</span>
            </div>
        ) : null}
      </CardContent>
      <CardFooter className="flex items-center justify-end gap-2">
         {integration.connected ? (
            <Button variant="destructive" onClick={handleDisconnect}>
              Disconnect
            </Button>
          ) : (
             <Button onClick={handleConnect} disabled={isConnecting}>
              {isConnecting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
              Connect
            </Button>
          )}
      </CardFooter>
    </Card>
  );
}
