
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Mail, Loader2 } from 'lucide-react';
import { addSubscriber } from '@/lib/subscriber-service';

export function NewsletterSignupForm() {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({
        variant: 'destructive',
        title: 'Email is required',
      });
      return;
    }
    
    setIsLoading(true);
    try {
      await addSubscriber(email);
      toast({
        title: 'Subscribed!',
        description: 'Thanks for joining our newsletter.',
      });
      setEmail('');
    } catch (error: any) {
       toast({
        variant: 'destructive',
        title: 'Subscription Failed',
        description: error.message,
      });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <Card className="bg-muted/30 border-dashed">
      <CardHeader className="items-center text-center">
        <Mail className="h-10 w-10 text-primary mb-2" />
        <CardTitle>Subscribe to our Newsletter</CardTitle>
        <CardDescription>Get the latest posts and updates delivered straight to your inbox.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
          <Input
            type="email"
            placeholder="Enter your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="text-base"
          />
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Subscribe
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
