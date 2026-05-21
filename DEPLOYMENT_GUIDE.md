# Sunam Alert Deployment Guide

Complete step-by-step guide to deploy your Sunam Alert news website to Render with Supabase database.

## Prerequisites

- GitHub account
- Supabase account (free tier available)
- Render account (free tier available)
- Node.js 16+ (for local testing)

---

## PART 1: Local Setup & Testing

### 1.1 Clone or Download Your Code

```bash
cd your-project-folder
npm install
```

### 1.2 Create `.env` File

```bash
# Copy from .env.example and fill in your values
cp .env.example .env
```

Edit `.env`:
```env
ADMIN_USERNAME=admin
ADMIN_PASSWORD=YourSecurePassword123!
NODE_ENV=development
PORT=3000
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_anon_key_here
```

### 1.3 Test Locally

```bash
npm start
# or: node server.js
```

Visit:
- Admin Panel: http://localhost:3000/admin.html
- Website: http://localhost:3000

---

## PART 2: Supabase Database Setup

### 2.1 Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up and create new project
3. Wait for database to initialize (~5 min)

### 2.2 Create Database Tables

Go to **SQL Editor** → **New Query** and run these SQL commands:

> Note: New Supabase projects require explicit grants on `public` tables for Data API access. Add the `GRANT` statements shown after each table.

**Table 1: news**
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
CREATE INDEX idx_news_date ON news(date DESC);
CREATE INDEX idx_news_category ON news(category);

GRANT SELECT ON public.news TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.news TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.news TO service_role;
```

**Table 2: ticker_items**
```sql
CREATE TABLE ticker_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ticker_created ON ticker_items(created_at DESC);

GRANT SELECT ON public.ticker_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ticker_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ticker_items TO service_role;
```

**Table 3: site_ads**
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

**Table 4: contact_messages**
```sql
CREATE TABLE contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT DEFAULT '',
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_contact_created ON contact_messages(created_at DESC);

GRANT SELECT ON public.contact_messages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contact_messages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contact_messages TO service_role;
```

### 2.3 Get Your Credentials

1. Go to **Settings** → **API** in Supabase
2. Copy **Project URL** (SUPABASE_URL)
3. Copy **Service Role Key** or **Anon Key** (SUPABASE_KEY)
4. Paste into your `.env` file

---

## PART 3: GitHub Setup

### 3.1 Push Your Code to GitHub

```bash
git init
git add .
git commit -m "Initial commit: Sunam Alert with Supabase"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/sunam-alert.git
git push -u origin main
```

### 3.2 Add `.env` to `.gitignore`

Make sure `.env` is in `.gitignore` (it should be):

```bash
# Check if .env is ignored
cat .gitignore | grep "^\.env$"
```

If not, add it:
```bash
echo ".env" >> .gitignore
git add .gitignore
git commit -m "Ensure .env is gitignored"
git push
```

---

## PART 4: Deploy to Render

### 4.1 Create a New Web Service

1. Go to [render.com](https://render.com)
2. Sign in with GitHub
3. Click **New +** → **Web Service**
4. Connect your GitHub repository
5. Choose the repo `sunam-alert`

### 4.2 Configure the Web Service

Fill in these settings:

| Setting | Value |
|---------|-------|
| **Name** | sunam-alert |
| **Environment** | Node |
| **Build Command** | `npm install` |
| **Start Command** | `node server.js` |
| **Instance Type** | Free (or Starter for better performance) |

### 4.3 Add Environment Variables

Click **Environment** and add:

```
ADMIN_USERNAME=admin
ADMIN_PASSWORD=YourSecurePassword123
NODE_ENV=production
PORT=3000
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_service_role_key
```

**⚠️ Important:** Use your actual Supabase credentials from Step 2.3

### 4.4 Enable Auto-Deploy

1. In Render dashboard, go to **Auto-Deploy**
2. Select **Yes** for "auto-deploy on push"
3. This means every `git push` will automatically redeploy your site

### 4.5 Deploy!

Click **Create Web Service** → Render will start building and deploying.

Wait 2-3 minutes for deployment to complete. You'll see a **Live** badge when ready.

---

## PART 5: Access Your Live Website

### 5.1 Your Website URLs

Once deployed, you'll have URLs like:

- **Website:** `https://sunam-alert.onrender.com`
- **Admin Panel:** `https://sunam-alert.onrender.com/admin.html`
- **API Health:** `https://sunam-alert.onrender.com/api/health`

### 5.2 First Admin Login

