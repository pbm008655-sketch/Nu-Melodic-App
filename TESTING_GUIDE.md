# Music Streaming Platform - Testing Guide

## Getting Started

**Platform URL:** [Your deployed .replit.app URL will go here]

This guide will help you test all features of the music streaming platform. The platform includes user authentication, subscription payments, music streaming, and admin features.

## Demo Account (For Quick Testing)

**Username:** demo  
**Password:** password

Use this account to quickly access subscriber features without creating a new account.

## Testing User Registration & Authentication

### 1. Create a New Account
- Click "Sign Up" or go to `/auth`
- Fill in the registration form with:
  - Username (unique)
  - Email address
  - Password
- Submit the form
- You should be automatically logged in

### 2. Login/Logout Testing
- Use the login form with your credentials
- Test the logout functionality
- Verify session persistence (refresh the page while logged in)

## Testing Music Features (Free Users)

### Browse Music Collection
- Visit the homepage to see featured albums and tracks
- Click on album covers to view album details
- Test the music player controls:
  - Play/pause buttons
  - Volume controls
  - Progress bar
  - Next/previous track navigation

### Search and Discovery
- Browse different albums and tracks
- Test responsive design on mobile devices
- Check loading states and error handling

## Testing Subscription System

### View Subscription Plans
- Go to `/subscriptions` to see available plans:
  - **Basic Plan:** $1.75/month
  - **Premium Plan:** $25.00/year

### Test Stripe Payment (Option 1)
1. Click "Pay with Stripe" for either plan
2. Use these test card numbers:
   - **Visa:** 4242 4242 4242 4242
   - **Mastercard:** 5555 5555 5555 4444
   - **Any future expiry date** (e.g., 12/25)
   - **Any 3-digit CVC** (e.g., 123)
3. Complete the payment flow
4. Verify subscription status updates

### Test PayPal Payment (Option 2)
1. Click "Pay with PayPal" or go to `/paypal-subscription`
2. Select between Basic and Premium plans
3. Click the PayPal button
4. Use PayPal sandbox credentials (or cancel to test cancellation)
5. Verify the correct amount is charged ($1.75 or $25.00)

## Testing Premium Features (After Subscription)

### Enhanced Music Experience
- Test ad-free playback
- Verify unlimited skips
- Check high-quality audio streaming
- Test offline download capabilities (if implemented)

### Playlist Management
- Create new playlists
- Add/remove tracks from playlists
- Test playlist navigation and playback

## Testing Admin Features (Admin Access Required)

### Album Upload
- Go to `/admin` 
- Test single track upload
- Test album creation with multiple tracks
- Verify file size limits (up to 400MB per track)

### Content Management
- Upload album covers
- Edit album/track metadata
- Test bulk upload functionality

### Analytics Dashboard
- Visit `/analytics` to view:
  - Play counts by track
  - User listening statistics
  - Popular albums and tracks
  - Revenue metrics

### Storage Management
- Check `/storage` for:
  - Current storage usage
  - File system statistics
  - Database size information

## Mobile Testing

### Responsive Design
- Test on various screen sizes
- Verify mobile navigation menu
- Check touch controls for music player
- Test mobile payment flows

### Mobile-Specific Features
- Test mobile audio playback
- Verify background playback capabilities
- Check notification controls (if implemented)

## Error Testing

### Network & Connectivity
- Test with slow internet connection
- Test offline behavior
- Verify error messages are user-friendly

### Payment Error Scenarios
- Test with declined test cards:
  - **Declined Card:** 4000 0000 0000 0002
  - **Insufficient Funds:** 4000 0000 0000 9995
- Test PayPal cancellation flow
- Verify proper error handling and user feedback

### File Upload Errors
- Test uploading unsupported file types
- Test exceeding file size limits
- Test network interruption during upload

## Security Testing

### Authentication Security
- Test password requirements
- Verify session management
- Test unauthorized access to protected routes

### Payment Security
- Verify secure payment processing
- Test that sensitive data isn't exposed
- Check HTTPS enforcement

## Performance Testing

### Loading Times
- Test initial page load speeds
- Check music streaming start times
- Verify image loading performance

### Concurrent Users
- Have multiple people test simultaneously
- Check for any performance degradation
- Test payment processing under load

## Reporting Issues

When reporting bugs or issues, please include:

1. **Steps to reproduce** the issue
2. **Expected behavior** vs **actual behavior**
3. **Browser and device** information
4. **Screenshots or error messages** if applicable
5. **Account type** used for testing (demo, new account, etc.)

## Test Scenarios Checklist

- [ ] User registration and authentication
- [ ] Music browsing and playback
- [ ] Stripe payment flow (both plans)
- [ ] PayPal payment flow (both plans)
- [ ] Subscription status verification
- [ ] Premium features access
- [ ] Mobile responsiveness
- [ ] Admin upload functionality
- [ ] Analytics dashboard
- [ ] Error handling and recovery
- [ ] Performance across devices

## Important Notes

- This is a test environment using sandbox payment processors
- No real money will be charged during testing
- All uploaded content should be appropriate for testing
- Admin features require special access permissions

---

**Questions or Issues?** Contact the development team with any feedback or issues discovered during testing.