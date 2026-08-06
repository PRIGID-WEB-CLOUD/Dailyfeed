
'use client';

import Link from 'next/link';
import { AppLogo } from '@/components/app-logo';
import { Button } from '@/components/ui/button';
import { Facebook, Twitter, Linkedin } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';
import { useEffect, useState } from 'react';
import { initialSettings } from '@/lib/initial-settings';
import type { AppSettings } from '@/lib/types';


export function PublicFooter() {
    const [socialLinks, setSocialLinks] = useState<AppSettings['staticPages']['socialLinks']>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    useEffect(() => {
        // In a real app, you might fetch this from an API endpoint, but for now we'll use the initial settings
        // as a fallback for public pages.
        setSocialLinks(initialSettings.staticPages.socialLinks);
        setIsLoading(false);
    }, []);

    const footerLinks = [
        { href: '/about', label: 'About' },
        { href: '/contact', label: 'Contact' },
        { href: '/supporters', label: 'Supporters' },
        { href: '/privacy', label: 'Privacy Policy' },
        { href: '/terms', label: 'Terms of Service' },
        { href: '/affiliate-program', label: 'Affiliate Program' },
    ];

    const iconMap: { [key: string]: React.ElementType } = {
        Twitter,
        Facebook,
        Linkedin,
    };


    return (
         <footer className="bg-card border-t mt-12">
            <div className="w-full max-w-7xl mx-auto px-4 lg:px-6 py-8">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-2">
                        <AppLogo className="w-6 h-6 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          &copy; {new Date().getFullYear()}{' '}
                          Dailyfeed. All rights reserved.
                        </span>
                    </div>
                    <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
                        {footerLinks.map(link => (
                            <Link key={link.href} href={link.href} className="hover:text-primary transition-colors">
                                {link.label}
                            </Link>
                        ))}
                    </nav>
                    <div className="flex gap-2">
                        {isLoading ? (
                            <>
                                <Skeleton className="h-10 w-10" />
                                <Skeleton className="h-10 w-10" />
                                <Skeleton className="h-10 w-10" />
                            </>
                        ) : socialLinks.map(social => {
                            const Icon = iconMap[social.platform];
                            return Icon ? (
                                <Button key={social.platform} variant="ghost" size="icon" asChild>
                                    <a href={social.url} target="_blank" rel="noopener noreferrer">
                                        <Icon className={`h-5 w-5 text-muted-foreground transition-colors hover:text-primary`} />
                                        <span className="sr-only">{social.platform}</span>
                                    </a>
                                </Button>
                            ) : null;
                        })}
                    </div>
                </div>
            </div>
      </footer>
    )
}
