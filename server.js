// Express backend for Sunam Alert with Supabase API and utility endpoints.
const express = require('express');
const multer = require('multer');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const path = require('path');
const https = require('https');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const ROOT = __dirname;
const UPLOAD_DIR = path.join(ROOT, 'uploads');
const LOG_DIR = path.join(ROOT, 'logs');
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.mp4', '.webm', '.mov'];
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500, // request limit per 15-minute window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50, // login attempts limit per 15-minute window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts, please try again later.' }
});

function loadEnvFile() {
  const envPath = path.join(ROOT, '.env');
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const index = trimmed.indexOf('=');
    if (index === -1) continue;
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^["']|["']$/g, '');
    if (key && process.env[key] === undefined) process.env[key] = value;
  }
}

loadEnvFile();

const PORT = process.env.PORT || 3000;
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const ADMIN_COOKIE = 'sunam_admin_session';
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_KEY || '';
const SUPABASE_ENABLED = Boolean(SUPABASE_URL && SUPABASE_KEY);
const adminSessions = new Set();
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const STATS_FILE = path.join(LOG_DIR, 'stats.json');

async function migrateLocalStatsToDb() {
  if (!SUPABASE_ENABLED) return;
  if (!fs.existsSync(STATS_FILE)) return;

  try {
    const localStats = JSON.parse(fs.readFileSync(STATS_FILE, 'utf8'));
    const localViews = Number(localStats.homeViews || 0);
    if (localViews <= 0) return;

    const { data: existing, error: readError } = await supabase
      .from('site_stats')
      .select('home_views')
      .eq('id', 'home')
      .maybeSingle();

    if (readError) {
      console.error('Supabase stats migration read error:', readError);
      return;
    }

    const dbViews = Number(existing?.home_views ?? 0);
    if (localViews > dbViews) {
      const { error: upsertError } = await supabase
        .from('site_stats')
        .upsert({ id: 'home', home_views: localViews, updated_at: new Date().toISOString() }, { onConflict: 'id' });

      if (upsertError) {
        console.error('Supabase stats migration upsert error:', upsertError);
        return;
      }
      console.log('Migrated local stats to Supabase:', localViews);
    }
  } catch (err) {
    console.error('Local stats migration failed:', err);
  }
}

fs.mkdirSync(UPLOAD_DIR, { recursive: true });
fs.mkdirSync(LOG_DIR, { recursive: true });

migrateLocalStatsToDb().catch(err => console.error('Stats migration startup failed:', err));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeExt = ALLOWED_EXTENSIONS.includes(ext) ? ext : '.jpg';
    cb(null, Date.now() + '-' + crypto.randomBytes(8).toString('hex') + safeExt);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const isImage = ALLOWED_IMAGE_TYPES.includes(file.mimetype) && ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext);
    const isVideo = ALLOWED_VIDEO_TYPES.includes(file.mimetype) && ['.mp4', '.webm', '.mov'].includes(ext);
    if (!isImage && !isVideo) return cb(new Error('Only JPEG/PNG/WebP images or MP4/WebM/MOV videos are allowed'));
    cb(null, true);
  }
});

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      scriptSrcAttr: ["'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "data:", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https:"]
    }
  }
}));
app.set('trust proxy', 1);
app.use(limiter);
app.use('/uploads', express.static(UPLOAD_DIR));
app.use(express.static(ROOT));

function parseCookies(header = '') {
  return Object.fromEntries(header.split(';').map(part => {
    const index = part.indexOf('=');
    if (index === -1) return null;
    return [
      decodeURIComponent(part.slice(0, index).trim()),
      decodeURIComponent(part.slice(index + 1).trim())
    ];
  }).filter(Boolean));
}

function isAdmin(req) {
  const cookies = parseCookies(req.headers.cookie || '');
  return Boolean(cookies[ADMIN_COOKIE] && adminSessions.has(cookies[ADMIN_COOKIE]));
}

