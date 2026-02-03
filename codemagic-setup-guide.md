# Codemagic iOS Build Setup Guide

This guide will help you build and publish your NU MELODIC app to the Apple App Store using Codemagic's cloud build service.

## Prerequisites

- Apple Developer account (you have this!)
- GitHub, GitLab, or Bitbucket account to host your code
- Codemagic account (free tier available)

## Step 1: Push Your Code to GitHub

1. Create a new repository on GitHub
2. Push this project to your repository:
   ```bash
   git remote add github https://github.com/YOUR_USERNAME/nu-melodic.git
   git push github main
   ```

## Step 2: Create Codemagic Account

1. Go to [codemagic.io](https://codemagic.io)
2. Click "Start building for free"
3. Sign up with your GitHub account
4. Authorize Codemagic to access your repositories

## Step 3: Add Your App to Codemagic

1. In Codemagic dashboard, click "Add application"
2. Select your repository (nu-melodic)
3. Click "Set up build"
4. Codemagic will automatically detect the `codemagic.yaml` file

## Step 4: Connect Apple Developer Account

This is the most important step - it allows Codemagic to sign your app.

1. In your app settings, go to **Integrations** > **Developer Portal**
2. Click "Connect" next to Apple Developer Portal
3. Choose **App Store Connect API key** (recommended):
   
   a. Go to [App Store Connect](https://appstoreconnect.apple.com)
   b. Navigate to Users and Access > Keys
   c. Click the "+" to create a new key
   d. Name: "Codemagic"
   e. Access: "App Manager" or "Admin"
   f. Download the .p8 file (you can only download once!)
   g. Note the Key ID and Issuer ID
   
4. Back in Codemagic, enter:
   - Issuer ID
   - Key ID
   - Upload the .p8 file

## Step 5: Set Up Code Signing

1. In your app settings, go to **Code signing** > **iOS**
2. Click "Fetch signing files"
3. Select your app's bundle ID: `com.numelodic.app`
4. Codemagic will automatically create/fetch:
   - Distribution certificate
   - App Store provisioning profile

## Step 6: Create App in App Store Connect

Before building, create your app in App Store Connect:

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Click "My Apps" > "+" > "New App"
3. Fill in:
   - Platform: iOS
   - Name: NU MELODIC
   - Bundle ID: com.numelodic.app
   - SKU: numelodic-001
   - Primary Language: English (US)
4. Save the app

## Step 7: Add App Store App ID to Codemagic

1. In App Store Connect, find your app's Apple ID (in App Information)
2. In Codemagic, go to Environment variables
3. Add variable:
   - Name: `APP_STORE_APP_ID`
   - Value: Your app's Apple ID (numeric)
   - Check "Secure"

## Step 8: Prepare App Store Listing

In App Store Connect, prepare:

1. **App Information**:
   - Category: Music
   - Privacy Policy URL: `https://music-stream-pro-pbm2.replit.app/privacy-policy.html`

2. **Screenshots** (required sizes):
   - iPhone 6.7" (1290 x 2796)
   - iPhone 6.5" (1284 x 2778)
   - iPhone 5.5" (1242 x 2208)

3. **Description**:
   ```
   NU MELODIC - Your Personal Music Streaming Service
   
   Stream original music featuring exclusive tracks and albums. 
   Create playlists and enjoy high-quality audio streaming.
   
   Features:
   • Stream original music content
   • Create and manage playlists
   • Works with Amazon Alexa
   • Premium subscription available
   ```

4. **Keywords**: music, streaming, original, indie, audio, playlist

5. **Support URL**: `https://music-stream-pro-pbm2.replit.app`

## Step 9: Create App Icon (1024x1024)

Apple requires a 1024x1024 app icon:

1. Use your existing 512px icon as a base
2. Go to [appicon.co](https://appicon.co)
3. Upload and generate all iOS sizes
4. Download and place in `ios/App/App/Assets.xcassets/AppIcon.appiconset/`

Or Codemagic can use a single 1024x1024 icon if you configure it.

## Step 10: Start Your First Build

1. In Codemagic, click "Start new build"
2. Select the "iOS App Store Build" workflow
3. Click "Start new build"
4. Wait for the build to complete (15-20 minutes)

## Step 11: Submit to TestFlight First

After a successful build:

1. The app will automatically upload to TestFlight
2. In App Store Connect, go to TestFlight
3. Wait for processing (usually 10-30 minutes)
4. Add yourself as a tester
5. Install on your iPhone via TestFlight app
6. Test thoroughly!

## Step 12: Submit to App Store

When ready for public release:

1. In App Store Connect, go to your app
2. Click "+" next to iOS App
3. Select your TestFlight build
4. Complete all required information
5. Click "Submit for Review"

## Troubleshooting

### Build fails at code signing
- Ensure your Apple Developer account is in good standing
- Verify the bundle ID matches exactly
- Try re-fetching signing files in Codemagic

### Build fails at npm install
- Check that package.json has all dependencies
- Ensure Node version is compatible

### App rejected by Apple
- Check rejection email for specific reasons
- Common issues: missing functionality, placeholder content, privacy policy issues

## Costs Summary

- **Codemagic**: 500 free minutes/month (enough for ~25 builds)
- **Apple Developer**: $99/year (you already have this)
- **Per build after free tier**: ~$1.50 (15-20 minutes × $0.095)

## Support

- Codemagic docs: [docs.codemagic.io](https://docs.codemagic.io)
- Apple Developer docs: [developer.apple.com](https://developer.apple.com)
