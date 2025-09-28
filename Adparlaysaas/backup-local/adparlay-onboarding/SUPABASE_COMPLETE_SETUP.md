# Complete Supabase Setup for Adparlay

## 🚨 **CRITICAL: You MUST complete this setup for the app to work!**

The "form not found" error occurs because the Supabase database tables don't exist yet. Follow these steps exactly.

## 📋 **Step 1: Go to Supabase Dashboard**

1. Visit [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Sign in to your account
3. Select your project: `jsiaxncamphtmbbjobxi`

## 🗄️ **Step 2: Create Database Tables**

1. Go to **SQL Editor** in the left sidebar
2. Click **New Query**
3. Copy and paste the entire SQL code below:

```sql
-- Enable Row Level Security
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Create forms table
CREATE TABLE IF NOT EXISTS forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  form_name TEXT,
  blocks JSONB NOT NULL DEFAULT '[]',
  questions JSONB NOT NULL DEFAULT '[]',
  media JSONB NOT NULL DEFAULT '{}',
  form_style JSONB NOT NULL DEFAULT '{}',
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_published BOOLEAN DEFAULT FALSE,
  share_url TEXT
);

-- Create form_responses table
CREATE TABLE IF NOT EXISTS form_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID REFERENCES forms(id) ON DELETE CASCADE,
  form_title TEXT NOT NULL,
  form_data JSONB NOT NULL DEFAULT '{}',
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT
);

-- Create analytics table
CREATE TABLE IF NOT EXISTS analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID REFERENCES forms(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('view', 'start', 'complete', 'abandon')),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id),
  ip_address TEXT,
  user_agent TEXT,
  session_id TEXT
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_forms_user_id ON forms(user_id);
CREATE INDEX IF NOT EXISTS idx_forms_created_at ON forms(created_at);
CREATE INDEX IF NOT EXISTS idx_form_responses_form_id ON form_responses(form_id);
CREATE INDEX IF NOT EXISTS idx_form_responses_created_at ON form_responses(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_form_id ON analytics(form_id);
CREATE INDEX IF NOT EXISTS idx_analytics_timestamp ON analytics(timestamp);
CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON analytics(event_type);

-- Enable Row Level Security on all tables
ALTER TABLE forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;

-- Forms policies
CREATE POLICY "Users can view their own forms" ON forms
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own forms" ON forms
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own forms" ON forms
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own forms" ON forms
  FOR DELETE USING (auth.uid() = user_id);

-- Allow public access to published forms (for form preview)
CREATE POLICY "Public can view published forms" ON forms
  FOR SELECT USING (is_published = true);

-- Form responses policies
CREATE POLICY "Users can view responses to their forms" ON form_responses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM forms 
      WHERE forms.id = form_responses.form_id 
      AND forms.user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can insert form responses" ON form_responses
  FOR INSERT WITH CHECK (true);

-- Analytics policies
CREATE POLICY "Users can view analytics for their forms" ON analytics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM forms 
      WHERE forms.id = analytics.form_id 
      AND forms.user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can insert analytics events" ON analytics
  FOR INSERT WITH CHECK (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_forms_updated_at 
  BEFORE UPDATE ON forms 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to generate share URL
CREATE OR REPLACE FUNCTION generate_share_url()
RETURNS TRIGGER AS $$
BEGIN
  NEW.share_url = 'https://adparlay.com/form/' || NEW.id;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically generate share URL
CREATE TRIGGER generate_forms_share_url
  BEFORE INSERT ON forms
  FOR EACH ROW
  EXECUTE FUNCTION generate_share_url();
```

4. Click **Run** to execute the SQL
5. You should see "Success. No rows returned" for each command

## 🔐 **Step 3: Enable Authentication**

1. Go to **Authentication** → **Settings** in the left sidebar
2. Make sure **Enable email confirmations** is **OFF** (for testing)
3. Set **Site URL** to: `https://adparlay-onboarding-cclsyfqd5-colourfulrhythms-projects.vercel.app`
4. Set **Redirect URLs** to include:
   - `https://adparlay-onboarding-cclsyfqd5-colourfulrhythms-projects.vercel.app/**`
   - `http://localhost:3001/**`

## 🌐 **Step 4: Update Environment Variables**

1. Go to **Settings** → **API** in the left sidebar
2. Copy your **Project URL** and **anon public** key
3. Update your `.env` file:

```env
REACT_APP_SUPABASE_URL=https://jsiaxncamphtmbbjobxi.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpzaWF4bmNhbXBodG1iYmpvYnhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1OTg0MTksImV4cCI6MjA3MTE3NDQxOX0.ra_8pPPyQjLrSnuC-5jtLtsKOZ_DbZHReA6TyHwzXOo
```

## ✅ **Step 5: Test the Setup**

1. **Create a new form** in your app
2. **Save the form** - it should save to Supabase
3. **Copy the share link** - it should work
4. **Preview the form** - it should load without "form not found"

## 🐛 **Troubleshooting**

### **"Form not found" error still appears:**
- Check that all SQL commands ran successfully
- Verify the tables exist in **Table Editor**
- Check **Authentication** → **Users** for your user account

### **Forms not saving:**
- Check browser console for errors
- Verify RLS policies are enabled
- Check **Logs** in Supabase for errors

### **Authentication not working:**
- Verify environment variables are correct
- Check **Authentication** → **Settings**
- Ensure redirect URLs are properly set

## 📊 **Verify Tables Created**

After running the SQL, you should see these tables in **Table Editor**:
- ✅ `forms`
- ✅ `form_responses` 
- ✅ `analytics`

## 🔒 **Security Features Enabled**

- ✅ **Row Level Security (RLS)** - Users can only access their own data
- ✅ **Public form access** - Published forms are publicly viewable
- ✅ **Secure policies** - All operations are properly secured

---

**⚠️ IMPORTANT**: Without completing this Supabase setup, the app will show "form not found" errors and forms won't save properly.

**🎯 Next**: After setup, test creating a form, saving it, and sharing the link. Everything should work perfectly!
