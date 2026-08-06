

import { doc, getDoc, setDoc, serverTimestamp, collection, query, where, getDocs, Timestamp } from "firebase/firestore";
import { db } from "./firebase";
import type { User, UserBadge, LinkInBioData } from "./types";
import { MOCK_ROLES } from "./mock-data";
import slugify from "slugify";

const initialLinkInBioData: Omit<LinkInBioData, 'name'> = {
  description: 'Writer, designer, and tech enthusiast. Welcome to my corner of the internet.',
  links: [
    { id: '1', title: 'My Latest Blog Post', url: '#', icon: 'Link' },
    { id: '2', title: 'Follow me on Twitter', url: '#', icon: 'Twitter' },
  ],
  layout: 'stack',
  domain: '',
  domainStatus: 'unconfigured',
};


/**
 * Creates a new user profile document in Firestore.
 * @param uid The user's unique ID from Firebase Auth.
 * @param name The user's full name.
 * @param email The user's email address.
 */
export async function createUserProfile(uid: string, name: string, email: string): Promise<void> {
  const userRef = doc(db, "users", uid);
  
  const newUser: Omit<User, 'id' | 'createdAt'> = {
    name,
    email,
    slug: slugify(name, { lower: true, strict: true }),
    avatar: 'avatar1', // Default avatar
    roles: [MOCK_ROLES.find(r => r.name === 'Contributor')!], // Default to "Contributor" role for public signups
    badges: [{ id: 'badge-1', assignedAt: Timestamp.now() }], // "Founding Member" badge
    followingAuthors: [],
    followingTags: [],
    readingList: [],
    linkInBio: {
      ...initialLinkInBioData,
      name: name,
    },
    referrals: 0,
    signups: 0,
    earnings: 0,
  };

  await setDoc(userRef, {
      ...newUser,
      createdAt: serverTimestamp(),
  });
}

/**
 * Retrieves a user profile from Firestore.
 * @param uid The user's unique ID.
 * @returns The user's profile data, or null if not found.
 */
export async function getUserProfile(uid: string): Promise<User | null> {
  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    const data = userSnap.data();
    return {
      id: userSnap.id,
      ...data,
    } as User;
  } else {
    console.warn(`No user profile found for UID: ${uid}`);
    return null;
  }
}
