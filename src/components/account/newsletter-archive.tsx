
'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, Mail, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription
} from '@/components/ui/dialog';
import { Separator } from '../ui/separator';
import { collection, query, where, orderBy, Timestamp, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Newsletter {
  id: string;
  subject: string;
  content: string;
  sentAt: string;
}

export function NewsletterArchive() {
  const [searchTerm, setSearchTerm] = useState('');
  
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchNewsletters = async () => {
        setIsLoading(true);
        try {
            const postsQuery = query(collection(db, 'posts'), where('status', '==', 'Published'), orderBy('publishedAt', 'desc'));
            const postsSnapshot = await getDocs(postsQuery);
            const newslettersData = postsSnapshot.docs.map(doc => {
                const post = doc.data();
                return {
                    id: doc.id,
                    subject: `Newsletter: ${post.title}`,
                    content: post.content,
                    sentAt: (post.publishedAt as Timestamp).toDate().toISOString(),
                }
            }).slice(0, 5); // Take the 5 most recent for the archive
            setNewsletters(newslettersData);
        } catch (error) {
            console.error("Failed to fetch newsletters:", error);
        } finally {
            setIsLoading(false);
        }
    };
    fetchNewsletters();
  }, []);

  const filteredNewsletters = newsletters.filter(n => 
    n.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Newsletter Archive</CardTitle>
        <CardDescription>Search and read past editions of our newsletter.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input 
            placeholder="Search by subject..." 
            className="pl-10" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-24">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : filteredNewsletters.length > 0 ? (
            filteredNewsletters.map(newsletter => (
              <Dialog key={newsletter.id}>
                <DialogTrigger asChild>
                  <button className="group w-full flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors text-left">
                      <div>
                        <h4 className="font-semibold group-hover:text-primary">{newsletter.subject}</h4>
                        <p className="text-sm text-muted-foreground">{format(new Date(newsletter.sentAt), 'MMMM d, yyyy')}</p>
                      </div>
                      <Mail className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{newsletter.subject}</DialogTitle>
                        <DialogDescription>
                            Sent on {format(new Date(newsletter.sentAt), 'MMMM d, yyyy')}
                        </DialogDescription>
                    </DialogHeader>
                    <Separator />
                    <div className="prose dark:prose-invert max-w-none max-h-[60vh] overflow-y-auto">
                        {newsletter.content.split('\n').map((p, i) => <p key={i}>{p}</p>)}
                    </div>
                </DialogContent>
              </Dialog>
            ))
          ) : (
            <p className="text-center text-muted-foreground py-8">No newsletters found.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
