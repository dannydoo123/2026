# Supabase Setup Guide

This guide will help you set up Supabase with Google OAuth authentication for your 2026 Goals Tracker app.

## Step 1: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign up or log in
2. Click "New Project"
3. Fill in the project details:
   - Project name: `2026-goals-tracker` (or your preferred name)
   - Database password: Create a strong password (save it somewhere safe)
   - Region: Choose the closest region to your users
4. Click "Create new project" and wait for it to initialize (takes ~2 minutes)

## Step 2: Get Your Supabase Credentials

1. Once your project is created, go to **Settings** (gear icon in sidebar)
2. Click on **API** in the settings menu
3. You'll see two important values:
   - **Project URL** - copy this
   - **anon public** key - copy this

## Step 3: Configure Environment Variables

1. In your project root, create a `.env.local` file:
   ```bash
   VITE_SUPABASE_URL=your_project_url_here
   VITE_SUPABASE_ANON_KEY=your_anon_key_here
   ```

2. Replace the placeholder values with your actual Supabase credentials from Step 2

## Step 4: Set Up Google OAuth

### A. Get Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google+ API**:
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API"
   - Click "Enable"
4. Go to "APIs & Services" > "Credentials"
5. Click "Create Credentials" > "OAuth client ID"
6. Configure the consent screen if prompted:
   - User type: External
   - Fill in required fields (app name, support email, etc.)
7. For Application type, select "Web application"
8. Add authorized redirect URIs:
   ```
   https://YOUR_SUPABASE_PROJECT_REF.supabase.co/auth/v1/callback
   ```
   Replace `YOUR_SUPABASE_PROJECT_REF` with your actual Supabase project reference (found in your Supabase project URL)

9. Click "Create" and copy your:
   - Client ID
   - Client Secret

### B. Configure Google OAuth in Supabase

1. In your Supabase dashboard, go to **Authentication** > **Providers**
2. Find "Google" in the list and click to expand
3. Enable Google provider
4. Paste your Google OAuth credentials:
   - Client ID
   - Client Secret
5. Click "Save"

## Step 5: Configure Site URL and Redirect URLs

1. In Supabase dashboard, go to **Authentication** > **URL Configuration**
2. Set **Site URL** to:
   - Development: `http://localhost:5173`
   - Production: Your Vercel domain (e.g., `https://your-app.vercel.app`)
3. Add **Redirect URLs**:
   - Development: `http://localhost:5173/**`
   - Production: `https://your-app.vercel.app/**`

## Step 6: Test Locally

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to `http://localhost:5173`
3. You should be redirected to the login page
4. Click "Continue with Google" to test the authentication flow

## Step 7: Deploy to Vercel

### A. Add Environment Variables to Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** > **Environment Variables**
3. Add the following variables:
   - `VITE_SUPABASE_URL`: Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase anon key
4. Make sure these are available for all environments (Production, Preview, Development)

### B. Update Supabase URL Configuration

1. After deploying to Vercel, get your production URL
2. Go back to Supabase dashboard > **Authentication** > **URL Configuration**
3. Update the Site URL to your Vercel URL
4. Add your Vercel URL to Redirect URLs

### C. Update Google OAuth Redirect URIs

1. Go back to Google Cloud Console
2. Edit your OAuth client
3. Add your Vercel URL as an authorized redirect URI:
   ```
   https://your-app.vercel.app
   ```

## Optional: Create Database Tables for User Data

If you want to store additional user information:

1. Go to **SQL Editor** in Supabase
2. Run this SQL to create a user profiles table:

```sql
-- Create profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Create policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Function to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call function on user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

## Troubleshooting

### Authentication Not Working
- Make sure your environment variables are loaded (restart dev server after adding them)
- Check that your Google OAuth credentials are correct
- Verify redirect URLs match exactly (including trailing slashes)

### Redirect Issues
- Ensure Site URL and Redirect URLs are configured correctly in Supabase
- Check Google OAuth authorized redirect URIs include your Supabase callback URL

### User Data Not Persisting
- Check that you've enabled RLS (Row Level Security) policies
- Verify your user has the correct permissions

## Next Steps

Your authentication is now set up! You can:
- Add more OAuth providers (GitHub, Facebook, etc.)
- Create additional database tables for your app data
- Implement user profiles and preferences
- Add email/password authentication as a fallback
