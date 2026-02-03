# NU MELODIC - iOS App Store Submission Guide

## Prerequisites
- Mac computer with Xcode 15+ installed
- Apple Developer account (enrolled in Apple Developer Program)
- Your app's production URL: https://music-stream-pro-pbm2.replit.app

## Step 1: Prepare Your Mac Environment

1. Install Xcode from the Mac App Store
2. Open Xcode and accept the license agreement
3. Install Xcode Command Line Tools:
   ```bash
   xcode-select --install
   ```

## Step 2: Clone and Set Up the Project

1. Download this project to your Mac
2. Open Terminal and navigate to the project folder
3. Install dependencies:
   ```bash
   npm install
   ```

## Step 3: Build the Web App

```bash
npm run build
```

## Step 4: Add iOS Platform

```bash
npx cap add ios
npx cap sync ios
```

## Step 5: Open in Xcode

```bash
npx cap open ios
```

This opens the iOS project in Xcode.

## Step 6: Configure Xcode Project

In Xcode:

1. **Select your Team**:
   - Click on "App" in the project navigator
   - Go to "Signing & Capabilities" tab
   - Select your Apple Developer team
   - Xcode will create provisioning profiles automatically

2. **Set Bundle Identifier**:
   - Use: `com.numelodic.app` (or your preferred identifier)
   - Must be unique on the App Store

3. **Set Version and Build Number**:
   - Version: `1.0.0`
   - Build: `1`

4. **App Icons**:
   - In project navigator, open `App > Assets > AppIcon`
   - Drag the provided icon files to each slot, or use a single 1024x1024 image

## Step 7: Configure App Transport Security

The Info.plist is already configured to allow your server URL. If you need to modify:

1. Open `ios/App/App/Info.plist`
2. Ensure `NSAppTransportSecurity` allows your domain

## Step 8: Test on Simulator

1. Select an iPhone simulator from the device dropdown
2. Click the Play button to build and run
3. Test all features: login, music playback, playlists

## Step 9: Test on Real Device

1. Connect your iPhone via USB
2. Select your device from the dropdown
3. Build and run on the device
4. Test audio playback and background audio

## Step 10: Archive for App Store

1. Select "Any iOS Device" from the device dropdown
2. Go to Product > Archive
3. Wait for the build to complete
4. In the Organizer window, click "Distribute App"
5. Choose "App Store Connect"
6. Follow the prompts to upload

## Step 11: App Store Connect Setup

Go to https://appstoreconnect.apple.com:

1. **Create New App**:
   - Click the "+" button > "New App"
   - Platform: iOS
   - Name: NU MELODIC
   - Bundle ID: Select your app's bundle ID
   - SKU: numelodic-ios-1
   - Primary Language: English (US)

2. **App Information**:
   - Category: Music
   - Content Rights: Confirm you own or have rights to all content

3. **Pricing and Availability**:
   - Set your price (or Free)
   - Select countries for availability

4. **App Privacy**:
   - Privacy Policy URL: https://music-stream-pro-pbm2.replit.app/privacy-policy.html
   - Data collection: Email address, usage data (as applicable)

5. **Screenshots** (required):
   - 6.7" Display (iPhone 15 Pro Max): 1290 x 2796 pixels
   - 6.5" Display (iPhone 14 Plus): 1284 x 2778 pixels
   - 5.5" Display (iPhone 8 Plus): 1242 x 2208 pixels
   - iPad Pro 12.9": 2048 x 2732 pixels (if supporting iPad)

6. **App Description**:
   ```
   NU MELODIC - Your Personal Music Streaming Service
   
   Stream original music from artist [Your Artist Name]. Featuring exclusive tracks, albums, and playlists you won't find anywhere else.
   
   Features:
   • Stream high-quality original music
   • Create and manage personal playlists
   • Works with Amazon Alexa for voice control
   • Premium subscription for full track access
   • Beautiful dark-themed interface
   
   All music on NU MELODIC is original content created by the artist who owns full copyright.
   ```

7. **Keywords**:
   ```
   music,streaming,original,indie,playlist,audio,songs
   ```

8. **Support URL**: https://music-stream-pro-pbm2.replit.app

9. **Version Information**:
   - What's New: Initial release

## Step 12: Submit for Review

1. Upload your build from Xcode
2. In App Store Connect, select the build
3. Complete all required information
4. Click "Submit for Review"

## Review Timeline
- Apple typically reviews apps within 24-48 hours
- You'll receive email notifications about status changes

## Common Rejection Reasons to Avoid

1. **Incomplete functionality**: Ensure all features work
2. **Missing privacy policy**: Already set up at /privacy-policy.html
3. **Broken links**: Test all navigation
4. **Placeholder content**: Remove any test/demo content
5. **Audio not working**: Test audio playback thoroughly

## Background Audio (Important!)

For music apps, enable background audio:

1. In Xcode, select your app target
2. Go to "Signing & Capabilities"
3. Click "+ Capability"
4. Add "Background Modes"
5. Check "Audio, AirPlay, and Picture in Picture"

## App Icon Sizes Needed

Create these icon sizes from your 1024x1024 source:
- 1024x1024 (App Store)
- 180x180 (iPhone @3x)
- 120x120 (iPhone @2x)
- 167x167 (iPad Pro)
- 152x152 (iPad)
- 76x76 (iPad @1x)
- 40x40, 60x60, 58x58, 87x87, 80x80 (various uses)

Use a tool like https://appicon.co to generate all sizes from one image.

## Need Help?

If you encounter issues during the submission process, common solutions:
- Ensure your Apple Developer account is in good standing
- Verify all required metadata is filled out
- Check that your app works without network errors
- Review Apple's App Store Review Guidelines
