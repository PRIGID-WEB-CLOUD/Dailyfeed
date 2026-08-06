
'use client';

import Image from 'next/image';
import { AppLogo } from '@/components/app-logo';
import { cn } from '@/lib/utils';
import { ArrowUpRight, Loader2, Smile, Twitter, Linkedin, Youtube, Instagram, Github, Link as LinkIcon } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { notFound, useParams } from 'next/navigation';
import type { LinkInBioData } from '@/lib/types';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const linkClasses = "group flex w-full items-center rounded-lg p-4 text-center font-semibold transition-transform duration-200 hover:scale-105 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white border border-white/30";

type PageData = LinkInBioData & {
    avatarUrl: string;
};

const iconMap: Record<string, { component: React.ReactNode; color: string }> = {
    Link: { component: <LinkIcon />, color: 'text-white' },
    Twitter: { component: <Twitter />, color: 'text-sky-400' },
    Linkedin: { component: <Linkedin />, color: 'text-blue-500' },
    Youtube: { component: <Youtube />, color: 'text-red-500' },
    Instagram: { component: <Instagram />, color: 'text-pink-500' },
    Github: { component: <Github />, color: 'text-gray-300' },
    Smile: { component: <Smile />, color: 'text-yellow-400' },
};

const getIcon = (iconName?: string) => {
    if (iconName && iconMap[iconName]) {
        const { component, color } = iconMap[iconName];
        return React.cloneElement(component as React.ReactElement, { className: `h-5 w-5 mr-3 ${color}` });
    }
    return null;
}


export default function LinksPage() {
  const params = useParams();
  const usernameSlug = params.username as string;
  const [data, setData] = useState<PageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!usernameSlug) return;

    async function fetchData() {
      setIsLoading(true);
      setError(null);
      
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('slug', '==', usernameSlug));

      try {
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
          setError('User not found');
        } else {
          const userDoc = querySnapshot.docs[0];
          const userData = userDoc.data();
          const avatar = PlaceHolderImages.find(p => p.id === userData.avatar);
          
          if (!userData.linkInBio) {
              setError('Link in bio page not configured');
          } else {
              const pageData: PageData = {
                ...userData.linkInBio,
                avatarUrl: avatar?.url || '',
              };
              setData(pageData);
          }
        }
      } catch (e) {
          console.error(e);
          setError('Failed to fetch user data');
      }

      setIsLoading(false);
    }

    fetchData();
  }, [usernameSlug]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-purple-600 via-pink-500 to-red-500">
        <Loader2 className="h-12 w-12 animate-spin text-white" />
      </div>
    );
  }

  if (error || !data) {
    notFound();
  }

  const featuredLink = data.layout === 'featured' && data.links.length > 0 ? data.links[0] : null;
  const otherLinks = data.layout === 'featured' ? data.links.slice(1) : data.links;

  return (
    <div className="min-h-screen w-full font-sans transition-colors bg-gradient-to-br from-purple-600 via-pink-500 to-red-500 text-white">
      <div className="container mx-auto flex min-h-screen flex-col items-center p-4 pt-12 md:p-8">
        <div className="w-full max-w-md">
          <div className="flex flex-col items-center text-center">
            <div className="relative mb-4 h-24 w-24">
              <Image
                src={data.avatarUrl}
                alt={data.name}
                fill
                className="rounded-full object-cover"
              />
            </div>
            <h1 className="text-2xl font-bold">{data.name}</h1>
            <p className="mt-2 text-white/80">
                {data.description}
            </p>
          </div>

          <div className="mt-8 space-y-4">
            {featuredLink && (
              <a
                href={featuredLink.url}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(linkClasses, "bg-white/30 scale-105 hover:scale-110 flex-col h-32 justify-center")}
              >
                <span className="text-lg flex items-center">{getIcon(featuredLink.icon)} {featuredLink.title}</span>
                <span className="text-sm font-normal text-white/80">Featured Link</span>
              </a>
            )}
            <div className={cn(
              "space-y-4",
              data.layout === 'grid' && 'grid grid-cols-2 gap-4 space-y-0'
            )}>
              {otherLinks.map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                      linkClasses,
                      data.layout === 'grid' && 'aspect-square flex-col justify-center text-sm'
                  )}
                >
                  {getIcon(link.icon)}
                  <span className="flex-grow">{link.title}</span>
                  <ArrowUpRight className={cn("h-5 w-5 opacity-0 transition-opacity group-hover:opacity-100", data.layout !== 'stack' && 'hidden')} />
                </a>
              ))}
            </div>
          </div>
        </div>
        <footer className="mt-12 text-center">
          <a
            href="/"
            className="flex items-center gap-2 text-sm text-white/60 transition-opacity hover:opacity-100"
          >
            <AppLogo className="h-5 w-5" />
            <span>Powered by {data.name}</span>
          </a>
        </footer>
      </div>
    </div>
  );
}