function requireAdmin(req, res, next) {
  if (isAdmin(req)) return next();
  res.status(401).json({ error: 'Admin login required' });
}

function safeCompare(a = '', b = '') {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function normalizeNewsItem(n) {
  return {
    id: n.id,
    title: n.title,
    desc: n.desc,
    fbLink: n.fbLink || n.fb_link || n.fblink || '',
    img: n.img,
    video: n.video,
    category: n.category,
    page: Array.isArray(n.page) ? n.page : (n.page ? [n.page] : []),
    author: n.author,
    date: n.date,
    status: n.status,
    featured: n.featured,
    breaking: n.breaking,
    trending: n.trending,
    createdAt: n.created_at,
    updatedAt: n.updated_at
  };
}

function formatDatabasePageFilter(page) {
  if (!page || page === 'all') return undefined;
  return Array.isArray(page) ? page : [page];
}

function ensureSupabase(req, res, next) {
  if (!SUPABASE_ENABLED) {
    return res.status(503).json({ error: 'SUPABASE_URL and SUPABASE_KEY are required' });
  }
  next();
}

async function getStatsFromDb() {
  try {
    const { data, error } = await supabase
      .from('site_stats')
      .select('home_views')
      .eq('id', 'home')
      .maybeSingle();

    if (error) {
      console.error('Supabase getStats error:', error);
      return { homeViews: 0 };
    }

    return { homeViews: data?.home_views ?? 0 };
  } catch (err) {
    console.error('Unexpected getStats error:', err);
    return { homeViews: 0 };
  }
}

async function incrementHomeViews() {
  try {
    const { data: current, error: readError } = await supabase
      .from('site_stats')
      .select('home_views')
      .eq('id', 'home')
      .maybeSingle();

    if (readError) {
      console.error('Supabase stats read error:', readError);
      throw readError;
    }

    if (!current) {
      const { data, error } = await supabase
        .from('site_stats')
        .insert({ id: 'home', home_views: 1, updated_at: new Date().toISOString() })
        .select('home_views')
        .single();

      if (error) {
        console.error('Supabase stats insert error:', error);
        throw error;
      }

      return { homeViews: data.home_views };
    }

    const { data, error } = await supabase
      .from('site_stats')
      .update({ home_views: (current.home_views || 0) + 1, updated_at: new Date().toISOString() })
      .eq('id', 'home')
      .select('home_views')
      .single();

    if (error) {
      console.error('Supabase stats update error:', error);
      throw error;
    }

    return { homeViews: data.home_views };
  } catch (err) {
    console.error('Supabase increment error:', err);
    throw err;
  }
}

app.get('/api/stats', ensureSupabase, async (req, res) => {
  try {
    res.json(await getStatsFromDb());
  } catch (err) {
    res.status(500).json({ error: 'Failed to read stats' });
  }
});

app.post('/api/stats/increment', ensureSupabase, async (req, res) => {
  try {
    res.json(await incrementHomeViews());
  } catch (err) {
    res.status(500).json({ error: 'Failed to increment stats' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'sunam-alert-backend', supabase: SUPABASE_ENABLED });
});

app.get('/api/admin/session', (req, res) => {
  res.json({ authenticated: isAdmin(req) });
});

app.post('/api/admin/login', authLimiter, (req, res) => {
  const currentPassword = process.env.ADMIN_PASSWORD;
  if (!currentPassword) {
    res.status(500).json({ error: 'ADMIN_PASSWORD is not configured on the server' });
    return;
  }

  const { username = '', password = '' } = req.body || {};
  if (!safeCompare(username, ADMIN_USERNAME) || !safeCompare(password, currentPassword)) {
    res.status(401).json({ error: 'Wrong username or password' });
    return;
  }

  const token = crypto.randomBytes(32).toString('hex');
  adminSessions.add(token);
  const cookieParts = [`${ADMIN_COOKIE}=${encodeURIComponent(token)}`, 'HttpOnly', 'SameSite=Lax', 'Path=/', 'Max-Age=86400'];
  if (process.env.NODE_ENV === 'production') cookieParts.push('Secure');
  res.setHeader('Set-Cookie', cookieParts.join('; '));
  res.json({ ok: true });
});

app.post('/api/admin/change-password', requireAdmin, (req, res) => {
  const { oldPassword, newPassword } = req.body || {};
  const currentPassword = process.env.ADMIN_PASSWORD;

  if (!currentPassword) {
    return res.status(500).json({ error: 'Current password not set in environment.' });
  }

  if (!safeCompare(oldPassword, currentPassword)) {
    return res.status(401).json({ error: 'Old password is incorrect' });
  }

  if (!newPassword || newPassword.length < 4) {
    return res.status(400).json({ error: 'New password must be at least 4 characters long' });
  }

  try {
    const envPath = path.join(ROOT, '.env');
    let envContent = '';
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }

    const newEntry = `ADMIN_PASSWORD=${newPassword}`;
    let newEnvContent;

    if (envContent.includes('ADMIN_PASSWORD=')) {
      newEnvContent = envContent.replace(/ADMIN_PASSWORD=.*/, newEntry);
    } else {
      newEnvContent = envContent + (envContent.endsWith('\n') ? '' : '\n') + newEntry + '\n';
    }

    fs.writeFileSync(envPath, newEnvContent, 'utf8');
    
    // Keep the updated admin password available to the running process.
    process.env.ADMIN_PASSWORD = newPassword;

    res.json({ ok: true, message: 'Password updated successfully and saved to .env file.' });
  } catch (err) {
    console.error('Password change error:', err);
    res.status(500).json({ error: 'Failed to update password in .env file' });
  }
});

app.post('/api/admin/logout', (req, res) => {
  const cookies = parseCookies(req.headers.cookie || '');
  if (cookies[ADMIN_COOKIE]) adminSessions.delete(cookies[ADMIN_COOKIE]);
  res.setHeader('Set-Cookie', `${ADMIN_COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`);
  res.json({ ok: true });
});

function getNewsQuery(req) {
  let query = supabase.from('news').select('*').order('date', { ascending: false });
  const page = req.query.page;
  const trending = req.query.trending === 'true';
  const status = req.query.status || 'published';

  if (status !== 'all') query = query.eq('status', status);
  if (trending) query = query.eq('trending', true);
  const pageFilter = formatDatabasePageFilter(page);
  if (pageFilter) query = query.contains('page', pageFilter);

  return query;
}

app.get('/api/news', ensureSupabase, async (req, res) => {
  try {
    const { data, error } = await getNewsQuery(req);
    if (error) throw error;
    res.json((data || []).map(normalizeNewsItem));
  } catch (err) {
    console.error('News fetch error:', err.message || err);
    res.status(502).json({ error: 'Unable to fetch news right now' });
  }
});

app.get('/api/news/:id', ensureSupabase, async (req, res) => {
  const id = req.params.id;
  if (!id) return res.status(400).json({ error: 'News id is required' });

  try {
    const { data, error } = await supabase.from('news').select('*').eq('id', id).single();
    if (error) {
      if (error.code === 'PGRST116') return res.status(404).json({ error: 'News item not found' });
      throw error;
    }
    res.json(normalizeNewsItem(data));
  } catch (err) {
    console.error('News detail error:', err.message || err);
    res.status(502).json({ error: 'Unable to fetch news item' });
  }
});

app.get('/api/ticker', ensureSupabase, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('ticker_items')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) throw error;
    res.json({ items: (data || []).map(item => ({ id: item.id, text: item.text, type: 'manual' })) });
  } catch (err) {
    console.error('Ticker fetch error:', err.message || err);
    res.status(502).json({ error: 'Unable to fetch ticker items' });
  }
});

