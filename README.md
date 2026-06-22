# ਸੁਨਾਮ ਅਲਰਟ (Sunam Alert) - News Website

A modern, production-ready news website built with Node.js/Express backend and Supabase database. Includes admin panel for managing news, ticker updates, and advertisements.

**Live Demo:** [sunam-alert.onrender.com](https://sunam-alert.onrender.com)

---

## 🎯 Features

✅ **News Management**
- Publish, edit, and manage news articles
- Multiple categories (Politics, Sports, Entertainment, etc.)
- Featured & trending article support
- Schedule news publication

✅ **Breaking News Ticker**
- Real-time ticker updates
- Breaking news notifications
- Customizable ticker items

✅ **Advertisements**
- AD1 (Large) and AD2 (Small) ad slots
- Easy ad management from admin panel
- Image upload support

✅ **Contact Management**
- Contact form with validation
- Automatic message storage in Supabase
- Fallback logging to files

✅ **Production Ready**
- Security: Helmet, rate limiting, CSRF protection
- Database: Supabase PostgreSQL with RLS
- Deployment: Render, Vercel, or any Node.js host
- Scalable: Handles thousands of visitors

---

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- npm or yarn
- Git & GitHub account
- Supabase account (free at [supabase.com](https://supabase.com))
- Render account (free at [render.com](https://render.com))

### Step 1: Setup Locally

```bash
# Clone or download the project
cd sunam-alert

# Install dependencies
npm install

# Create .env from template
cp .env.example .env

# Edit .env with your values
nano .env
```

### Step 2: Create Supabase Database

1. Go to [supabase.com](https://supabase.com) and create project
2. Run SQL from `SUPABASE_SETUP.md` to create tables
3. Copy SUPABASE_URL and SUPABASE_KEY to `.env`

### Step 3: Run Locally

```bash
npm start
# Server runs at http://localhost:3000
```

Visit:
- **Website:** http://localhost:3000
- **Admin Panel:** http://localhost:3000/admin.html
- **Login:** admin / (your password from .env)

### Step 4: Deploy to Render

1. Push to GitHub: `git push origin main`
2. Go to [render.com](https://render.com)
3. Create new Web Service from your GitHub repo
4. Set environment variables (same as `.env`)
5. Deploy!

See **DEPLOYMENT_GUIDE.md** for detailed instructions.

---

## 📁 Project Structure

```
sunam-alert/
├── server.js                 # Backend server (Node/Express)
├── package.json             # Dependencies
├── .env.example             # Environment template
├── .gitignore              # Git ignore rules
│
├── index.html              # Homepage
├── news.html               # News listing page
├── news-detail.html        # Article detail page
├── admin.html              # Admin panel
├── contact.html            # Contact form
│
├── style.css               # Main styles
├── main.js                 # Frontend scripts
├── news-engine.js          # News loading & rendering
├── trending-news.js        # Trending sidebar
├── contact.js              # Contact form handler
├── enhancements.js         # UI enhancements
│
├── uploads/                # User uploads (local storage)
├── logs/                   # Error/contact logs
│
├── README.md               # This file
└── manifest.json           # PWA config
```

---

## 🔧 Configuration

### Environment Variables

Required in `.env`:

```env
# Admin credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD=YourSecurePassword123!

# Supabase database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-service-role-key

# Server
PORT=3000
NODE_ENV=production
```

See `.env.example` for full details.

---

## 📚 API Endpoints

### Public Endpoints

```
GET  /api/news                    # Get all published news
GET  /api/news/:id                # Get single news article
GET  /api/ticker                  # Get breaking ticker
GET  /api/ads                      # Get advertisements
GET  /api/weather                 # Get weather data
GET  /api/markets                 # Get market data
POST /api/contact                 # Submit contact form
```

### Admin Endpoints (Auth Required)

```
POST   /api/admin/login            # Admin login
POST   /api/admin/logout           # Admin logout
GET    /api/admin/session          # Check session
GET    /api/admin/news             # Get all news (drafts + published)
POST   /api/admin/news             # Create news
PUT    /api/admin/news/:id         # Update news
DELETE /api/admin/news/:id         # Delete news
POST   /api/admin/ticker           # Add ticker item
DELETE /api/admin/ticker/:id       # Delete ticker item
POST   /api/admin/ticker/reset     # Reset to defaults
POST   /api/admin/ads              # Create/update ad
DELETE /api/admin/ads/:slot        # Delete ad
POST   /api/upload                 # Upload media file
```

---

## 🛡️ Security

✅ **Implemented Security Features:**
- Helmet.js (secure HTTP headers)
- Rate limiting (prevent DoS)
- CSRF protection (cookies + origin checks)
- SQL injection prevention (Supabase ORM)
- XSS protection (sanitized inputs)
- Admin session tokens (secure cookies)
- RLS on database (row-level security)

**Always:**
- Use strong passwords
- Keep `.env` secret (add to .gitignore)
- Use HTTPS in production
- Enable CORS only for trusted origins
- Update dependencies: `npm audit fix`

---

## 📱 Features in Detail

### Admin Panel

1. **Dashboard** - Overview of stats
2. **Publish News** - Create articles with images/videos
3. **Manage News** - Edit/delete existing news
4. **Breaking Ticker** - Add/remove ticker items
5. **Advertisements** - Manage ad slots
6. **Settings** - Password & general settings

### Frontend Pages

1. **Homepage** - Hero article + news grid
2. **News** - All published articles
3. **Category Pages** (Sports, Politics, Entertainment, etc.)
4. **Article Detail** - Full article with metadata
5. **Contact** - Contact form (stored in database)

### Content Features

- **Rich text support** (HTML in descriptions)
- **Image uploads** (automatic CDN on production)
- **Video support** (MP4, WebM)
- **Category tagging** (9 categories + custom)
- **Featured articles** (⭐ badge)
- **Trending articles** (🔥 badge)
- **Breaking news** (🔴 ticker)

---

## 🔄 Database Schema

### news table
```
- id: UUID (primary key)
- title: text (required)
- desc: text (article content)
- fbLink: text (Facebook post URL)
- img: text (featured image URL)
- video: text (video URL)
- category: text (General, Sports, etc.)
- page: text[] (pages where shown: [home, sports, ...])
- author: text (author name)
- date: timestamp
- status: text (draft, published)
- featured: boolean
- breaking: boolean
- trending: boolean
- created_at, updated_at: timestamp
```

### ticker_items table
```
- id: UUID (primary key)
- text: text (ticker message)
- created_at: timestamp
```

### site_ads table
```
- id: text (ad1, ad2)
- title: text
- link: text
- img: text (ad image)
- updated_at: timestamp
```

### contact_messages table
```
- id: UUID
- name, email, subject, message: text
- created_at: timestamp
```

---

## 🚀 Deployment

### Render (Recommended)

```bash
# 1. Push to GitHub
git add .
git commit -m "Deploy to Render"
git push origin main

# 2. Create service on Render dashboard
# - Connect GitHub repo
# - Set environment variables
# - Deploy!

# 3. Your site is live!
# https://sunam-alert.onrender.com
```

See **DEPLOYMENT_GUIDE.md** for complete instructions.

### Other Platforms

- **Vercel:** Use serverless functions (not recommended for file uploads)
- **Heroku:** Similar to Render, but paid
- **AWS:** More complex, better for enterprise
- **DigitalOcean:** Full VM, more control

---

## 📊 Performance

Optimizations:
- News cached by date (most recent first)
- Lazy loading images on frontend
- Minified CSS/JS
- Gzip compression enabled
- DB indexes on date, status, category
- CDN for static files (on production)

**Expected Performance:**
- Page load: < 2 seconds
- API response: < 500ms
- Can handle 1000+ concurrent users

---

## 🐛 Troubleshooting

### Admin login fails
- Check ADMIN_USERNAME and ADMIN_PASSWORD in `.env`
- Verify they match what you set in Render dashboard

### News don't appear
- Ensure status is "published" (not "draft")
- Check Supabase table has data
- Verify SUPABASE_URL and SUPABASE_KEY are correct

### File uploads fail
- On Render free tier, files deleted after 30 min
- Use Supabase Storage or external service (Cloudinary, etc.)

### Database connection error
- Verify SUPABASE_URL and SUPABASE_KEY
- Check database is running (Supabase dashboard)
- Try reconnecting to internet

### 500 errors in logs
- Check server logs: Render dashboard → Logs
- Verify all required env vars are set
- Restart service: Settings → Manual Deploy

---

## 💡 Tips & Tricks

**Speed up development:**
```bash
npm start  # Auto-restarts on file changes
```

**Test API endpoints:**
```bash
curl http://localhost:3000/api/news
curl -X POST http://localhost:3000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"your_password"}'
```

**Monitor database:**
- Supabase dashboard → Table Editor
- View real-time data updates

**Debug admin panel:**
- Press F12 → Console for JavaScript errors
- Check Network tab for failed API calls

---

## 📞 Support

**Need Help?**

1. **Community:**
   - Stack Overflow (tag: node.js, supabase)
   - GitHub Issues (create issue in repo)
   - Reddit: r/nodejs, r/webdev

2. **Official Docs:**
   - Render: https://render.com/docs
   - Supabase: https://supabase.com/docs
   - Node.js: https://nodejs.org/docs

---

## 📄 License

This project is open source. Feel free to modify and use for your own news website. you just have to give CREDITS to ME.

---

## 🎉 Next Steps

1. ✅ Set up local environment
2. ✅ Create Supabase database
3. ✅ Deploy to Render
4. ✅ Login to admin panel
5. ✅ Publish first article
6. ✅ Share with friends!

**Questions?** Create an issue in GitHub or reach out on social media.

**Enjoy running your news website! 📰**

---

