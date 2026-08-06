
import type { ReactNode } from "react";
import type { Timestamp } from "firebase/firestore";
import type { AppSettings } from "./initial-settings";

export type { AppSettings };

export type Role = {
  id: string;
  name: "Admin" | "Editor" | "Author" | "Contributor";
};

export type BioLayout = 'stack' | 'grid' | 'featured';
export type DomainStatus = 'unconfigured' | 'pending' | 'active' | 'error';

export interface BioLink {
  id: string;
  title: string;
  url: string;
  icon?: string;
}

export interface LinkInBioData {
  name: string;
  description: string;
  links: BioLink[];
  layout: BioLayout;
  domain?: string;
  domainStatus?: DomainStatus;
}

// This type represents the raw data structure from Supabase
export type UserData = {
  id: string;
  name: string;
  avatar: string;
  email: string;
  user_roles: {
    roles: Role | null;
  }[];
};

export type Badge = {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
};

export type UserBadge = {
  id: string;
  assignedAt: Timestamp;
}

export type User = {
  id:string;
  name: string;
  slug: string;
  avatar: string;
  email: string;
  roles: Role[];
  badges?: UserBadge[];
  followingAuthors?: string[];
  followingTags?: string[];
  readingList?: string[];
  createdAt?: Timestamp;
  linkInBio?: LinkInBioData;
  referrals?: number;
  signups?: number;
  earnings?: number;
};

export type MediaType = 'image' | 'video' | 'audio' | 'folder';

export type MediaAsset = {
  id: string;
  description: string;
  url: string;
  type: MediaType;
  hint: string;
  createdAt?: Timestamp;
  folderPath?: string;
};

export type Post = {
  id: string;
  title: string;
  slug: string;
  content: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  category: string;
  status: "Published" | "Draft" | "Scheduled";
  publishedAt: Timestamp;
  imageUrl: string;
  imageHint: string;
  tags: string[];
  comments: number;
  likes: number;
  views: number;
  featured?: boolean;
  premium?: boolean;
  featuredImage?: {
    url?: string;
    alt?: string;
  },
  seo: {
    title: string;
    metaDescription: string;
  };
  createdAt?: Timestamp;
};

export type StatCard = {
  title: string;
  value: string;
  change: string;
  changeType: "increase" | "decrease" | "neutral";
  icon: ReactNode;
};

export interface AffiliateLink {
  id: string;
  name: string;
  url: string;
  clicks: number;
  earnings: number;
  createdAt: Timestamp;
}

export type BackupStatus = 'Completed' | 'In Progress' | 'Failed';

export interface Backup {
  id: string;
  createdAt: Timestamp;
  status: BackupStatus;
  size: string;
  files: number;
  downloadURL?: string;
}

export type CommentStatus = 'Approved' | 'Pending' | 'Spam' | 'Rejected';

export interface Comment {
  id: string;
  author: string;
  authorId: string;
  avatar: string;
  text: string;
  postId: string; 
  postTitle: string; 
  status: CommentStatus;
  createdAt: Timestamp;
  likes: number;
  parentId?: string | null;
}

export interface Tip {
  id: string;
  amount: number;
  authorId: string;
  authorName: string;
  tipperId: string;
  tipperName: string;
  createdAt: Timestamp;
}

export interface CommentWithReplies extends Comment {
  replies: CommentWithReplies[];
}

export type InquiryStatus = 'New' | 'Contacted' | 'Negotiating' | 'Closed' | 'Rejected';

export interface Inquiry {
  id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  website: string;
  message: string;
  status: InquiryStatus;
  createdAt: Timestamp;
}

export interface Subscriber {
  id: string;
  email: string;
  subscribedAt: Timestamp;
}

export interface Subscription {
  id: string;
  userId: string;
  email: string;
  plan: 'Premium Monthly' | 'Premium Yearly';
  status: 'Active' | 'Cancelled' | 'Past Due';
  renewalDate: Timestamp;
  createdAt: Timestamp;
}

export interface Invoice {
    id: string;
    userId: string;
    subscriptionId: string;
    date: Timestamp;
    amount: number;
    status: 'Paid' | 'Failed' | 'Pending';
}


export interface Survey {
  id: string;
  title: string;
  sponsor: string;
  reward: number;
  status: 'Available' | 'Completed';
  questions: {
    id: string;
    text: string;
    options: string[];
  }[];
  createdAt: Timestamp;
}

export interface Poll {
  id: string;
  question: string;
  options: Record<string, number>;
  totalVotes: number;
  createdAt: Timestamp;
}

export interface ReaderEvent {
  id: string;
  title: string;
  description: string;
  host: string;
  date: Timestamp;
  link: string;
  createdAt: Timestamp;
}

export interface Notification {
    id: string;
    message: string;
    slug: string;
    date: Timestamp;
    authorId: string;
    tags: string[];
}

export interface Supporter {
  id: string;
  name: string;
  website: string;
  logoUrl: string;
  description: string;
  hint?: string;
}