app.get('/api/ads', ensureSupabase, async (req, res) => {
  try {
    const { data, error } = await supabase.from('site_ads').select('*');
    if (error) throw error;
    const ads = (data || []).reduce((acc, item) => {
      acc[item.id] = { id: item.id, title: item.title, link: item.link, img: item.img, updatedAt: item.updated_at };
      return acc;
    }, {});
    res.json(ads);
  } catch (err) {
    console.error('Ads fetch error:', err.message || err);
    res.status(502).json({ error: 'Unable to fetch ads' });
  }
});

app.get('/api/admin/news', requireAdmin, ensureSupabase, async (req, res) => {
  try {
    const { data, error } = await getNewsQuery(req);
    if (error) throw error;
    res.json((data || []).map(normalizeNewsItem));
  } catch (err) {
    console.error('Admin news fetch error:', err.message || err);
    res.status(502).json({ error: 'Unable to fetch admin news' });
  }
});

app.post('/api/admin/news', requireAdmin, ensureSupabase, async (req, res) => {
  const body = req.body || {};
  const page = Array.isArray(body.page) ? body.page : (typeof body.page === 'string' ? body.page.split(',').map(p => p.trim()).filter(Boolean) : ['home']);
  const payload = {
    id: body.id || crypto.randomUUID(),
    title: String(body.title || '').trim(),
    desc: String(body.desc || '').trim(),
    fblink: String(body.fbLink || body.fb_link || body.fblink || '').trim(),
    img: String(body.img || '').trim(),
    video: String(body.video || '').trim(),
    category: String(body.category || 'General').trim(),
    page: page.length ? page : ['home'],
    author: String(body.author || 'SUNAM ALERT').trim(),
    date: new Date(body.date || Date.now()).toISOString(),
    status: body.status || 'draft',
    featured: Boolean(body.featured),
    trending: Boolean(body.trending),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  if (!payload.title) {
    return res.status(400).json({ error: 'News title is required' });
  }

  try {
    const { data, error } = await supabase.from('news').insert([payload]).select();
    if (error) throw error;
    res.json(normalizeNewsItem(data[0]));
  } catch (err) {
    console.error('Create news error:', err.message || err);
    res.status(502).json({ error: 'Unable to create news item' });
  }
});

app.put('/api/admin/news/:id', requireAdmin, ensureSupabase, async (req, res) => {
  const id = req.params.id;
  const body = req.body || {};
  const updates = {
    title: body.title,
    desc: body.desc,
    fblink: body.fbLink || body.fb_link || body.fblink,
    img: body.img,
    video: body.video,
    category: body.category,
    page: Array.isArray(body.page) ? body.page : (typeof body.page === 'string' ? body.page.split(',').map(p => p.trim()).filter(Boolean) : undefined),
    author: body.author,
    date: body.date ? new Date(body.date).toISOString() : undefined,
    status: body.status,
    featured: body.featured,
    trending: body.trending,
    updated_at: new Date().toISOString()
  };

  Object.keys(updates).forEach(key => updates[key] === undefined && delete updates[key]);

  try {
    const { data, error } = await supabase.from('news').update(updates).eq('id', id).select().single();
    if (error) throw error;
    res.json(normalizeNewsItem(data));
  } catch (err) {
    console.error('Update news error:', err.message || err);
    res.status(502).json({ error: 'Unable to update news item' });
  }
});

app.delete('/api/admin/news/:id', requireAdmin, ensureSupabase, async (req, res) => {
  const id = req.params.id;
  try {
    const { error } = await supabase.from('news').delete().eq('id', id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (err) {
    console.error('Delete news error:', err.message || err);
    res.status(502).json({ error: 'Unable to delete news item' });
  }
});

app.get('/api/admin/ticker', requireAdmin, ensureSupabase, async (req, res) => {
  try {
    const { data, error } = await supabase.from('ticker_items').select('*').order('created_at', { ascending: false }).limit(50);
    if (error) throw error;
    res.json((data || []).map(item => ({ id: item.id, text: item.text })));
  } catch (err) {
    console.error('Admin ticker fetch error:', err.message || err);
    res.status(502).json({ error: 'Unable to fetch ticker items' });
  }
});

app.post('/api/admin/ticker', requireAdmin, ensureSupabase, async (req, res) => {
  const text = String((req.body || {}).text || '').trim();
  if (!text) return res.status(400).json({ error: 'Ticker text is required' });
  try {
    const { data, error } = await supabase.from('ticker_items').insert([{ text, created_at: new Date().toISOString() }]).select();
    if (error) throw error;
    res.json({ id: data[0].id, text: data[0].text });
  } catch (err) {
    console.error('Create ticker error:', err.message || err);
    res.status(502).json({ error: 'Unable to create ticker item' });
  }
});

app.post('/api/admin/ticker/reset', requireAdmin, ensureSupabase, async (req, res) => {
  const defaults = [
    "SUNAM ALERT 'ਤੇ ਤੁਹਾਡਾ ਸੁਆਗਤ ਹੈ",
    'ਤਾਜ਼ੀਆਂ ਖ਼ਬਰਾਂ ਲਈ ਸਾਡੇ ਨਾਲ ਜੁੜੋ'
  ];
  try {
    const { error } = await supabase.from('ticker_items').delete();
    if (error) throw error;
    const { data, error: insertError } = await supabase.from('ticker_items').insert(defaults.map(text => ({ text, created_at: new Date().toISOString() }))).select();
    if (insertError) throw insertError;
    res.json({ ok: true, items: data.map(item => ({ id: item.id, text: item.text })) });
  } catch (err) {
    console.error('Reset ticker error:', err.message || err);
    res.status(502).json({ error: 'Unable to reset ticker items' });
  }
});

app.delete('/api/admin/ticker/:id', requireAdmin, ensureSupabase, async (req, res) => {
  const id = req.params.id;
  try {
    const { error } = await supabase.from('ticker_items').delete().eq('id', id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (err) {
    console.error('Delete ticker error:', err.message || err);
    res.status(502).json({ error: 'Unable to delete ticker item' });
  }
});

app.get('/api/admin/ads', requireAdmin, ensureSupabase, async (req, res) => {
  try {
    const { data, error } = await supabase.from('site_ads').select('*');
    if (error) throw error;
    const ads = (data || []).reduce((acc, item) => {
      acc[item.id] = { id: item.id, title: item.title, link: item.link, img: item.img, updatedAt: item.updated_at };
      return acc;
    }, {});
    res.json(ads);
  } catch (err) {
    console.error('Admin ads fetch error:', err.message || err);
    res.status(502).json({ error: 'Unable to fetch ads' });
  }
});

app.post('/api/admin/ads', requireAdmin, ensureSupabase, async (req, res) => {
  const { slot, title, link, img } = req.body || {};
  if (!slot || !img) return res.status(400).json({ error: 'Ad slot and image URL are required.' });
  const payload = {
    id: String(slot),
    title: String(title || '').trim(),
    link: String(link || '').trim(),
    img: String(img || '').trim(),
    updated_at: new Date().toISOString()
  };
  try {
    const { data, error } = await supabase.from('site_ads').upsert([payload], { onConflict: 'id' }).select();
    if (error) throw error;
    res.json(payload);
  } catch (err) {
    console.error('Create/update ad error:', err.message || err);
    res.status(502).json({ error: 'Unable to save advertisement' });
  }
});

app.delete('/api/admin/ads/:slot', requireAdmin, ensureSupabase, async (req, res) => {
  const slot = req.params.slot;
  try {
    const { error } = await supabase.from('site_ads').delete().eq('id', slot);
    if (error) throw error;
    res.json({ ok: true });
  } catch (err) {
    console.error('Delete ad error:', err.message || err);
    res.status(502).json({ error: 'Unable to delete advertisement' });
  }
});

function getJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 SUNAMALERT/1.0',
        'Accept': 'application/json,text/plain,*/*'
      }
    }, response => {
      let body = '';
      response.on('data', chunk => { body += chunk; });
      response.on('end', () => {
        if (response.statusCode < 200 || response.statusCode >= 300) {
          reject(new Error('Weather API returned ' + response.statusCode));
          return;
        }
        try {
          resolve(JSON.parse(body));
        } catch (err) {
          reject(err);
        }
      });
    }).on('error', reject);
  });
}

