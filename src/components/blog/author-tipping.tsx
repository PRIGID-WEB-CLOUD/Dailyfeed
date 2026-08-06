
'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { HandCoins } from 'lucide-react';
import type { User } from '@/lib/types';
import { cn } from '@/lib/utils';
import { usePublicSubscription } from '@/hooks/use-public-subscription';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';

const tipAmounts = [2, 5, 10, 20];

export function AuthorTipping({ author }: { author: User }) {
  const { toast } = useToast();
  const { user, isAuthenticated } = usePublicSubscription();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(5);

  const handleSendTip = async () => {
    if (!user) {
        toast({
            variant: 'destructive',
            title: 'Please log in',
            description: 'You must be logged in to send a tip.',
        });
        return;
    }
    
    if (selectedAmount === null) {
        toast({
            variant: 'destructive',
            title: 'No amount selected',
            description: 'Please select a tip amount.',
        });
        return;
    }
    
    try {
      await addDoc(collection(db, 'tips'), {
        amount: selectedAmount,
        authorId: author.id,
        authorName: author.name,
        tipperId: user.id,
        tipperName: user.name,
        createdAt: serverTimestamp(),
      });
      
      toast({
        title: 'Tip Sent!',
        description: `You've successfully sent a $${selectedAmount} tip to ${author.name}. Thank you for your support!`,
      });
      setIsOpen(false);
    } catch(error) {
      console.error("Error sending tip: ", error);
       toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not process your tip at this time.',
      });
    }
  };

  if (!isAuthenticated) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="icon">
                  <HandCoins className="h-4 w-4 hover:text-green-500" />
                  <span className="sr-only">Tip Author</span>
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Join to Tip</DialogTitle>
                    <DialogDescription>
                        Please log in or create an account to support authors.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button asChild><Link href="/login">Log In / Sign Up</Link></Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <HandCoins className="h-4 w-4 hover:text-green-500" />
          <span className="sr-only">Tip Author</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Leave a Tip for {author.name}</DialogTitle>
          <DialogDescription>
            Show your appreciation for this article. 100% of your tip goes directly to the author.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p className="mb-4 text-center text-5xl font-bold">${selectedAmount}</p>
          <div className="grid grid-cols-4 gap-4">
            {tipAmounts.map(amount => (
              <Button
                key={amount}
                variant="outline"
                className={cn(selectedAmount === amount && "bg-primary text-primary-foreground border-primary hover:bg-primary/90 hover:text-primary-foreground")}
                onClick={() => setSelectedAmount(amount)}
              >
                ${amount}
              </Button>
            ))}
          </div>
        </div>
        <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button onClick={handleSendTip}>Send Tip</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
