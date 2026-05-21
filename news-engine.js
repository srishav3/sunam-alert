// News rendering engine for the public pages, using Supabase data and fallback content.

const DEFAULT_IMG = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=600&q=80';
const DEFAULT_TICKERS = [
  "SUNAM ALERT 'ਤੇ ਤੁਹਾਡਾ ਸੁਆਗਤ ਹੈ",
  "ਤਾਜ਼ੀਆਂ ਖ਼ਬਰਾਂ ਲਈ ਸਾਡੇ ਨਾਲ ਜੁੜੇ ਰਹੋ"
];

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'ਹੁਣੇ';
  if (mins < 60) return `${mins} ਮਿੰਟ ਪਹਿਲਾਂ`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} ਘੰਟੇ ਪਹਿਲਾਂ`;
  const days = Math.floor(hrs / 24);
  return `${days} ਦਿਨ ਪਹਿਲਾਂ`;
}

function catColor(cat) {
  const map = {
    'ਖੇਡਾਂ': 'green', 'ਸਿੱਖਿਆ': 'blue',
    'ਤਕਨਾਲੋਜੀ': 'orange', 'ਸਿਹਤ': 'green',
    'ਰਾਜਨੀਤੀ': 'blue', 'ਮਨੋਰੰਜਨ': 'orange',
  };
  return map[cat] || '';
}

function newsDetailUrl(n) {
  return window.location.origin + '/news-detail.html?id=' + encodeURIComponent(n.id || '');
}

function buildCard(n) {
  const detailUrl = newsDetailUrl(n);
  return `
    <div class="news-card">
      <a href="${detailUrl}" class="news-media-link">
        <img class="news-card-img" src="${n.img || DEFAULT_IMG}"
             onerror="this.src='${DEFAULT_IMG}'" alt="${n.title}" />
        ${n.video ? '<span class="video-badge">▶ Video</span>' : ''}
      </a>
      <div class="news-card-body">
        <span class="card-category ${catColor(n.category)}">${n.category}</span>
        <h3>${n.title}</h3>
        <div class="card-meta">${timeAgo(n.date)}</div>
        <div class="news-actions">
          <a href="${detailUrl}" class="btn-read-more">ਪੂਰੀ ਖ਼ਬਰ →</a>
          <a href="${n.fbLink || 'https://share.google/nPIYW8Nnlcsq6pZNR'}" target="_blank" class="btn-read-sm">Facebook</a>
          <a href="https://wa.me/?text=${encodeURIComponent(n.title + ' ' + detailUrl)}"
             target="_blank" class="btn-share-wa" title="WhatsApp 'ਤੇ ਸਾਂਝਾ ਕਰੋ">💬</a>
        </div>
      </div>
    </div>`;
}

function buildListItem(n) {
  return `
    <div class="news-list-item">
      <img class="news-list-img" src="${n.img || DEFAULT_IMG}"
           onerror="this.src='${DEFAULT_IMG}'" alt="${n.title}" />
      <div class="news-list-body">
        <span class="card-category ${catColor(n.category)}"
              style="font-size:9px;padding:2px 8px;">${n.category}</span>
        <h4>${n.title}</h4>
        <div class="news-list-foot">
          <span class="card-meta">${timeAgo(n.date)}</span>
          <div style="display:flex;gap:6px;">
            <a href="${newsDetailUrl(n)}" class="btn-read-sm">ਪੂਰੀ ਖ਼ਬਰ →</a>
            <a href="https://wa.me/?text=${encodeURIComponent(n.title + ' ' + (n.fbLink || ''))}"
               target="_blank" style="font-size:11px;font-weight:700;color:#25D366;">💬</a>
          </div>
        </div>
      </div>
    </div>`;
}

function buildHero(n) {
  return `
    <div class="hero-card" onclick="window.location.href='${newsDetailUrl(n)}'">
      <img src="${n.img || DEFAULT_IMG}"
           onerror="this.src='${DEFAULT_IMG}'" alt="${n.title}" style="height:340px;object-fit:cover;" />
      <div class="hero-card-overlay">
        <span class="card-category">${n.category}</span>
        <h2>${n.title}</h2>
        <p>${n.desc || ''}</p>
        <div class="hero-card-meta">${timeAgo(n.date)}</div>
      </div>
    </div>`;
}

async function fetchWithRetry(url, options = {}, retries = 3, backoff = 500) {
  try {
    const res = await fetch(url, options);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res;
  } catch (err) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, backoff));
      return fetchWithRetry(url, options, retries - 1, backoff * 2);
    }
    throw err;
  }
}

async function fetchTickers() {
  try {
    const res = await fetchWithRetry('/api/ticker');
    const data = await res.json();
    return data;
  } catch (err) {
    console.error('Ticker fetch error:', err);
    return { items: [] };
  }
}

async function fetchAds() {
  try {
    const res = await fetchWithRetry('/api/ads');
    return await res.json();
  } catch (err) {
    console.error('Ads fetch error:', err);
    return {};
  }
}

async function fetchNews(pageFilter) {
  try {
    const query = pageFilter && pageFilter !== 'all' ? `?page=${encodeURIComponent(pageFilter)}` : '';
    const res = await fetchWithRetry('/api/news' + query);
    return await res.json();
  } catch (err) {
    console.error('News fetch error:', err);
    return [];
  }
}

async function injectTicker() {
  const bar = document.querySelector('.breaking-bar');
  const track = document.querySelector('.ticker-track');
  if (!bar || !track) return;
  try {
    const data = await fetchTickers();
    
    // Use items from the database when available, otherwise fall back to default ticker text.
    const hasDbItems = Array.isArray(data.items) && data.items.length > 0;
    const items = hasDbItems ? data.items : DEFAULT_TICKERS.map(text => ({ text }));
    
    const tickerHtml = items.map(item =>
      `<span class="ticker-item">${item.text}</span><span class="ticker-sep">•</span>`
    ).join('');
    track.innerHTML = tickerHtml + tickerHtml;
    bar.style.display = 'flex';
  } catch (err) {
    if (DEFAULT_TICKERS.length === 0) {
      bar.style.display = 'none';
      track.innerHTML = '';
      return;
    }
    track.innerHTML = DEFAULT_TICKERS.map(t => `<span class="ticker-item">${t}</span><span class="ticker-sep">•</span>`).join('') + DEFAULT_TICKERS.map(t => `<span class="ticker-item">${t}</span><span class="ticker-sep">•</span>`).join('');
    bar.style.display = 'flex';
  }
}

function renderNews(containerId, news, mode) {
  const el = document.getElementById(containerId);
  if (!el) return;
  if (!news.length) return;

  if (mode === 'hero') {
    el.innerHTML = buildHero(news[0]);
    return;
  }

  if (mode === 'grid') {
    el.innerHTML = news.slice(0, 4).map(buildCard).join('');
    return;
  }

  if (mode === 'list') {
    el.innerHTML = news.slice(0, 5).map(buildListItem).join('');
    return;
  }

  let html = '';
  const isMobile = window.matchMedia('(max-width: 900px)').matches;
  if (news[0]) html += buildHero(news[0]);

  if (!isMobile) {
    if (news.length > 1) {
      const remaining = news.slice(1, 51);
      const gridItems = remaining.slice(0, 12);
      const listItems = remaining.slice(12);
      if (gridItems.length > 0) {
        html += '<div class="news-grid" style="margin-top:20px;">' + gridItems.map(buildCard).join('') + '</div>';
      }
      if (listItems.length > 0) {
        html += '<div class="news-list" style="margin-top:16px;">' + listItems.map(buildListItem).join('') + '</div>';
      }
    }
  } else {
    const topThree = news.slice(1, 4);
    const nextFour = news.slice(4, 8);
    const rest = news.slice(8, 51);

    if (topThree.length > 0) {
      html += '<div class="news-grid" style="margin-top:20px;">' + topThree.map(buildCard).join('') + '</div>';
    }
    if (news.length > 4) {
      html += '<div class="mobile-news-ad" data-ad-slot="ad1"></div>';
    }
    if (nextFour.length > 0) {
      html += '<div class="news-grid" style="margin-top:16px;">' + nextFour.map(buildCard).join('') + '</div>';
    }
    if (news.length > 8) {
      html += '<div class="mobile-news-ad-full" data-ad-slot="ad2"></div>';
    }
    if (rest.length > 0) {
      html += '<div class="news-list" style="margin-top:16px;">' + rest.map(buildListItem).join('') + '</div>';
    }
  }
  el.innerHTML = html;

  if (isMobile) {
    const smallPlaceholder = '<div class="ad-box ad-box-small"><div class="ad-label">ADVERTISEMENT</div><div class="ad-placeholder ad-placeholder-small"><div class="ad-ico">📢</div><div>AD1</div></div></div>';
    const largePlaceholder = '<div class="ad-box ad-box-large"><div class="ad-label">ADVERTISEMENT</div><div class="ad-placeholder"><div class="ad-ico">📢</div><div>AD2</div></div></div>';
    document.querySelectorAll('.mobile-news-ad[data-ad-slot="ad1"]').forEach(slot => {
      if (!slot.innerHTML.trim()) slot.innerHTML = smallPlaceholder;
    });
    document.querySelectorAll('.mobile-news-ad-full[data-ad-slot="ad2"]').forEach(slot => {
      if (!slot.innerHTML.trim()) slot.innerHTML = largePlaceholder;
    });

    fetchAds().then(ads => {
      document.querySelectorAll('.mobile-news-ad[data-ad-slot="ad1"]').forEach(slot => {
        const ad = ads.ad1;
        if (ad && ad.img) {
          slot.innerHTML = '<div class="ad-box ad-box-small"><div class="ad-label">ADVERTISEMENT</div><a href="' + (ad.link || '#') + '" target="_blank"><img class="ad-image" src="' + ad.img + '" alt="' + (ad.title || 'Ad') + '" /></a><div class="ad-title">' + (ad.title || '') + '</div></div>';
        }
      });
      document.querySelectorAll('.mobile-news-ad-full[data-ad-slot="ad2"]').forEach(slot => {
        const ad = ads.ad2;
        if (ad && ad.img) {
          slot.innerHTML = '<div class="ad-box ad-box-large"><div class="ad-label">ADVERTISEMENT</div><a href="' + (ad.link || '#') + '" target="_blank"><img class="ad-image" src="' + ad.img + '" alt="' + (ad.title || 'Ad') + '" /></a><div class="ad-title">' + (ad.title || '') + '</div></div>';
        }
      });
    });
  }
}

async function injectNews(containerId, pageFilter, mode) {
  const news = await fetchNews(pageFilter);
  renderNews(containerId, news, mode);

  // Toggle "No News" message visibility
  const noNewsMsg = document.getElementById('no-news-msg');
  if (noNewsMsg) {
    if (!news || news.length === 0) {
      noNewsMsg.style.display = 'block';
    } else {
      noNewsMsg.style.display = 'none';
    }
  }
}

async function injectAds() {
  const ads = await fetchAds();
  document.querySelectorAll('[data-ad-slot]').forEach(box => {
    const slot = box.getAttribute('data-ad-slot');
    const ad = ads[slot];
    if (ad && ad.img) {
      box.innerHTML = `
        <div class="ad-label">ADVERTISEMENT</div>
        <a href="${ad.link || '#'}" target="_blank">
          <img class="ad-image" src="${ad.img}" alt="${ad.title || 'Ad'}" />
        </a>
        <div class="ad-title">${ad.title || ''}</div>
      `;
    }
  });
}

document.addEventListener('DOMContentLoaded', async function () {
  const page = window.location.pathname.split('/').pop() || 'index.html';
  await injectTicker();
  await injectAds();
  if (page === 'index.html' || page === '') {
    await injectNews('admin-news-section', 'home', 'all');
  } else if (page === 'news.html') {
    await injectNews('admin-news-section', 'all', 'all');
  } else if (page === 'sports.html') {
    await injectNews('admin-news-section', 'sports', 'all');
  } else if (page === 'politics.html') {
    await injectNews('admin-news-section', 'politics', 'all');
  } else if (page === 'entertainment.html') {
    await injectNews('admin-news-section', 'entertainment', 'all');
  } else if (page === 'live.html') {
    await injectNews('admin-news-section', 'live', 'all');
  }
});