app.get('/api/weather', async (req, res) => {
  const url = 'https://api.open-meteo.com/v1/forecast?latitude=30.1297&longitude=75.7998&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&timezone=Asia%2FKolkata';

  try {
    const data = await getJson(url);
    const current = data.current || {};
    res.json({
      location: 'Sunam, Punjab',
      temperature: current.temperature_2m,
      humidity: current.relative_humidity_2m,
      wind: current.wind_speed_10m,
      code: current.weather_code,
      updatedAt: current.time
    });
  } catch (err) {
    res.status(502).json({ error: 'Unable to fetch weather right now' });
  }
});


app.get('/api/markets', async (req, res) => {
  const symbols = [
    { key: 'nifty', label: 'NIFTY 50', yahoo: '^NSEI' },
    { key: 'sensex', label: 'SENSEX', yahoo: '^BSESN' },
    { key: 'banknifty', label: 'BANK NIFTY', yahoo: '^NSEBANK' }
  ];

  try {
    const results = await Promise.all(symbols.map(async item => {
      const url = 'https://query1.finance.yahoo.com/v8/finance/chart/' + encodeURIComponent(item.yahoo) + '?interval=1d&range=5d';
      const data = await getJson(url);
      const result = data.chart && data.chart.result && data.chart.result[0];
      const meta = result && result.meta ? result.meta : {};
      const price = Number(meta.regularMarketPrice || meta.previousClose || 0);
      const prev = Number(meta.chartPreviousClose || meta.previousClose || 0);
      const change = prev ? price - prev : 0;
      const changePercent = prev ? (change / prev) * 100 : 0;
      return {
        key: item.key,
        label: item.label,
        price,
        change,
        changePercent,
        currency: meta.currency || 'INR',
        updatedAt: meta.regularMarketTime ? new Date(meta.regularMarketTime * 1000).toISOString() : new Date().toISOString()
      };
    }));
    res.json({ source: 'Yahoo Finance chart data', delayed: true, items: results });
  } catch (err) {
    res.status(502).json({ error: 'Unable to fetch market data right now' });
  }
});

