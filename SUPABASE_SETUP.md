# Supabase Setup Guide for Sunam Alert

This guide explains how to set up Supabase as the database for your Sunam Alert application.

## Step 1: Create a Supabase Account

1. Go to [supabase.com](https://supabase.com)
2. Sign up with email or GitHub account
3. Create a new project:
   - Project name: `sunam-alert` (or any name)
   - Password: Create a strong password
   - Region: Choose closest to your users (e.g., Singapore for Asia)
   - Pricing: Select "Free" tier

## Step 2: Get Your API Credentials

After project creation:

1. Go to **Settings** → **API**
2. Copy the following:
   - **Project URL** (SUPABASE_URL)
   - **Service Role Key** (SUPABASE_KEY) — Keep this SECRET!

```
SUPABASE_URL = https://xxxxx.supabase.co
SUPABASE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Step 3: Create Database Tables

Go to **SQL Editor** in Supabase and run these queries one by one:

> Note: As of May 30, new Supabase projects require explicit grants on public schema tables for Data API access. Add `GRANT` statements immediately after creating each table.

### Table 1: news

```sql
CREATE TABLE news (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  desc TEXT DEFAULT '',
  fbLink TEXT DEFAULT '',
  img TEXT DEFAULT '',
  video TEXT DEFAULT '',
  category TEXT DEFAULT 'General',
  page TEXT[] DEFAULT ARRAY['home'],
  author TEXT DEFAULT 'Sunam Alert',
  date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status TEXT DEFAULT 'draft',
  featured BOOLEAN DEFAULT FALSE,
  breaking BOOLEAN DEFAULT FALSE,
  trending BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_news_status ON news(status);
CREATE INDEX idx_news_date ON news(date);
CREATE INDEX idx_news_category ON news(category);

GRANT SELECT ON public.news TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.news TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.news TO service_role;
```

### Table 2: ticker_items

```sql
CREATE TABLE ticker_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ticker_created ON ticker_items(created_at);

GRANT SELECT ON public.ticker_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ticker_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ticker_items TO service_role;
```

### Table 3: site_ads

```sql
CREATE TABLE site_ads (
  id TEXT PRIMARY KEY,
  title TEXT DEFAULT '',
  link TEXT DEFAULT '',
  img TEXT DEFAULT '',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

GRANT SELECT ON public.site_ads TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_ads TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_ads TO service_role;
```

### Table 4: contact_messages

```sql
CREATE TABLE contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT DEFAULT '',
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_contact_created ON contact_messages(created_at);

GRANT SELECT ON public.contact_messages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contact_messages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contact_messages TO service_role;
```

## Step 4: Configure Row Level Security (RLS)

RLS ensures that only authenticated admins can modify data. Go to **Auth** → **Policies** and set up:

### For `news` table:

> Copy only the SQL code blocks below into Supabase SQL Editor. Do not copy the bold heading text.

**Policy name: Public read published news**
```sql
CREATE POLICY "Public read published news" ON news
FOR SELECT USING (status = 'published');
```

**Policy name: Admin manage news**
```sql
CREATE POLICY "Admin manage news" ON news
FOR ALL USING (auth.role() = 'authenticated' AND auth.jwt()->>'role' = 'service_role');
```

### For other tables (ticker_items, site_ads, contact_messages):

Copy only the SQL code below. These are the policy names to use:

- `Public read ticker`
- `Service role manage ticker`
- `Public read ads`
- `Service role manage ads`
- `Service role manage contacts`

```sql
-- For ticker_items
CREATE POLICY "Public read ticker" ON ticker_items FOR SELECT USING (true);
CREATE POLICY "Service role manage ticker" ON ticker_items FOR ALL USING (auth.role() = 'service_role');

-- For site_ads
CREATE POLICY "Public read ads" ON site_ads FOR SELECT USING (true);
CREATE POLICY "Service role manage ads" ON site_ads FOR ALL USING (auth.role() = 'service_role');

-- For contact_messages
CREATE POLICY "Service role manage contacts" ON contact_messages FOR ALL USING (auth.role() = 'service_role');
```

## Step 5: Update Your `.env` File

Create or update `.env` in your project root:

```env
ADMIN_USERNAME=admin
ADMIN_PASSWORD=YourSecurePassword123!
NODE_ENV=production
PORT=3000
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Important:** Replace the values with your actual credentials!

## Step 6: Deploy to Render

1. **Push your code to GitHub:**
   ```bash
   git add .
   git commit -m "Add Supabase integration"
   git push origin main
   ```

2. **Connect Render to your GitHub repo:**
   - Go to [render.com](https://render.com)
   - Click "New Web Service"
   - Connect GitHub repository
   - Set environment variables in Render dashboard (same as `.env`)
   - Deploy!

## Step 7: Test Your Setup

### Test News Publishing (Admin):

```bash
curl -X POST http://localhost:3000/api/admin/news \
  -H "Content-Type: application/json" \
  -H "Cookie: sunam_admin_session=YOUR_COOKIE" \
  -d '{
    "title": "Test Article",
    "category": "General",
    "fbLink": "https://facebook.com/...",
    "status": "published",
    "page": ["home"]
  }'
```

### Test News Retrieval (Public):

```bash
curl http://localhost:3000/api/news
```

## Important Security Notes

🔒 **Never commit `.env` to GitHub!**
- Add `.env` to `.gitignore`
- Only commit `.env.example`

🔒 **Protect your SUPABASE_KEY**
- It's a secret credential
- Use environment variables only
- On Render, set via dashboard (never in code)

🔒 **Enable RLS on all tables**
- Prevents unauthorized database access
- Ensures only authenticated admins can modify data

## Troubleshooting

### "SUPABASE_URL and SUPABASE_KEY are required"
→ Check `.env` file exists and has correct values

### "Unable to fetch news right now"
→ Check network connection and Supabase status

### "Admin login required"
→ Make sure you're logged in and have valid admin cookie

### RLS Policy errors
→ Verify RLS policies are created and enabled

## Next Steps

1. ✅ Set up database schema
2. ✅ Configure `.env` with Supabase credentials
3. ✅ Deploy to Render
4. ✅ Test admin login at `/admin.html`
5. ✅ Start publishing news!

## Support

- Supabase Docs: https://supabase.com/docs
- Render Docs: https://render.com/docs
- GitHub Issues: Create issue in your repo

---

**Deployment Success Checklist:**
- [ ] `.env` file has SUPABASE_URL and SUPABASE_KEY
- [ ] All 4 database tables are created
- [ ] RLS policies are enabled
- [ ] Admin credentials (ADMIN_USERNAME, ADMIN_PASSWORD) are set
- [ ] Code pushed to GitHub
- [ ] Render environment variables configured
- [ ] Website is online and admin panel loads

