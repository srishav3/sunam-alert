# 🚀 Quick Start Card

**Print this page for quick reference!**

---

## ⚡ 5-Minute Setup

```bash
# 1. Copy environment template
cp .env.example .env

# 2. Edit .env and add your credentials
# ADMIN_PASSWORD=YourStrongPassword123
# SUPABASE_URL=https://your-project.supabase.co
# SUPABASE_KEY=your_key_here

# 3. Install and run
npm install
npm start

# 4. Visit
# http://localhost:3000          (Website)
# http://localhost:3000/admin.html (Admin)
```

---

## 🔐 Default Credentials

```
Username: admin
Password: (from ADMIN_PASSWORD in .env)
```

---

## 🗄️ Supabase in 2 Minutes

1. Go to **supabase.com**
2. Create project
3. Run SQL from **SUPABASE_SETUP.md**
4. Copy credentials to `.env`

---

## 🌐 Deploy to Render in 5 Steps

1. Push to GitHub: `git push origin main`
2. Go to **render.com** → Sign in
3. Create "Web Service" → Connect GitHub
4. Set same environment variables as `.env`
5. Click Deploy → **DONE!** ✅

---

## 📋 Files You Need

| File | What | Where |
|------|------|-------|
| `.env` | Credentials | **Create it** |
| `README.md` | Overview | **Read first** |
| `DEPLOYMENT_GUIDE.md` | Deploy steps | **Follow it** |
| `SUPABASE_SETUP.md` | DB setup | **Reference** |
| `CHECKLIST.md` | Action items | **Do these** |

---

## 🔧 Most Common Commands

```bash
npm start              # Run locally
npm install            # Install deps
git push origin main   # Deploy (if auto-deploy enabled)
curl http://localhost:3000/api/health  # Check health
```

---

## 🆘 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Admin login fails | Check .env ADMIN_PASSWORD |
| Database errors | Verify SUPABASE_URL & KEY |
| Pages don't load | Check F12 console |
| Deploy fails | Check Render logs |

---

## 📱 API Quick Reference

```
GET    /api/news              → Get all news
GET    /api/news/:id          → Get one article
GET    /api/ticker            → Get breaking news
GET    /api/ads               → Get advertisements
POST   /api/contact           → Submit contact form
POST   /api/admin/login       → Admin login
POST   /api/admin/news        → Create article
PUT    /api/admin/news/:id    → Update article
DELETE /api/admin/news/:id    → Delete article
```

---

## ✅ Success Signs

- [ ] Admin panel loads
- [ ] Can login
- [ ] Can publish news
- [ ] News appears on homepage
- [ ] Can see ticker
- [ ] Can manage ads

---

## 🎯 Do These Now

1. **TODAY**
   - [ ] Read README.md
   - [ ] Create .env
   - [ ] Set up Supabase
   - [ ] Test locally

2. **THIS WEEK**
   - [ ] Deploy to Render
   - [ ] Publish articles
   - [ ] Test production
   - [ ] Share with friends

---

## 🔗 Important Links

- **Supabase:** https://supabase.com
- **Render:** https://render.com
- **GitHub:** https://github.com
- **Docs:** See README.md & DEPLOYMENT_GUIDE.md

---

## 💡 Pro Tips

- Use strong passwords (12+ chars)
- Never commit `.env` to GitHub
- Test locally before deploying
- Check logs if something breaks
- Restart server if needed (Ctrl+C, npm start)

---

## ⏱️ Time Estimates

| Task | Time |
|------|------|
| Setup .env | 2 min |
| Create Supabase DB | 5 min |
| Test locally | 5 min |
| Deploy to Render | 10 min |
| Go live | 1 min |
| **Total** | **~25 min** |

---

## 📞 Need Help?

1. Check `README.md` for overview
2. Check `DEPLOYMENT_GUIDE.md` for steps
3. Check `CHECKLIST.md` for action items
4. Create GitHub issue if stuck

---

**You're ready! Start with Step 1 in CHECKLIST.md →**

*Last Updated: May 2026*

