
import { PublicFooter } from '@/components/blog/public-footer';
import { PublicHeader } from '@/components/blog/public-header';
import { ExpandableBanner } from '@/components/expandable-banner';

export function PublicPage({ title, children }: { title: string, children: React.ReactNode }) {
    return (
        <div className="bg-background text-foreground">
            <ExpandableBanner />
            <PublicHeader />
            <main className="w-full py-12">
                <div className="max-w-4xl mx-auto px-4 lg:px-6">
                    <h1 className="text-4xl md:text-6xl font-bold font-headline mt-4 mb-8 text-center">{title}</h1>
                    <div className="prose dark:prose-invert prose-lg max-w-none mx-auto space-y-4">
                        {children}
                    </div>
                </div>
            </main>
            <PublicFooter />
        </div>
    );
}
