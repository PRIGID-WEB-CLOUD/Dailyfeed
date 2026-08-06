

import type { User, Role, Badge, LinkInBioData } from '@/lib/types';
import { Award, BookOpen, MessageCircle, Heart, Star } from 'lucide-react';
import { Timestamp } from 'firebase/firestore';


export const MOCK_ROLES: Role[] = [
  { id: '1', name: 'Admin' },
  { id: '2', name: 'Editor' },
  { id: '3', name: 'Author' },
  { id: '4', name: 'Contributor' },
];

export const MOCK_BADGES: Badge[] = [
  { id: 'badge-1', name: 'Founding Member', description: 'Joined in the first month!', icon: Star },
  { id: 'badge-2', name: 'Top Commenter', description: 'Left over 50 comments.', icon: MessageCircle },
  { id: 'badge-3', name: 'Bookworm', description: 'Read 100 articles.', icon: BookOpen },
  { id: 'badge-4', name: 'Super Supporter', description: 'Subscribed for over a year.', icon: Heart },
  { id: 'badge-5', name: 'Century Club', description: 'Wrote 100 posts.', icon: Award },
];

export const initialUser: User = {
  id: 'user-1',
  name: 'Elara Vance',
  slug: 'elara-vance',
  email: 'elairshisdeboi@gmail.com',
  avatar: 'avatar1',
  roles: [MOCK_ROLES[0]],
  badges: [
    { id: 'badge-1', assignedAt: Timestamp.now() },
    { id: 'badge-2', assignedAt: Timestamp.now() },
  ],
  followingAuthors: ['user-2'],
  followingTags: ['Technology'],
};

export const initialLinkInBioData: Omit<LinkInBioData, 'name'> = {
  description: 'Writer, designer, and tech enthusiast. Welcome to my corner of the internet.',
  links: [
    { id: '1', title: 'My Latest Blog Post', url: '#', icon: 'Link' },
    { id: '2', title: 'Follow me on Twitter', url: '#', icon: 'Twitter' },
  ],
  layout: 'stack',
  domain: '',
  domainStatus: 'unconfigured',
};
