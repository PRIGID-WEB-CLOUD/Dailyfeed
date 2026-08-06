
export const initialSettings = {
  site: {
    blogName: 'Dailyfeed',
    blogDescription: 'A modern blog for the modern reader.',
    blogUrl: 'https://dailyfeed.com',
  },
  appearance: {
    primaryColor: '240 40% 50%',
    backgroundColor: '240 100% 98%',
    accentColor: '240 60% 94%',
    headlineFont: 'Playfair Display',
    bodyFont: 'PT Sans',
  },
  banner: {
    headline: '🎉 Welcome to the new Dailyfeed!',
    collapsedText:
      ' We have a new look and a new name. We are now Dailyfeed.',
    expandedText:
      ' We are excited to announce that we have a new look and a new name. We are now Dailyfeed. We have a lot of new features and content coming soon. Stay tuned!',
  },
  paywall: {
    enabled: true,
    freeArticlesCount: 3,
    paywallMessageTitle: 'Unlock Premium Content',
    paywallMessageBody: 'You have reached your limit of free articles. Subscribe for unlimited access.',
    paymentProvider: 'stripe',
    premiumArticles: ['the-art-of-minimalism', 'a-deep-dive-into-stoicism'],
  },
  staticPages: {
    about: 'Dailyfeed is a modern publication focused on technology, design, and culture. We believe in quality content and a clean reading experience.',
    contact: 'For inquiries, please email us at contact@dailyfeed.com.',
    terms: 'By using this site, you agree to our terms of service.',
    privacy: 'Your privacy is important to us. We do not share your data with third parties.',
    socialLinks: [
      { platform: 'Twitter', url: 'https://twitter.com' },
      { platform: 'Facebook', url: 'https://facebook.com' },
      { platform: 'Linkedin', url: 'https://linkedin.com' },
    ],
  },
  seo: {
    seoTitleTemplate: '%post_title% | Dailyfeed',
    defaultMetaDescription: 'A modern blog for the modern reader, covering technology, design, and culture.',
    defaultSocialImage: '',
    generateSitemap: true,
    discourageSearchEngines: false,
  },
};

export type AppSettings = typeof initialSettings;
