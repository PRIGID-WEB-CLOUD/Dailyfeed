
'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { UserBadge, Badge } from '@/lib/types';
import { MOCK_BADGES } from '@/lib/mock-data';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Share2, Twitter, Facebook, Linkedin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function Badges({ badges }: { badges: UserBadge[] }) {
  const { toast } = useToast();
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);

  const userBadges = badges.map(userBadge => {
      return MOCK_BADGES.find(mockBadge => mockBadge.id === userBadge.id);
  }).filter((b): b is Badge => b !== undefined);

  const handleShare = (platform: string) => {
    if (!selectedBadge) return;
    const shareText = `I just unlocked the "${selectedBadge.name}" badge on Dailyfeed! Check it out.`;
    const shareUrl = window.location.href;
    let url = '';

    switch (platform) {
      case 'Twitter':
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
        break;
      case 'Facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        break;
      case 'LinkedIn':
        url = `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(shareText)}`;
        break;
    }
    window.open(url, '_blank');
    toast({ title: `Shared to ${platform}!` });
  };
  
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Badges & Achievements</CardTitle>
          <CardDescription>Your collection of earned badges for your support and engagement.</CardDescription>
        </CardHeader>
        <CardContent>
          {userBadges.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {userBadges.map((badge) => {
                  if (!badge) return null;
                  const Icon = badge.icon;
                  return (
                      <div key={badge.id} className="group flex flex-col items-center text-center gap-3 p-4 border rounded-lg hover:bg-accent hover:shadow-lg transition-all duration-200">
                          <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="w-16 h-16 flex items-center justify-center bg-primary/10 text-primary rounded-full cursor-pointer">
                                        <Icon className="w-8 h-8" />
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{badge.description}</p>
                                </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <h4 className="font-semibold text-sm">{badge.name}</h4>
                          <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => setSelectedBadge(badge)}>
                            <Share2 className="mr-2 h-4 w-4" /> Share
                          </Button>
                      </div>
                  )
              })}
            </div>
          ) : (
            <div className="text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg">
              <h3 className="text-lg font-semibold">No badges yet!</h3>
              <p>Keep reading and engaging to earn your first badge.</p>
            </div>
          )}
        </CardContent>
      </Card>
       <Dialog open={!!selectedBadge} onOpenChange={(open) => !open && setSelectedBadge(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Your Achievement</DialogTitle>
            <DialogDescription>
              You've earned the "{selectedBadge?.name}" badge! Share it with your network.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 flex justify-center gap-4">
            <Button variant="outline" size="icon" onClick={() => handleShare('Twitter')}><Twitter className="h-5 w-5" /></Button>
            <Button variant="outline" size="icon" onClick={() => handleShare('Facebook')}><Facebook className="h-5 w-5" /></Button>
            <Button variant="outline" size="icon" onClick={() => handleShare('LinkedIn')}><Linkedin className="h-5 w-5" /></Button>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setSelectedBadge(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