app.post('/api/contact', async (req, res) => {
  const { name, email, subject, message } = req.body || {};
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email, and message are required.' });
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email address.' });
  }

  const payload = {
    name: String(name),
    email: String(email),
    subject: String(subject || 'No subject'),
    message: String(message),
    created_at: new Date().toISOString()
  };

  if (SUPABASE_ENABLED) {
    try {
      const { error } = await supabase.from('contact_messages').insert([payload]);
      if (error) throw error;
      return res.json({ ok: true });
    } catch (err) {
      console.error('Supabase contact save failed:', err.message || err);
    }
  }

  const logEntry = `[${new Date().toISOString()}] ${payload.name} <${payload.email}> | ${payload.subject}\n${payload.message}\n---\n`;
  try {
    fs.appendFileSync(path.join(LOG_DIR, 'contact-messages.log'), logEntry, 'utf8');
    res.json({ ok: true });
  } catch (err) {
    console.error('Failed to save contact message:', err);
    res.status(500).json({ error: 'Unable to process contact request.' });
  }
});

app.post('/api/upload', requireAdmin, upload.single('media'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Media file is required' });
  res.json({ url: '/uploads/' + req.file.filename, type: req.file.mimetype.startsWith('video/') ? 'video' : 'image' });
});

app.use((err, req, res, next) => {
  res.status(400).json({ error: err.message || 'Request failed' });
});

app.listen(PORT, () => {
  console.log('SUNAM ALERT backend running at http://localhost:' + PORT);
});