1. Go to `/admin.html`
2. Login with:
   - Username: `admin` (from ADMIN_USERNAME)
   - Password: Your ADMIN_PASSWORD from `.env`

### 5.3 Publish First News

1. Click **Publish News** tab
2. Fill in details and click **🚀 ਪ੍ਰਕਾਸ਼ਿਤ ਕਰੋ** (Publish)
3. Refresh homepage to see the news!

---

## PART 6: Custom Domain (Optional)

### 6.1 Add Custom Domain to Render

1. In Render dashboard → Web Service Settings
2. Go to **Custom Domain**
3. Add your domain (e.g., `sunamalert.in`)

### 6.2 Update DNS Settings

In your domain registrar (GoDaddy, Namecheap, etc.):

1. Add CNAME record:
   - **Name:** `@` or leave blank
   - **Value:** `sunam-alert.onrender.com`

2. Wait 24-48 hours for DNS to propagate

---

## PART 7: Troubleshooting

### Issue: "SUPABASE_URL and SUPABASE_KEY are required"

**Solution:** 
- Check environment variables in Render dashboard
- Make sure they're set and not empty
- Restart the service: **Settings** → **Manual Deploy** → **Deploy**

### Issue: Admin login fails

**Solution:**
- Check `ADMIN_USERNAME` and `ADMIN_PASSWORD` in Render
- Verify they match what you set in `.env`
- Hard refresh browser (Ctrl+Shift+R)

### Issue: News don't appear on website

**Solution:**
- Ensure news status is "published"
- Check that the Supabase table has data in **Database** tab
- Refresh the page

### Issue: File uploads fail

**Solution:**
- On Render free tier, files are deleted after 30 minutes
- Use Supabase Storage or a separate image hosting service (Cloudinary, etc.)

### Issue: Database connection errors

**Solution:**
- Verify SUPABASE_URL starts with `https://`
- Check SUPABASE_KEY is valid (copy from Supabase dashboard again)
- Test with: `curl https://your-supabase-url/rest/v1/news`

---

## PART 8: Maintenance & Backups

### 8.1 Check Website Health

```bash
curl https://sunam-alert.onrender.com/api/health
```

Should return: `{"ok":true, "service":"sunam-alert-backend", ...}`

### 8.2 Backup Your Database

In Supabase:
1. **Database** → **Backups**
2. Click **Request a backup**
3. Download when ready

### 8.3 Monitor Usage

Render shows:
- CPU/Memory usage
- Request count
- Error logs (if any)

Free tier limits:
- 750 hours/month (always on)
- 0.5GB RAM
- 2GB storage
- Auto-sleep after 15 min inactivity

---

## PART 9: Making Changes & Updates

### 9.1 Update Code Locally

```bash
# Make changes to files
git add .
git commit -m "Fix bug: ..."
git push origin main
```

Render automatically detects the push and redeploys!

### 9.2 Update Database Schema

1. Go to Supabase → **SQL Editor**
2. Write and run migration queries
3. Changes are live immediately

### 9.3 Change Admin Password

```bash
# Update .env locally
ADMIN_PASSWORD=NewPassword123

# Then push to GitHub (Render will auto-deploy)
git add .env  # ⚠️ Make sure .env is in .gitignore first!
git commit -m "Update admin password"
git push
```

---

## Security Checklist ✅

- [ ] `.env` is in `.gitignore` (never commit secrets!)
- [ ] `SUPABASE_KEY` is set in Render (not in GitHub)
- [ ] `ADMIN_PASSWORD` is strong (12+ chars, mix of letters/numbers/symbols)
- [ ] RLS policies are enabled on Supabase tables
- [ ] Only admin can create/edit/delete news
- [ ] HTTPS is enabled (automatic on Render)

---

## Quick Reference

| Task | Command |
|------|---------|
| Test locally | `npm start` |
| View logs | Render dashboard → **Logs** |
| Restart service | **Settings** → **Manual Deploy** |
| View database | Supabase dashboard → **Table Editor** |
| Admin login | `/admin.html` |
| Publish news | Admin panel → **Publish News** |

---

## Support

- **Render Docs:** https://render.com/docs
- **Supabase Docs:** https://supabase.com/docs
- **GitHub Issues:** Create issue in your repo
- **Community:** Stack Overflow, Reddit, GitHub Discussions

---

**Congratulations! Your news website is now live on the internet! 🎉**

Next steps:
1. ✅ Test admin panel thoroughly
2. ✅ Publish 5-10 news articles
3. ✅ Share with friends & family
4. ✅ Promote on social media
5. ✅ Monitor analytics & feedback

