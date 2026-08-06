

'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import type { User } from '@/lib/types';
import { usePublicSubscription } from '@/hooks/use-public-subscription';

interface ReferralStats {
    referred: number;
    signups: number;
    rewards: number;
}

export function ReferralProgram() {
    const { toast } = useToast();
    const { user, isLoading: isUserLoading } = usePublicSubscription();

    const referralStats: ReferralStats | null = user ? {
        referred: user.referrals || 0,
        signups: user.signups || 0,
        rewards: user.earnings || 0,
    } : null;

    const isLoading = isUserLoading;
    
    const blogUrl = typeof window !== 'undefined' ? window.location.host : 'dailyfeed.com';
    const referralLink = user ? `https://${blogUrl}/subscribe?ref=${user.slug}` : '';
    
    const copyToClipboard = () => {
        if (!referralLink) return;
        navigator.clipboard.writeText(referralLink);
        toast({
            title: "Copied to clipboard!",
        });
    }
    
    if (isLoading) {
        return <Card><CardContent className="p-6 flex items-center justify-center min-h-[200px]"><Loader2 className="animate-spin h-8 w-8 text-primary" /></CardContent></Card>
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Referral Program</CardTitle>
                <CardDescription>Share Dailyfeed and earn rewards!</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div>
                    <h4 className="font-medium mb-2">Your Personal Referral Link</h4>
                    <div className="flex gap-2">
                        <Input value={referralLink} readOnly />
                        <Button onClick={copyToClipboard} disabled={!referralLink}>Copy Link</Button>
                    </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4 text-center">
                    <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">Friends Referred</p>
                        <p className="text-2xl font-bold">{referralStats?.referred ?? 0}</p>
                    </div>
                     <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">Successful Sign-ups</p>
                        <p className="text-2xl font-bold">{referralStats?.signups ?? 0}</p>
                    </div>
                     <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">Your Rewards</p>
                        <p className="text-2xl font-bold">${referralStats?.rewards.toFixed(2) ?? '0.00'}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
