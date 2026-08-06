

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Loader2, Settings, List, BarChart, Gift, Archive, LineChart as LineChartIcon, Star, LogOut, Link as LinkIcon, Award, Rss, Users as UsersIcon } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

import { PremiumHub } from '@/components/account/premium-hub';
import { ReadingList } from '@/components/account/reading-list';
import { AccountSettings } from '@/components/account/account-settings';
import { PostTracking } from '@/components/account/post-tracking';
import { ReferralProgram } from '@/components/account/referral-program';
import { NewsletterArchive } from '@/components/account/newsletter-archive';
import { EngagementAnalytics } from '@/components/account/engagement-analytics';
import { LinkInBioEditor } from '@/components/account/link-in-bio-editor';
import { Badges } from '@/components/account/badges';
import Link from 'next/link';
import { usePublicSubscription } from '@/hooks/use-public-subscription';
import type { User } from '@/lib/types';
import { FollowingManagement } from '@/components/account/following-management';
import { CommunityHub } from '@/components/blog/community-hub';
import { format } from 'date-fns';
import { Timestamp } from 'firebase/firestore';
import { useSettings } from '@/contexts/settings-context';


export default function AccountPage() {
    const { user, isLoading: isUserLoading } = usePublicSubscription();
    const { settings, isLoading: isSettingsLoading } = useSettings();
    const router = useRouter();
    const { logout } = usePublicSubscription();
    
    const accountTabs = [
        { value: "premium-hub", label: "Premium Hub", icon: Star },
        { value: "reading-list", label: "Reading List", icon: List },
        { value: "following", label: "Following", icon: Rss },
        { value: "community", label: "Community", icon: UsersIcon },
        { value: "link-in-bio", label: "Link In Bio", icon: LinkIcon },
        { value: "badges", label: "Badges", icon: Award },
        { value: "settings", label: "Settings", icon: Settings },
        { value: "tracking", label: "Tracking", icon: BarChart },
        { value: "referrals", label: "Referrals", icon: Gift },
        { value: "archive", label: "Archive", icon: Archive },
        { value: "analytics", label: "My Analytics", icon: LineChartIcon },
    ];
    
    const isLoading = isUserLoading || isSettingsLoading;

    if (isLoading || !user) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }
    
    const handleLogout = () => {
        logout();
        router.push('/');
    };

    const publicProfileUrl = user.slug ? `/${user.slug}` : '#';
    const avatarImage = PlaceHolderImages.find(p => p.id === user.avatar);

    const subscriptionDate = user.createdAt
    ? format((user.createdAt as Timestamp).toDate(), 'MMM yyyy')
    : 'N/A';
    
    const isPaymentConfigured = settings.paywall.enabled && settings.paywall.paymentProvider && settings.paywall.paymentProvider !== 'none';

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row items-start gap-8">
                <Avatar className="h-24 w-24">
                    {avatarImage && <AvatarImage src={avatarImage.url} alt={user.name} data-ai-hint={avatarImage.hint} />}
                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-grow">
                    <h1 className="text-4xl font-bold font-headline">Welcome back, {user.name.split(' ')[0]}!</h1>
                    <p className="text-muted-foreground mt-2">{user.email}</p>
                    <div className="mt-4 flex items-center gap-4">
                        <Badge>Premium Member</Badge>
                        <p className="text-sm text-muted-foreground">Subscription active since {subscriptionDate}</p>
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                    <Button variant="outline" asChild>
                        <Link href={publicProfileUrl} target="_blank">
                            <LinkIcon className="mr-2 h-4 w-4" />
                            View My Public Page
                        </Link>
                    </Button>
                    {isPaymentConfigured && (
                        <Button onClick={() => router.push('/account/billing')}>Manage Billing</Button>
                    )}
                </div>
            </div>
            
            <Tabs defaultValue="premium-hub" className="w-full">
                 <ScrollArea>
                    <div className="flex pb-4">
                        <TabsList className="h-auto p-2 bg-transparent border-b rounded-none">
                            {accountTabs.map(tab => (
                                <TabsTrigger key={tab.value} value={tab.value} className="h-auto py-2 px-4 data-[state=active]:bg-muted data-[state=active]:shadow-none">
                                    <tab.icon className="mr-2 h-4 w-4"/>
                                    {tab.label}
                                </TabsTrigger>
                            ))}
                             <TabsTrigger value="logout" className="h-auto py-2 px-4" onClick={handleLogout}>
                                <LogOut className="mr-2 h-4 w-4 text-destructive" />
                                <span className="text-destructive">Log Out</span>
                            </TabsTrigger>
                        </TabsList>
                    </div>
                    <ScrollBar orientation="horizontal" />
                </ScrollArea>

                <TabsContent value="premium-hub" className="mt-6">
                    <PremiumHub />
                </TabsContent>
                <TabsContent value="reading-list" className="mt-6">
                    <ReadingList />
                </TabsContent>
                <TabsContent value="following" className="mt-6">
                    <FollowingManagement />
                </TabsContent>
                 <TabsContent value="community" className="mt-6">
                    <CommunityHub />
                </TabsContent>
                 <TabsContent value="link-in-bio" className="mt-6">
                    <LinkInBioEditor />
                </TabsContent>
                 <TabsContent value="badges" className="mt-6">
                    <Badges badges={user.badges || []} />
                </TabsContent>
                <TabsContent value="settings" className="mt-6">
                    <AccountSettings />
                </TabsContent>
                 <TabsContent value="tracking" className="mt-6">
                    <PostTracking />
                </TabsContent>
                 <TabsContent value="referrals" className="mt-6">
                    <ReferralProgram />
                </TabsContent>
                <TabsContent value="archive" className="mt-6">
                    <NewsletterArchive />
                </TabsContent>
                <TabsContent value="analytics" className="mt-6">
                    <EngagementAnalytics />
                </TabsContent>
            </Tabs>
        </div>
    );
}
