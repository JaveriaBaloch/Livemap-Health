# Firebase SMS Authentication Setup Guide

## 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter your project name (e.g., "livemap-healthcare")
4. Follow the setup wizard

## 2. Enable Authentication

1. In the Firebase console, go to **Authentication**
2. Click **Get started**
3. Go to **Sign-in method** tab
4. Enable **Phone** authentication
5. Add your domain (localhost:3000 for development)

## 3. Get Firebase Configuration

1. Go to **Project Settings** (gear icon)
2. In the **General** tab, scroll down to **Your apps**
3. Click **Web app** icon `</>`
4. Register your app with a name (e.g., "livemap-web")
5. Copy the configuration object

## 4. Update Environment Variables

Replace the Firebase configuration in your `.env.local` file:

```env
# --- Firebase SMS Authentication ---
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdefghijklmnop
```

## 5. Configure Domain Authorization

1. In Firebase Console → Authentication → Settings
2. Under **Authorized domains**, add:
   - `localhost` (for development)
   - Your production domain

## 6. Phone Number Testing

For testing, you can add test phone numbers:
1. Go to Authentication → Sign-in method → Phone
2. Scroll down to **Phone numbers for testing**
3. Add your phone number with a verification code (e.g., `+4917628209767` → `123456`)

## 7. Important Notes

### Development vs Production
- **Development**: Uses test phone numbers and reCAPTCHA
- **Production**: Requires real phone verification and proper domain setup

### Cost Considerations
- Firebase Authentication is free for most use cases
- SMS messages have costs based on region
- Check [Firebase Pricing](https://firebase.google.com/pricing) for details

### Security
- Never commit your Firebase config to public repositories
- Use environment variables for all sensitive data
- Enable App Check in production for additional security

## 8. Testing the Implementation

1. Start your development server: `npm run dev`
2. Try registering with your phone number
3. Check the browser console for Firebase logs
4. For test numbers, use the verification code you set up

## 9. Troubleshooting

### Common Issues:
- **reCAPTCHA not loading**: Check domain authorization
- **SMS not sending**: Verify phone number format (+country code)
- **Configuration error**: Double-check environment variables
- **Test number not working**: Ensure it's added in Firebase Console

### Debug Steps:
1. Check browser console for Firebase errors
2. Verify Firebase configuration in Network tab
3. Test with Firebase Console test phone numbers first