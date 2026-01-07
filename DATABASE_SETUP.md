# Database Setup Instructions

## Overview

Your app now uses Supabase for all user data storage. Data is stored in the cloud and tied to each user's Google account. This means:

- ✅ Data syncs across all devices
- ✅ Data persists even if browser cache is cleared
- ✅ Each user has their own isolated data
- ✅ Automatic backups and data security via Supabase

## Step 1: Run the Database Schema

1. **Open your Supabase project dashboard** at https://supabase.com
2. **Click on "SQL Editor"** in the left sidebar
3. **Click "+ New Query"**
4. **Open the file** `supabase-schema.sql` in your project
5. **Copy ALL the SQL code** from that file
6. **Paste it into the Supabase SQL Editor**
7. **Click "Run"** (or press Ctrl+Enter / Cmd+Enter)
8. **Wait for it to complete** - you should see "Success. No rows returned"

This creates all the database tables:
- `profiles` - User profile information
- `dopamine_categories` - User's habit tracking categories
- `dopamine_entries` - Daily entries for each category
- `transactions` - Money tracking
- `recurring_transactions` - Recurring payments
- `exercise_days` - Workout tracking
- `exercise_notes` - Notes for workout days
- `user_settings` - User preferences

## Step 2: Verify Tables Were Created

1. **Click "Table Editor"** in the left sidebar
2. **You should see all 8 tables** listed
3. **Click on each table** to verify it has the correct columns

## Step 3: Test the Application

1. **Make sure your `.env.local` file has:**
   ```
   VITE_SUPABASE_URL=your_project_url
   VITE_SUPABASE_ANON_KEY=your_anon_key
   ```

2. **Restart your development server:**
   ```bash
   npm run dev
   ```

3. **Open the app and sign in with Google**

4. **Test each feature:**
   - **Dopamine page**: Create a category, add an entry
   - **Money page**: Add a transaction
   - **Exercise page**: Mark a day as exercised

5. **Refresh the page** - all data should persist

6. **Check Supabase Table Editor** - you should see your data in the tables

## Step 4: Verify Row Level Security (RLS)

Row Level Security ensures users can only access their own data.

1. **In Supabase, go to Table Editor**
2. **Click on any table (e.g., "dopamine_categories")**
3. **You should see the RLS shield icon is enabled** (green)
4. **This means your data is secure!**

## How the Database Works

### Dynamic User Data

When users create new tracking categories or add transactions, the app creates **new rows**, not new tables:

#### Example: Dopamine Categories

```
dopamine_categories table:
| id   | user_id | name      | type     | ... |
|------|---------|-----------|----------|-----|
| uuid | user_1  | Vaping    | count    | ... |
| uuid | user_1  | Netflix   | duration | ... |
| uuid | user_2  | Coffee    | count    | ... |
```

Each user can create unlimited categories - they're all stored as rows in the same table, filtered by `user_id`.

#### Example: Dopamine Entries

```
dopamine_entries table:
| id   | user_id | category_id | date       | value |
|------|---------|-------------|------------|-------|
| uuid | user_1  | cat_vaping  | 2026-01-07 | 3     |
| uuid | user_1  | cat_vaping  | 2026-01-08 | 2     |
| uuid | user_1  | cat_netflix | 2026-01-07 | 120   |
```

### Data Storage Location

- **Before (localStorage)**: Data stored on your local device only
- **After (Supabase)**: Data stored on Supabase's secure cloud servers

### Benefits

1. **Multi-device sync**: Sign in on phone, see same data on laptop
2. **Data persistence**: Clears browser cache? Data is safe
3. **Backup**: Automatic backups by Supabase
4. **Security**: Row Level Security ensures users only see their data
5. **Performance**: Efficient queries and indexes
6. **Scalability**: Can handle millions of entries

## Database Schema Summary

### Tables and Relationships

```
auth.users (Supabase Auth)
    ↓
profiles (1:1)
    ↓
user_settings (1:1)

auth.users
    ↓
dopamine_categories (1:many)
    ↓
dopamine_entries (1:many per category)

auth.users
    ↓
transactions (1:many)
recurring_transactions (1:many)

auth.users
    ↓
exercise_days (1:many)
exercise_notes (1:many)
```

### Key Features

- **Foreign Keys**: All user data links to `auth.users(id)` via `user_id`
- **Cascade Delete**: If user account deleted, all their data is automatically deleted
- **Unique Constraints**: Prevents duplicate entries (e.g., can't have two entries for same category on same date)
- **Indexes**: Fast queries on user_id, date, category_id
- **Auto-timestamps**: `created_at` and `updated_at` managed automatically

## Troubleshooting

### "No rows returned" when querying data

**Solution**: Make sure you're signed in. All data is tied to the authenticated user.

### "Row level security policy violated"

**Solution**:
1. Check that RLS policies are enabled on all tables
2. Re-run the schema SQL to recreate policies
3. Make sure you're using `auth.uid()` in queries

### Data not appearing

**Solution**:
1. Open browser dev tools (F12)
2. Check Console tab for errors
3. Verify `.env.local` has correct Supabase credentials
4. Check Network tab to see if API calls are failing

### "Failed to load data" errors

**Solution**:
1. Verify Supabase project is active (not paused)
2. Check that tables were created correctly
3. Verify API keys are correct
4. Check browser console for specific error messages

## Migration from localStorage (Optional)

If you had data in localStorage before, it's now separate from Supabase data. The old data is still in your browser's localStorage but won't appear in the app.

To manually migrate:
1. **Open browser dev tools** (F12)
2. **Go to Application/Storage tab → Local Storage**
3. **Copy old data values**
4. **Manually re-enter** in the app (will save to Supabase)

Or simply start fresh - the old localStorage data won't interfere.

## Production Deployment (Vercel)

When deploying to Vercel:

1. **Add Environment Variables** in Vercel project settings:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

2. **Update Supabase Auth URLs**:
   - Go to Supabase → Authentication → URL Configuration
   - Add your Vercel domain to **Site URL** and **Redirect URLs**

3. **Update Google OAuth**:
   - Add your Vercel domain to Google OAuth authorized redirect URIs

## Data Security

Your data is secured by:

1. **Row Level Security**: Users can only access their own data
2. **Authentication**: Must sign in with Google
3. **HTTPS**: All data encrypted in transit
4. **Supabase Security**: SOC 2 compliant, encrypted at rest
5. **API Keys**: Anon key is safe to expose (can only access user's own data)

## Database Monitoring

Monitor your database in Supabase dashboard:

1. **Table Editor**: View and edit data directly
2. **Database → Roles**: Manage database access
3. **Logs**: View query logs and errors
4. **Reports**: Usage statistics and performance

## Next Steps

Your database is now fully integrated! Users can:

- ✅ Create unlimited dopamine tracking categories
- ✅ Add daily entries and view trends
- ✅ Track money with categories and recurring transactions
- ✅ Log exercise days with notes
- ✅ Access all their data from any device
- ✅ Never lose data even if browser cache is cleared

Enjoy your new cloud-powered goal tracking app!
