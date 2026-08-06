
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AppLogo } from '@/components/app-logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    setIsLoading(false);
    toast({
      title: 'Password Reset Email Sent',
      description: 'Check your email for a link to reset your password. (This is a mock action)',
    });
    setIsSubmitted(true);
  };

  return (
      <Card className="w-full max-w-sm shadow-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <AppLogo className="size-12 text-primary" />
          </div>
          <CardTitle className="text-3xl font-headline">Forgot Password</CardTitle>
          <CardDescription>
            {isSubmitted ? 'An email has been sent.' : 'Enter your email to receive a password reset link.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isSubmitted ? (
            <div className="text-center text-muted-foreground">
              <p>Please check your inbox (and spam folder) for further instructions.</p>
            </div>
          ) : (
            <form onSubmit={handlePasswordReset} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send Reset Link
              </Button>
            </form>
          )}
        </CardContent>
         <CardFooter className="flex-col gap-4 text-sm">
            <Link href="/admin/login" className="font-semibold text-primary hover:underline">
              &larr; Back to Login
            </Link>
            <div className="text-muted-foreground flex gap-4">
                <Link href="/terms" className="hover:text-primary">Terms of Service</Link>
                <Link href="/privacy" className="hover:text-primary">Privacy Policy</Link>
            </div>
        </CardFooter>
      </Card>
  );
}
