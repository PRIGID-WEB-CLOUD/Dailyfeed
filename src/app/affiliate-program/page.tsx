
'use client';

import { PublicPage } from '@/components/blog/public-page';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function AffiliateProgramPage() {
  // Assuming a static domain for simplicity now
  const affiliateEmail = `affiliates@dailyfeed.com`;
  return (
    <PublicPage title="Join Our Programs">
        <div className="grid md:grid-cols-2 gap-8 text-left">
            <div className="border p-6 rounded-lg">
                <h2 className="text-2xl font-bold font-headline mb-4">Affiliate Program</h2>
                <p>
                    Join our affiliate program and earn by promoting our content. We offer competitive commissions and a dedicated support team to help you succeed. If you have a blog, a social media following, or an audience that would be interested in what we do, we'd love to partner with you.
                </p>
                <p className="mt-4">
                    Sign up today to get your unique referral link and access to our marketing materials. For more information, please email us at <a href={`mailto:${affiliateEmail}`} className="text-primary hover:underline">{affiliateEmail}</a>.
                </p>
            </div>
             <div className="border p-6 rounded-lg bg-muted/30">
                <h2 className="text-2xl font-bold font-headline mb-4">Advertise With Us</h2>
                <p>
                    Looking to promote your brand, product, or service directly to our audience? We offer a range of advertising opportunities, including sponsored posts, banner ads, and newsletter features.
                </p>
                <p className="mt-4">
                    If you're a business or company interested in paid promotions, please get in touch with our partnerships team through our advertising inquiry form.
                </p>
                <Button asChild className="mt-6">
                    <Link href="/advertise">Submit an Inquiry</Link>
                </Button>
            </div>
        </div>
    </PublicPage>
  );
}
