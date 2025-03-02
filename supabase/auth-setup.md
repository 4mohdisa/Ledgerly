# Supabase Auth Setup Checklist

1. Email Auth Settings (check in Supabase Dashboard -> Authentication -> Email):
   - [x] Enable Email signup
   - [x] Enable "Confirm email" option
   - [ ] Check if "Secure email change" is enabled
   - [ ] Verify email templates are configured

2. Password Settings:
   - [ ] Minimum password length should be 8
   - [ ] Check if additional password strength requirements are needed

3. Redirect URLs (check in Authentication -> URL Configuration):
   - [ ] Add your local development URL: `http://localhost:3000`
   - [ ] Add your production URL (if applicable)
   - [ ] Configure redirect URLs:
     * `/auth/callback`
     * `/sign-in`
     * `/sign-up`

4. User Management:
   - [ ] Verify users are being created in auth.users table
   - [ ] Check if email confirmations are being sent
   - [ ] Verify email confirmation links work

5. SMTP Settings (if using custom email):
   - [ ] Configure SMTP settings for reliable email delivery
   - [ ] Test email delivery

To verify your setup:

1. Go to Supabase Dashboard
2. Navigate to Authentication -> Providers
3. Ensure Email provider is enabled
4. Check URL Configuration
5. Verify SMTP settings if using custom email

Common Issues:
1. Email confirmation not working
   - Check spam folder
   - Verify email templates
   - Check SMTP settings
2. Invalid credentials
   - Ensure email is confirmed
   - Check password requirements
   - Verify user exists in auth.users
