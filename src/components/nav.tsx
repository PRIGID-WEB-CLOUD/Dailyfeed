
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  BarChart2,
  Settings,
  PlusCircle,
  ImageIcon,
  CalendarClock,
  Users,
  MessageSquare,
  Mail,
  TrendingUp,
  DollarSign,
  Lock,
  History,
  ChevronDown,
  Book,
  Heart,
  Rocket,
  Shield,
  Link as LinkIcon,
  StickyNote,
  Newspaper,
  BookUser,
  Handshake,
  UploadCloud,
  Store,
  CreditCard,
  Share2,
  Megaphone,
  ShoppingBag,
  Zap,
  LayoutGrid,
  BadgeDollarSign,
  ClipboardList,
  User as UserIcon,
  Puzzle,
  FileEdit,
} from 'lucide-react';
import {
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from '@/components/ui/sidebar';
import { AppLogo } from '@/components/app-logo';
import { Separator } from './ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { cn } from '@/lib/utils';
import { Skeleton } from './ui/skeleton';

const contentItems = [
  { href: '/admin/posts', label: 'All Posts', icon: FileText },
  { href: '/admin/posts/drafts', label: 'Drafts', icon: FileEdit },
  { href: '/admin/posts/new', label: 'New Post', icon: PlusCircle },
  { href: '/admin/media', label: 'Media', icon: ImageIcon },
  { href: '/admin/categories', label: 'Categories', icon: LayoutGrid },
  { href: '/admin/schedule', label: 'Schedule', icon: CalendarClock },
  { href: '/admin/static-pages', label: 'Static Pages', icon: StickyNote },
];

const audienceItems = [
  { href: '/admin/authors', label: 'Authors', icon: BookUser },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart2 },
  { href: '/admin/subscribers', label: 'Subscribers', icon: Users },
  { href: '/admin/subscriptions', label: 'Subscriptions', icon: Heart },
];

const engagementItems = [
    { href: '/admin/comments', label: 'Comments', icon: MessageSquare },
    { href: '/admin/polls', label: 'Polls', icon: BarChart2 },
    { href: '/admin/surveys', label: 'Surveys', icon: ClipboardList },
];

const growthItems = [
    { href: '/admin/seo', label: 'SEO', icon: TrendingUp },
    { href: '/admin/newsletter', label: 'Newsletter', icon: Mail },
];

const appStoreItems = [
    { href: '/admin/marketplace', label: 'Marketplace', icon: Store },
    { href: '/admin/settings/social', label: 'Social Media', icon: Share2 },
    { href: '/admin/growth/marketing', label: 'Marketing', icon: Megaphone },
    { href: '/admin/monetization/payments', label: 'Payment Providers', icon: CreditCard },
    { href: '/admin/monetization/advertising', label: 'Ad Networks', icon: BadgeDollarSign },
]

const monetizationItems = [
    { href: '/admin/monetization/my-earnings', label: 'My Revenue', icon: DollarSign },
    { href: '/admin/paywall', label: 'Content Paywall', icon: Lock },
    { href: '/admin/affiliate', label: 'Affiliate Links', icon: LinkIcon },
    { href: '/admin/partnerships', label: 'Partnerships', icon: Handshake },
    { href: '/admin/monetization/supporters', label: 'Supporters', icon: ShoppingBag },
]


const platformItems = [
  { href: '/admin/profile', label: 'Profile', icon: UserIcon },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
  { href: '/admin/backups', label: 'Backups', icon: History },
];

function NavLink({ href, icon, label }: { href: string, icon: React.ReactNode, label: string }) {
    const pathname = usePathname();
    const { setOpenMobile } = useSidebar();
    const isActive = pathname.startsWith(href) && (href !== '/admin/dashboard' || pathname === '/admin/dashboard');

    return (
        <SidebarMenuItem>
            <Link href={href} onClick={() => setOpenMobile(false)}>
                <SidebarMenuButton isActive={isActive} icon={icon}
                tooltip={{children: label, side: 'right', align: 'center'}}
                >
                    <span>{label}</span>
                </SidebarMenuButton>
            </Link>
        </SidebarMenuItem>
    )
}

function NavCollapsibleSection({ title, items }: { title: string, items: { href: string, label: string, icon: React.ElementType }[]}) {
    const pathname = usePathname();
    const isAnyItemActive = items.some(item => pathname.startsWith(item.href));
    const [isOpen, setIsOpen] = useState(isAnyItemActive);
    
    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <CollapsibleTrigger asChild>
                 <SidebarMenuButton
                    className="w-full"
                    isActive={isAnyItemActive}
                >
                  <span className="flex-grow text-left">{title}</span>
                  <ChevronDown className={cn('transition-transform duration-200', isOpen && 'rotate-180')} />
                </SidebarMenuButton>
            </CollapsibleTrigger>
            <CollapsibleContent>
                 <SidebarMenu className="py-2 pl-6">
                    {items.map(item => <NavLink key={item.label} {...item} icon={<item.icon />} />)}
                </SidebarMenu>
            </CollapsibleContent>
        </Collapsible>
    )
}

export function Nav() {
  const { isMobile } = useSidebar();
  const pathname = usePathname();

  return (
    <>
      <SidebarHeader>
        <Link href="/admin/dashboard" className="flex items-center gap-2">
            <AppLogo className="w-8 h-8 text-primary" />
            <span className="text-lg font-semibold font-headline">Dailyfeed</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
            <NavLink href="/admin/dashboard" icon={<LayoutDashboard />} label="Dashboard" />
            
            <NavCollapsibleSection title="Content" items={contentItems} />
            <NavCollapsibleSection title="Audience" items={audienceItems} />
            <NavCollapsibleSection title="Engagement" items={engagementItems} />
            <NavCollapsibleSection title="Growth" items={growthItems} />
            <NavCollapsibleSection title="Monetization" items={monetizationItems} />
            <NavCollapsibleSection title="App Store" items={appStoreItems} />
            <NavCollapsibleSection title="Platform" items={platformItems} />

        </SidebarMenu>
      </SidebarContent>
    </>
  );
}
