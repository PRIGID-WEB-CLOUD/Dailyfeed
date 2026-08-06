
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { AppLogo } from '@/components/app-logo';
import { Button } from '@/components/ui/button';
import { LogIn, LogOut, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePublicSubscription } from '@/hooks/use-public-subscription';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Notification } from '@/lib/types';
import React, { useMemo } from 'react';
import { ThemeToggle } from '../theme-toggle';


export function PublicHeader() {
    const { isAuthenticated, isLoading: isSubscriptionLoading, logout, user } = usePublicSubscription();
    const pathname = usePathname();
    const router = useRouter();

    const onAccountPage = pathname.startsWith('/account');
    const onHomePage = pathname === '/';
    const onPostPage = pathname.startsWith('/blog/');
    const onStaticPage = ['/about', '/contact', '/terms', '/privacy', '/subscribe', '/advertise', '/affiliate-program'].includes(pathname);
    
    const notificationsQuery = useMemo(() => {
        if (!user) return null;

        const fifteenDaysAgo = new Date();
        fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);
        
        return query(
          collection(db, 'notifications'), 
          orderBy('date', 'desc'),
          where('date', '>', Timestamp.fromDate(fifteenDaysAgo))
        );
    }, [user]);
    
    const [notificationsSnapshot] = useCollection(notificationsQuery);

    const userNotifications = useMemo(() => {
        if (!notificationsSnapshot || !user) return [];
        return notificationsSnapshot.docs
            .map(doc => doc.data() as Notification)
            .filter(n => 
                (user.followingAuthors && user.followingAuthors.includes(n.authorId)) ||
                (user.followingTags && n.tags.some(t => user.followingTags!.includes(t)))
            );
    }, [notificationsSnapshot, user]);


    const handleLogout = () => {
        logout();
        router.push('/');
    };

    const isLoading = isSubscriptionLoading;
    
    return (
        <header className="sticky top-0 z-50 bg-background border-b">
            <div className={cn("w-full max-w-7xl mx-auto px-4 lg:px-6 h-20 flex items-center justify-between")}>
                <Link href="/" className="flex items-center gap-2">
                    <AppLogo className="w-8 h-8 text-primary" />
                    {isLoading ? (
                      <Skeleton className="h-7 w-28" />
                    ) : (
                      <span className="text-xl font-semibold font-headline">Dailyfeed</span>
                    )}
                </Link>

                <nav className="flex items-center gap-4">
                    <ThemeToggle />
                    {isLoading ? (
                        <Skeleton className="h-10 w-24" />
                    ) : isAuthenticated ? (
                        <>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="relative">
                                        <Bell />
                                        {userNotifications.length > 0 && <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-destructive" />}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-80">
                                    <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    {userNotifications.length > 0 ? userNotifications.slice(0, 5).map(n => (
                                        <DropdownMenuItem key={n.id} asChild>
                                            <Link href={`/blog/${n.slug}`} className="flex flex-col items-start gap-1">
                                                <p className="font-medium whitespace-normal">{n.message}</p>
                                                <p className="text-xs text-muted-foreground">{n.date ? formatDistanceToNow(n.date.toDate(), { addSuffix: true }) : 'just now'}</p>
                                            </Link>
                                        </DropdownMenuItem>
                                    )) : (
                                        <p className="p-4 text-sm text-muted-foreground">No new notifications.</p>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                            {onAccountPage ? (
                                <Button variant="outline" onClick={handleLogout}>
                                    <LogOut className="mr-2 h-4 w-4" />
                                    Log Out
                                </Button>
                            ) : (
                                <Button asChild>
                                    <Link href="/account">My Account</Link>
                                </Button>
                            )}
                        </>
                    ) : (
                        <>
                            {(onHomePage || onPostPage) && (
                                <Button asChild>
                                    <Link href="/subscribe">Subscribe</Link>
                                </Button>
                            )}
                        </>
                    )}
                </nav>
            </div>
        </header>
    )
}
