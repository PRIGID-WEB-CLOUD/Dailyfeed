
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { PublicPage } from '@/components/blog/public-page';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowUpRight, Loader2 } from 'lucide-react';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Supporter } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';

export default function SupportersPage() {
    const { toast } = useToast();
    const [supportersSnapshot, isLoading, error] = useCollection(
        query(collection(db, 'supporters'), orderBy('name', 'asc'))
    );

    const supporters: Supporter[] = supportersSnapshot?.docs.map(doc => ({ id: doc.id, ...doc.data() } as Supporter)) || [];

    useEffect(() => {
        if(error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not load supporters.'})
        }
    }, [error, toast]);

  return (
    <PublicPage title="Our Supporters">
      <p className="text-center text-lg text-muted-foreground">
        We are proud to partner with these amazing brands who support our mission.
      </p>

      <div className="mt-12">
        {isLoading ? (
            <div className="flex justify-center items-center h-48">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        ) : supporters.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {supporters.map((supporter) => (
                <Link key={supporter.id} href={supporter.website} target="_blank" rel="noopener noreferrer" className="group">
                    <Card className="h-full overflow-hidden transition-shadow hover:shadow-lg flex flex-col">
                    <CardContent className="p-0 flex-grow flex flex-col">
                        <div className="relative h-40 bg-muted flex items-center justify-center">
                        <Image
                            src={supporter.logoUrl}
                            alt={`${supporter.name} logo`}
                            fill
                            className="object-contain p-8"
                            data-ai-hint={supporter.hint}
                        />
                        </div>
                        <div className="p-4 flex-grow flex flex-col">
                        <div className="flex items-start justify-between">
                            <h3 className="font-semibold">{supporter.name}</h3>
                            <ArrowUpRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">{supporter.description}</p>
                        </div>
                    </CardContent>
                    </Card>
                </Link>
                ))}
            </div>
        ) : (
             <div className="text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg">
                <h3 className="text-lg font-semibold">No supporters yet.</h3>
                <p>Check back soon to see who is supporting our mission.</p>
            </div>
        )}
      </div>
    </PublicPage>
  );
}
