# Google OAuth Setup Guide

This guide will walk you through setting up Google OAuth authentication for your Qala Saku application.

## Prerequisites

- A Google account
- Access to Google Cloud Console
- Your Qala Saku application running locally or deployed

## Step 1: Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top of the page
3. Click "New Project"
4. Enter a project name (e.g., "qala-saku-oauth")
5. Click "Create"

## Step 2: Enable Google+ API

1. In the Google Cloud Console, navigate to "APIs & Services" > "Library"
2. Search for "Google+ API" 
3. Click on it and press "Enable"
4. Also enable "Google Identity" API if not already enabled

## Step 3: Configure OAuth Consent Screen

1. Go to "APIs & Services" > "OAuth consent screen"
2. Choose "External" user type (unless you have a Google Workspace account)
3. Fill in the required information:
   - **App name**: Qala Saku
   - **User support email**: Your email
   - **Developer contact information**: Your email
4. Add your domain to "Authorized domains" if deployed
5. Click "Save and Continue"
6. Add scopes (optional for basic profile info):
   - `../auth/userinfo.email`
   - `../auth/userinfo.profile`
7. Click "Save and Continue"
8. Add test users if in testing mode
9. Click "Save and Continue"

## Step 4: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Choose "Web application" as the application type
4. Enter a name (e.g., "qala-saku-web-client")
5. Add authorized redirect URIs:
   - For local development: `http://localhost:3000/auth/callback`
   - For production: `https://yourdomain.com/auth/callback`
6. Click "Create"
7. Copy the **Client ID** and **Client Secret**

## Step 5: Configure Supabase

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to "Authentication" > "Providers"
4. Find "Google" and click to configure
5. Enable the Google provider
6. Enter your Google OAuth credentials:
   - **Client ID**: The Client ID from Step 4
   - **Client Secret**: The Client Secret from Step 4
7. Set the redirect URL to: `https://your-project-ref.supabase.co/auth/v1/callback`
8. Click "Save"

## Step 6: Update Environment Variables

Add these to your `.env.local` file (they should already exist from your Supabase setup):

```env
# Supabase Configuration (should already exist)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# No additional environment variables needed for Google OAuth
# as it's handled through Supabase configuration
```

## Step 7: Test the Integration

1. Start your development server: `npm run dev`
2. Navigate to `http://localhost:3000/auth/sign-in`
3. Click "Continue with Google"
4. Complete the OAuth flow
5. You should be redirected to the dashboard

## Security Considerations

### 1. Redirect URI Validation
- Always use HTTPS in production
- Only add necessary redirect URIs to your Google OAuth configuration
- Validate redirect URIs on your server side

### 2. State Parameter
Supabase automatically handles CSRF protection through state parameters.

### 3. Token Security
- OAuth tokens are securely managed by Supabase
- Session cookies are httpOnly and secure
- Tokens are automatically refreshed

### 4. User Data Privacy
- Only request necessary scopes
- Inform users about data collection
- Implement proper data retention policies

## Troubleshooting

### Common Issues

1. **"redirect_uri_mismatch" error**
   - Ensure your redirect URI in Google Console matches exactly
   - Check for trailing slashes and protocol (http vs https)

2. **"access_denied" error**
   - User cancelled the OAuth flow
   - Check OAuth consent screen configuration

3. **"invalid_client" error**
   - Check your Client ID and Client Secret in Supabase
   - Ensure the Google project has the correct APIs enabled

4. **Profile not created**
   - Check the `handleOAuthCallback` function
   - Verify database permissions in Supabase

### Debug Steps

1. Check browser network tab for failed requests
2. Check Supabase logs in the dashboard
3. Verify Google Cloud Console audit logs
4. Test with different browsers/incognito mode

## Production Deployment

### Before Going Live:

1. **Update OAuth Consent Screen**
   - Submit for verification if needed
   - Update privacy policy and terms of service links

2. **Update Redirect URIs**
   - Add production domain to Google OAuth configuration
   - Remove development URLs from production config

3. **Security Review**
   - Audit all OAuth scopes
   - Review user data handling
   - Implement proper logging

4. **Testing**
   - Test OAuth flow in production environment
   - Verify user profile creation
   - Test error scenarios

## Additional Resources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Next.js Authentication Patterns](https://nextjs.org/docs/authentication)

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review Supabase and Google Cloud Console logs
3. Ensure all configuration steps were completed correctly