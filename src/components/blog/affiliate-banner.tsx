
'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, ArrowRight } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import type { AffiliateLink } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { trackAndRedirect } from '@/app/actions/track-click';
import { cn } from '@/lib/utils';

export function AffiliateBanner() {
  const { toast } = useToast();
  const [affiliateLinks, setAffiliateLinks] = useState<AffiliateLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [
    Autoplay({ delay: 5000, stopOnInteraction: false }),
  ]);

  useEffect(() => {
    const fetchLinks = async () => {
      setIsLoading(true);
      try {
        const linksQuery = query(
          collection(db, 'affiliateLinks'),
          orderBy('createdAt', 'desc')
        );
        const linksSnapshot = await getDocs(linksQuery);
        const linksData = linksSnapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as AffiliateLink)
        );
        setAffiliateLinks(linksData);
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Could not load affiliate links.',
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchLinks();
  }, [toast]);

  const getImage = (id: string) => {
    const imageMap: { [key: string]: string } = {
      'link-1': 'post4', 'link-2': 'post7', 'link-3': 'post1',
      'link-4': 'post6', 'link-5': 'post10', 'link-6': 'media-4',
    };
    const imageId = imageMap[id] || 'post1';
    return PlaceHolderImages.find((img) => img.id === imageId);
  };

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  if (isLoading) {
    return (
      <div className="flex h-[250px] w-full items-center justify-center rounded-lg bg-muted">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (affiliateLinks.length === 0) {
    return null;
  }

  return (
    <section className="w-full py-8 mt-12 bg-muted/30 border-y">
      <div className="container mx-auto">
        <h2 className="mb-6 text-center text-2xl font-bold font-headline">
          Featured Products
        </h2>
        <div className="relative">
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex">
              {affiliateLinks.map((link) => {
                const image = getImage(link.id);
                return (
                  <div
                    key={link.id}
                    className="relative min-w-0 flex-shrink-0 flex-grow-0 basis-full p-2 md:basis-1/3 lg:basis-1/4"
                  >
                    <Card className="group flex h-full flex-col overflow-hidden">
                      <CardContent className="flex flex-grow flex-col p-0">
                        <div className="relative w-full h-[100px]">
                          {image && (
                            <Image
                              src={image.url}
                              alt={link.name}
                              fill
                              className="object-cover transition-transform duration-300 group-hover:scale-105"
                              data-ai-hint={image.hint}
                            />
                          )}
                        </div>
                        <div className="flex flex-grow flex-col p-3">
                          <h3 className="flex-grow text-base font-semibold">
                            {link.name}
                          </h3>
                           <form action={() => trackAndRedirect(link.id)} className="w-full">
                                <Button size="sm" className="mt-3 w-full" type="submit">
                                    Shop Now
                                </Button>
                            </form>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                );
              })}
            </div>
          </div>
          <Button
            variant="outline"
            size="icon"
            className="absolute left-0 top-1/2 -translate-y-1/2 rounded-full hidden md:flex"
            onClick={scrollPrev}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="absolute right-0 top-1/2 -translate-y-1/2 rounded-full hidden md:flex"
            onClick={scrollNext}
          >
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}
