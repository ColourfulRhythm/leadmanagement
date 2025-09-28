# Supabase Setup Guide

This guide will help you set up Supabase for the AdParlay lead capture form system.

## 🚀 Quick Setup

### 1. Create Supabase Project

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - **Name**: `adparlay-lead-capture`
   - **Database Password**: Choose a strong password
   - **Region**: Choose closest to your users
5. Click "Create new project"

### 2. Get Your Project Credentials

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (e.g., `https://your-project.supabase.co`)
   - **Anon Public Key** (starts with `eyJ...`)

### 3. Set Environment Variables

Create a `.env` file in your project root:

```env
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Set Up Database Schema

1. In Supabase Dashboard, go to **SQL Editor**
2. Copy and paste the contents of `supabase-schema.sql`
3. Click "Run" to execute the SQL

### 5. Configure Authentication

1. Go to **Authentication** → **Settings**
2. Enable **Email Auth**
3. Configure email templates if needed
4. Set up any additional providers (Google, GitHub, etc.)

### 6. Test the Setup

1. Start your development server: `npm start`
2. Try registering a new user
3. Check the **Authentication** → **Users** section in Supabase
4. Verify the user profile was created in the **Table Editor** → **users**

## 📊 Database Schema

The system uses three main tables:

### `users` Table
- Stores user profiles and subscription data
- Automatically created when users register
- Tracks form limits and usage

### `forms` Table
- Stores form definitions and settings
- JSONB fields for flexible form structure
- Tracks submission counts and status

### `form_submissions` Table
- Stores all form submissions
- JSONB for flexible response data
- Tracks user agent and submission metadata

## 🔒 Security Features

### Row Level Security (RLS)
- Users can only access their own data
- Public forms can be viewed by anyone
- Form submissions are protected by ownership

### Policies
- **Users**: Can only access their own profile
- **Forms**: Users can manage their own forms, public forms are readable by all
- **Submissions**: Anyone can submit, but only form owners can view submissions

## 🚀 Deployment

### Environment Variables for Production

Set these in your deployment platform (Vercel, Netlify, etc.):

```env
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here
```

### Vercel Deployment

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push

### Netlify Deployment

1. Build: `npm run build`
2. Upload `build` folder to Netlify
3. Add environment variables in Netlify dashboard

## 🔧 Advanced Configuration

### Custom Email Templates

1. Go to **Authentication** → **Email Templates**
2. Customize welcome, confirmation, and reset emails
3. Use HTML and CSS for branding

### Storage (Optional)

If you want to add file uploads:

1. Go to **Storage** → **Create bucket**
2. Name it `form-uploads`
3. Set up RLS policies for the bucket

### Real-time Subscriptions

Enable real-time updates for form submissions:

```typescript
// Subscribe to new submissions
const subscription = supabase
  .channel('form_submissions')
  .on('postgres_changes', 
    { event: 'INSERT', schema: 'public', table: 'form_submissions' },
    (payload) => {
      console.log('New submission:', payload.new);
    }
  )
  .subscribe();
```

## 🐛 Troubleshooting

### Common Issues

1. **"Invalid API key"**: Check your environment variables
2. **"RLS policy violation"**: Verify your database policies are set up correctly
3. **"User not found"**: Check if the user profile was created automatically

### Debug Mode

Enable debug logging in your Supabase client:

```typescript
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    debug: true
  }
});
```

### Database Logs

Check **Logs** → **Database** in Supabase dashboard for SQL errors and performance issues.

## 📈 Analytics

### Built-in Analytics

Supabase provides built-in analytics:
- **Database**: Query performance and usage
- **Auth**: User registration and login metrics
- **Storage**: File upload statistics

### Custom Analytics

Track form performance with custom queries:

```sql
-- Get form submission trends
SELECT 
  DATE(submitted_at) as date,
  COUNT(*) as submissions
FROM form_submissions 
WHERE submitted_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(submitted_at)
ORDER BY date;
```

## 🔄 Migration from Firebase

If migrating from Firebase:

1. Export your Firebase data
2. Transform the data to match Supabase schema
3. Import using Supabase's data import tools
4. Update your application code
5. Test thoroughly before switching

## 📞 Support

- **Supabase Docs**: [supabase.com/docs](https://supabase.com/docs)
- **Community**: [github.com/supabase/supabase/discussions](https://github.com/supabase/supabase/discussions)
- **Discord**: [discord.supabase.com](https://discord.supabase.com)

---

Your Supabase setup is now complete! The application should work seamlessly with authentication, form management, and data storage.
