
'use client';
import {
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { ThemeToggle } from '@/components/theme-toggle';
import { usePathname } from 'next/navigation';
import { LogOut, User as UserIcon } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Link from 'next/link';
import type { User } from '@/lib/types';

const getPageTitle = (pathname: string): string => {
  if (pathname === '/admin/dashboard') return 'Dashboard';
  if (pathname.startsWith('/admin/posts/new')) return 'Create New Post';
  if (pathname.startsWith('/admin/posts/drafts')) return 'Drafts';
  if (pathname.startsWith('/admin/posts/')) return 'Edit Post';
  if (pathname.startsWith('/admin/posts')) return 'Content Management';
  if (pathname.startsWith('/admin/media')) return 'Media Library';
  if (pathname.startsWith('/admin/categories')) return 'Categories';
  if (pathname.startsWith('/admin/schedule')) return 'Content Scheduler';
  if (pathname.startsWith('/admin/analytics')) return 'Analytics & Insights';
  if (pathname.startsWith('/admin/integrations')) return 'Add-ons';
  if (pathname.startsWith('/admin/settings')) return 'Settings';
  if (pathname.startsWith('/admin/authors')) return 'Authors';
  if (pathname.startsWith('/admin/users')) return 'Users';
  if (pathname.startsWith('/admin/comments')) return 'Comments & Moderation';
  if (pathname.startsWith('/admin/polls')) return 'Poll Management';
  if (pathname.startsWith('/admin/surveys')) return 'Survey Management';
  if (pathname.startsWith('/admin/subscribers')) return 'Subscribers';
  if (pathname.startsWith('/admin/subscriptions/')) return 'Subscription Details';
  if (pathname.startsWith('/admin/subscriptions')) return 'Subscriptions';
  if (pathname.startsWith('/admin/newsletter')) return 'Newsletter';
  if (pathname.startsWith('/admin/seo')) return 'SEO & Meta';
  if (pathname.startsWith('/admin/monetization/my-revenue')) return 'My Revenue';
  if (pathname.startsWith('/admin/monetization/supporters')) return 'Supporters';
  if (pathname.startsWith('/admin/growth/marketing')) return 'Marketing Tools';
  if (pathname.startsWith('/admin/monetization')) return 'Monetization';
  if (pathname.startsWith('/admin/paywall')) return 'Content Paywall';
  if (pathname.startsWith('/admin/backups')) return 'Backups';
  if (pathname.startsWith('/admin/affiliate')) return 'Affiliate Links';
  if (pathname.startsWith('/admin/static-pages')) return 'Static Pages';
  if (pathname.startsWith('/admin/partnerships/')) return 'Partnership Details';
  if (pathname.startsWith('/admin/partnerships')) return 'Partnerships';
  if (pathname.startsWith('/admin/upload')) return 'Upload Test Page';
  if (pathname.startsWith('/admin/profile')) return 'My Profile';
  return 'Admin';
};

export function Header({ user, onLogout }: { user: User, onLogout: () => void }) {
  const pathname = usePathname();
  const pageTitle = getPageTitle(pathname);
  const avatarImage = PlaceHolderImages.find(img => img.id === user.avatar);

  return (
    <header className="sticky top-0 z-30 flex h-16 min-w-0 items-center gap-2 border-b bg-background px-3 sm:gap-4 sm:px-4 md:px-6">
        <div className="shrink-0 md:hidden">
            <SidebarTrigger />
        </div>
        <h1 className="min-w-0 truncate text-lg font-semibold font-headline md:text-2xl">{pageTitle}</h1>
        <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-4">
            <ThemeToggle />
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                        <Avatar className="h-9 w-9">
                            <AvatarImage src={avatarImage?.url} alt={user.name} data-ai-hint={avatarImage?.hint}/>
                            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                     <DropdownMenuItem asChild>
                        <Link href="/admin/profile"><UserIcon className="mr-2 h-4 w-4" />Profile</Link>
                    </DropdownMenuItem>
                     <DropdownMenuItem asChild>
                        <Link href="/admin/settings">Settings</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                     <DropdownMenuItem onClick={onLogout} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Log out</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    </header>
  );
}
