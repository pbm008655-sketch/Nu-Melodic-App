# NU MELODIC - Personal Music Streaming Service

## Overview

NU MELODIC is a full-stack music streaming application built with React, Express, and PostgreSQL. It provides users with the ability to stream music, create playlists, and offers premium subscription features. The application includes comprehensive music playback functionality, user authentication, payment processing through Stripe and PayPal, and administrative tools for content management.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The client-side is built with React and TypeScript using Vite as the build tool. The frontend follows a component-based architecture with:
- **UI Framework**: Radix UI components with Tailwind CSS for styling
- **State Management**: React Query for server state management and custom React contexts for client state
- **Routing**: Wouter for lightweight client-side routing
- **Audio Management**: Custom global audio manager to handle music playback across the application
- **Authentication**: Context-based authentication system with protected routes
- **PWA Support**: Progressive Web App capabilities with offline support, installability on iOS and Android devices

### Backend Architecture
The server uses Express.js with TypeScript and follows a RESTful API design:
- **Database Access**: Drizzle ORM for type-safe database operations
- **Authentication**: Passport.js with local strategy and express-session for session management
- **File Upload**: Multer for handling large audio file uploads with chunked upload support
- **API Structure**: Centralized route handling with authentication middleware

### Database Schema
PostgreSQL database with the following main entities:
- **Users**: Authentication and subscription management
- **Albums**: Music album metadata with support for custom imported albums
- **Tracks**: Individual songs with file references and metadata
- **Playlists**: User-created collections of tracks
- **Track Plays**: Analytics data for play count tracking

### Audio Playback System
Custom audio management system that ensures only one track plays at a time:
- Global audio instance pattern to prevent multiple simultaneous playbacks
- Preview mode for non-premium users (30-second previews)
- Support for multiple audio formats (MP3, WAV)
- Playback controls including shuffle, repeat, and volume management

### File Management
Robust file upload and storage system:
- Support for large audio files (up to 2GB) with chunked uploading
- Automatic file organization in public directories
- Audio file processing and metadata extraction
- Cover image handling with preview generation

### Premium Features
Two-tier user system with premium subscription support:
- Free users get 30-second preview access
- Premium users get full track access and additional features
- Download functionality for premium users

### Progressive Web App (PWA) Features
NU MELODIC is now a fully installable Progressive Web App:
- **Installable on Mobile**: Users can install the app on iOS (Safari) and Android devices
- **Offline Support**: Service worker caching for core app functionality
- **App-like Experience**: Standalone display mode, custom splash screen, and theme colors
- **Install Prompts**: Smart install prompts for both iOS and Android with dismissible UI
- **Manifest Configuration**: Complete PWA manifest with app metadata and icons
- **No App Store Required**: Direct installation from browser without App Store/Play Store approval

## External Dependencies

### Payment Processing
- **Stripe**: Fully functional payment processor for subscription management
- **PayPal**: FULLY FUNCTIONAL - Successfully processing real payments with subscription management, SDK loading correctly, payment buttons rendering properly

### Database
- **Neon Database**: PostgreSQL hosting with serverless architecture
- **Drizzle ORM**: Type-safe database operations and migrations

### Audio Processing
- **music-metadata**: Library for extracting metadata from audio files
- **Web Audio API**: Browser-native audio processing capabilities

### UI and Styling
- **Radix UI**: Accessible component primitives
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library

### Development and Build Tools
- **Vite**: Fast build tool and development server
- **TypeScript**: Type safety across the entire application
- **ESBuild**: Fast bundling for production builds

### Session and State Management
- **connect-pg-simple**: PostgreSQL session store
- **React Query**: Server state management and caching
- **React Hook Form**: Form state management with validation

### File Processing
- **Multer**: Multipart form data handling for file uploads
- **Sharp**: Image processing (if needed for cover art)