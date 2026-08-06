
'use server';

import { redirect } from 'next/navigation';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { AffiliateLink } from '@/lib/types';

export async function trackAndRedirect(linkId: string) {
  if (!linkId) {
    console.error('Track and Redirect Error: No Link ID provided.');
    // Redirect to a safe fallback page
    redirect('/');
  }

  const linkRef = doc(db, 'affiliateLinks', linkId);

  try {
    const docSnap = await getDoc(linkRef);

    if (docSnap.exists()) {
      const linkData = docSnap.data() as AffiliateLink;

      // Simulate a random earning between $0.05 and $1.25 for a click
      const randomEarning = Math.random() * 1.20 + 0.05;

      // Update the document in Firestore
      await updateDoc(linkRef, {
        clicks: increment(1),
        earnings: increment(randomEarning)
      });
      
      // Redirect the user to the affiliate URL
      redirect(linkData.url);
    } else {
      console.error(`Affiliate link with ID "${linkId}" not found.`);
      redirect('/');
    }
  } catch (error) {
    console.error('Error tracking click:', error);
    // If there's an error, redirect to a safe fallback page
    redirect('/');
  }
}
