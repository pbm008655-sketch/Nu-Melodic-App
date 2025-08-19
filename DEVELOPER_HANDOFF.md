# MeloStream - Developer Handoff Documentation

## Project Overview
MeloStream is a fully functional music streaming platform with dual payment processing (Stripe + PayPal), user authentication, premium subscription tiers, and comprehensive admin tools for music management.

## Current Status: ✅ PRODUCTION READY
- **Revenue Generation**: Both Stripe and PayPal payments working and confirmed
- **User Authentication**: Complete auth system with session management
- **Music Streaming**: 30-second previews for free users, unlimited for premium
- **Admin System**: Full music upload and management capabilities
- **Database**: PostgreSQL with Drizzle ORM, fully seeded and operational

## Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling and development server
- **Wouter** for client-side routing
- **TanStack Query** for server state management
- **Radix UI** components with Tailwind CSS
- **React Hook Form** with Zod validation

### Backend
- **Express.js** with TypeScript
- **Passport.js** for authentication (local strategy)
- **Express Session** with PostgreSQL store
- **Multer** for file uploads (supports up to 2GB audio files)
- **Music Metadata** library for audio file processing

### Database
- **PostgreSQL** (Neon Database hosting)
- **Drizzle ORM** for type-safe database operations
- **Automatic migrations** via `npm run db:push`

### Payment Processing
- **Stripe**: Full subscription management with webhooks
- **PayPal**: Subscription processing with sandbox/production support

## Project Structure

```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Route components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utilities and configurations
│   │   └── index.css       # Global styles
├── server/                 # Express backend
│   ├── auth.ts            # Authentication setup
│   ├── db.ts              # Database connection
│   ├── routes.ts          # API endpoints
│   ├── storage.ts         # Database operations
│   ├── paypal.ts          # PayPal integration
│   └── index.ts           # Server entry point
├── shared/                 # Shared TypeScript types
│   └── schema.ts          # Database schema and types
├── public/                 # Static assets
│   ├── audio/             # Audio files
│   └── covers/            # Album artwork
└── package.json           # Dependencies and scripts
```

## Key Features Implemented

### 1. User Authentication & Authorization
- Registration/login with username/password
- Session-based authentication with PostgreSQL store
- Protected routes for premium content
- User roles (admin capabilities for user ID 1)

### 2. Music Streaming System
- Global audio manager prevents multiple simultaneous playbacks
- 30-second preview system for non-premium users
- Full track access for premium subscribers
- Support for MP3, WAV, and other audio formats
- Playback controls: play/pause, seek, volume, shuffle, repeat

### 3. Payment & Subscription Management
- **Stripe Integration**: Complete subscription workflows
- **PayPal Integration**: Confirmed working with real payments
- Premium tier unlocks full music access
- Subscription management (cancel, reactivate)
- Annual billing at $25/year

### 4. Admin Music Management
- Drag-and-drop album upload (up to 400MB per track)
- Automatic metadata extraction from audio files
- Bulk upload support with progress tracking
- File management (delete tracks/albums)
- Cover art upload and management

### 5. Music Discovery & Organization
- Featured albums and tracks
- Recently added content
- User-created playlists
- Search functionality
- Album and track browsing

## Database Schema

### Core Tables
- **users**: Authentication and subscription data
- **albums**: Music album metadata
- **tracks**: Individual song information
- **playlists**: User-created track collections
- **playlist_tracks**: Many-to-many relationship
- **track_plays**: Analytics for play tracking

### Key Relationships
- Users → Playlists (one-to-many)
- Albums → Tracks (one-to-many)
- Playlists ↔ Tracks (many-to-many)

## Environment Variables Required

```bash
# Database
DATABASE_URL=postgresql://...

# Stripe
STRIPE_SECRET_KEY=sk_...
VITE_STRIPE_PUBLIC_KEY=pk_...

# PayPal
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...

# Session
SESSION_SECRET=your-session-secret
```

## Development Commands

```bash
# Install dependencies
npm install

# Start development server (frontend + backend)
npm run dev

# Database operations
npm run db:push          # Push schema changes
npm run db:studio        # Open Drizzle Studio

# Production build
npm run build
```

## API Endpoints

### Authentication
- `POST /api/register` - User registration
- `POST /api/login` - User login
- `POST /api/logout` - User logout
- `GET /api/user` - Get current user

### Music Content
- `GET /api/albums` - List all albums
- `GET /api/albums/:id` - Get album with tracks
- `GET /api/tracks/:id` - Get track details
- `GET /api/featured-albums` - Featured content
- `GET /api/featured-tracks` - Featured tracks

### Playlists
- `GET /api/playlists` - User playlists
- `POST /api/playlists` - Create playlist
- `POST /api/playlists/:id/tracks` - Add track to playlist

### Admin
- `POST /api/admin/upload-album` - Upload new album
- `DELETE /api/admin/delete-file` - Delete audio/image files
- `GET /api/admin/storage-monitor` - File system monitoring

### Payments
- `POST /api/upgrade-to-premium` - Simple premium upgrade
- `POST /api/paypal-subscription-success` - PayPal webhook
- `POST /api/cancel-paypal-subscription` - Cancel subscription

## Security Features

### Authentication
- Password hashing with scrypt
- Session-based authentication
- CSRF protection via same-site cookies
- Protected admin routes

### File Upload Security
- File type validation (audio/image only)
- Size limits (2GB max per file)
- Path traversal prevention
- Secure file storage in public directory

### API Security
- Authentication middleware on protected routes
- Input validation with Zod schemas
- SQL injection prevention via Drizzle ORM

## Deployment Considerations

### Production Setup
1. Set environment variables for production
2. Configure database connection string
3. Set up payment processor webhooks
4. Configure file upload limits
5. Enable HTTPS for secure payments

### Scaling Recommendations
- Implement CDN for audio file delivery
- Add Redis for session storage at scale
- Consider separate file storage service (AWS S3)
- Implement rate limiting for API endpoints
- Add monitoring and logging

## Known Issues & Technical Debt

### Minor Issues
- DOM nesting warning in home page (nested anchor tags)
- Browserslist data needs updating (cosmetic warning)
- LSP errors in routes.ts (TypeScript configuration)

### Future Enhancements
- Audio transcoding for consistent formats
- Playlist sharing between users
- Mobile app development
- Advanced analytics dashboard
- Social features (comments, reviews)

## Support & Maintenance

### Database Maintenance
- Regular backups via Neon Database
- Schema migrations via Drizzle
- Query optimization monitoring

### Payment Processing
- Monitor Stripe dashboard for failed payments
- PayPal sandbox vs production environment switching
- Subscription analytics and reporting

### File Management
- Regular cleanup of orphaned files
- Audio file compression optimization
- Backup strategy for user uploads

## Contact Information
- **Database**: Neon PostgreSQL hosting
- **Payments**: Stripe + PayPal sandbox accounts configured
- **Hosting**: Replit platform with auto-scaling
- **Domain**: Custom domain can be configured via Replit

---

## Quick Start for New Developer

1. Clone the repository
2. Run `npm install`
3. Set up environment variables
4. Run `npm run db:push` to sync database
5. Run `npm run dev` to start development
6. Access admin features with user ID 1
7. Test payments with Stripe test cards or PayPal sandbox

The platform is fully functional and revenue-ready. All core features are implemented and tested.