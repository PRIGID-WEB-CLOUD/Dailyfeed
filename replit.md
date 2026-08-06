# Dailyfeed - Next.js Blog Platform

## Overview
Dailyfeed is a modern blog platform built with Next.js 15, Firebase, and various integrations including Stripe for payments, Mailchimp for newsletters, and AI features powered by Google Genkit.

## Recent Changes
**November 5, 2025** - Migrated from Vercel to Replit
- Updated dev and start scripts to bind to 0.0.0.0:5000 for Replit compatibility
- Configured Firebase environment variables via Replit Secrets
- Set up deployment configuration for Replit autoscale
- Application successfully running on Replit

## Project Architecture

### Tech Stack
- **Framework**: Next.js 15.3.3 (App Router with Turbopack)
- **Backend**: Firebase (Auth, Firestore, Storage)
- **UI**: React 18 with Radix UI components
- **Styling**: Tailwind CSS
- **Payments**: Stripe
- **Newsletter**: Mailchimp
- **AI**: Google Genkit
- **Forms**: React Hook Form with Zod validation

### Key Directories
- `src/app/` - Next.js App Router pages and layouts
- `src/components/` - React components organized by feature
- `src/lib/` - Service layer for Firebase, integrations, and utilities
- `src/contexts/` - React context providers
- `src/hooks/` - Custom React hooks
- `src/ai/` - AI features using Google Genkit

### Environment Configuration

#### Required Secrets (via Replit Secrets)
The following environment variables must be configured in Replit Secrets:
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

These can be found in your Firebase Console under Project Settings > General > Your apps.

#### Firebase Configuration
Firebase is initialized in `src/lib/firebase.ts` with two separate app instances:
- Primary app for public user authentication
- Admin app for admin authentication (prevents session conflicts)

### Development

#### Running Locally
```bash
npm install
npm run dev
```
The dev server runs on port 5000 and binds to 0.0.0.0 for Replit compatibility.

#### Other Scripts
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript compiler checks
- `npm run genkit:dev` - Start Genkit AI development server
- `npm run genkit:watch` - Start Genkit with watch mode

### Deployment
The project is configured for Replit's autoscale deployment:
- **Build**: `npm run build`
- **Start**: `npm run start` (binds to 0.0.0.0:5000)

To publish, use the Replit publish button. Make sure all required secrets are configured before deployment.

### Security Notes
- All Firebase credentials are stored in Replit Secrets (never committed to code)
- Client/server separation is maintained through Next.js App Router
- Firebase uses separate auth instances for public and admin users
- TypeScript and ESLint errors are ignored during builds (consider addressing for production)

### Known Configuration
- TypeScript build errors are ignored (`ignoreBuildErrors: true`)
- ESLint errors are ignored during builds (`ignoreDuringBuilds: true`)
- Image optimization configured for: placehold.co, unsplash.com, picsum.photos, Firebase Storage

### Future Improvements
- Consider adding `allowedDevOrigins` to `next.config.ts` to eliminate cross-origin dev warnings
- Address TypeScript and ESLint errors for better code quality
- Test production build locally before deploying
