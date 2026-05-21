// UI enhancements: WhatsApp float button, back-to-top, dark mode, and share actions.

const WA_NUMBER = '919216813000';
const FB_URL = 'https://share.google/nPIYW8Nnlcsq6pZNR';

// Create the floating WhatsApp contact button.
function createWhatsAppFloat() {
  const btn = document.createElement('a');
  btn.id = 'wa-float';
  btn.href = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent('ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ SUNAM ALERT ਨਾਲ ਸੰਪਰਕ ਕਰਨਾ ਚਾਹੁੰਦਾ ਹਾਂ।')}`;
  btn.target = '_blank';
  btn.title = 'WhatsApp ਤੇ ਸੰਪਰਕ ਕਰੋ';
  btn.innerHTML = '💬';
  btn.style.cssText = `
    position: fixed;
    bottom: 80px;
    right: 20px;
    width: 56px;
    height: 56px;
    background: #25D366;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 28px;
    box-shadow: 0 4px 16px rgba(37,211,102,0.5);
    z-index: 9998;
    text-decoration: none;
    transition: transform 0.2s, box-shadow 0.2s;
    animation: wa-pulse 2s infinite;
  `;
  btn.onmouseenter = () => {
    btn.style.transform = 'scale(1.12)';
    btn.style.boxShadow = '0 6px 20px rgba(37,211,102,0.7)';
  };
  btn.onmouseleave = () => {
    btn.style.transform = 'scale(1)';
    btn.style.boxShadow = '0 4px 16px rgba(37,211,102,0.5)';
  };

  // Tooltip
  const tip = document.createElement('div');
  tip.textContent = 'WhatsApp ਕਰੋ';
  tip.style.cssText = `
    position: fixed;
    bottom: 95px;
    right: 84px;
    background: #111;
    color: white;
    font-size: 12px;
    font-weight: 600;
    padding: 6px 12px;
    border-radius: 6px;
    white-space: nowrap;
    z-index: 9997;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.2s;
    font-family: 'Mukta', sans-serif;
  `;
  btn.onmouseenter = () => { tip.style.opacity = '1'; btn.style.transform = 'scale(1.12)'; };
  btn.onmouseleave = () => { tip.style.opacity = '0'; btn.style.transform = 'scale(1)'; };

  document.body.appendChild(tip);
  document.body.appendChild(btn);

  // Pulse animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes wa-pulse {
      0%, 100% { box-shadow: 0 4px 16px rgba(37,211,102,0.5); }
      50% { box-shadow: 0 4px 28px rgba(37,211,102,0.8); }
    }
  `;
  document.head.appendChild(style);
}

// Create a back-to-top button that appears when the user scrolls down.
function createBackToTop() {
  const btn = document.createElement('button');
  btn.id = 'back-to-top';
  btn.innerHTML = '▲';
  btn.title = 'ਉੱਪਰ ਜਾਓ';
  btn.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 46px;
    height: 46px;
    background: #D32F2F;
    color: white;
    border: none;
    border-radius: 50%;
    font-size: 18px;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(211,47,47,0.4);
    z-index: 9996;
    opacity: 0;
    transform: translateY(20px);
    transition: opacity 0.3s, transform 0.3s;
    font-family: sans-serif;
  `;
  btn.onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });
  document.body.appendChild(btn);

  window.addEventListener('scroll', () => {
    if (window.scrollY > 400) {
      btn.style.opacity = '1';
      btn.style.transform = 'translateY(0)';
    } else {
      btn.style.opacity = '0';
      btn.style.transform = 'translateY(20px)';
    }
  });
}

// Add a dark mode toggle and remember the user preference.
function createDarkModeToggle() {
  const isDark = localStorage.getItem('sa_dark') === '1';
  if (isDark) document.body.classList.add('dark-mode');

  const btn = document.createElement('button');
  btn.id = 'dark-toggle';
  btn.title = 'Dark / Light Mode';
  btn.innerHTML = isDark ? '☀️' : '🌙';
  btn.style.cssText = `
    position: fixed;
    top: 68px;
    right: 14px;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: white;
    border: 1px solid #ddd;
    font-size: 18px;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    z-index: 999;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  `;
  btn.onclick = () => {
    const dark = document.body.classList.toggle('dark-mode');
    localStorage.setItem('sa_dark', dark ? '1' : '0');
    btn.innerHTML = dark ? '☀️' : '🌙';
    btn.style.background = dark ? '#333' : 'white';
  };
  if (isDark) { btn.style.background = '#333'; }
  document.body.appendChild(btn);

  // Dark mode CSS
  const style = document.createElement('style');
  style.textContent = `
    body.dark-mode {
      background: #121212 !important;
      color: #e0e0e0 !important;
    }
    body.dark-mode .site-header,
    body.dark-mode .widget,
    body.dark-mode .news-card,
    body.dark-mode .news-list-item,
    body.dark-mode .live-item,
    body.dark-mode .panel-card,
    body.dark-mode .politics-card,
    body.dark-mode .contact-form-box,
    body.dark-mode .editor-card,
    body.dark-mode .team-card,
    body.dark-mode .stats-bar,
    body.dark-mode .ad-box,
    body.dark-mode .review-box,
    body.dark-mode .office-card {
      background: #1e1e1e !important;
      color: #e0e0e0 !important;
      border-color: #333 !important;
    }
    body.dark-mode .main-nav a,
    body.dark-mode .section-title,
    body.dark-mode h1, body.dark-mode h2, body.dark-mode h3, body.dark-mode h4 {
      color: #f0f0f0 !important;
    }
    body.dark-mode .breaking-bar {
      background: #1a1a1a !important;
      border-color: #333 !important;
    }
    body.dark-mode .ticker-item { color: #ccc !important; }
    body.dark-mode input, body.dark-mode select, body.dark-mode textarea {
      background: #2a2a2a !important;
      color: #e0e0e0 !important;
      border-color: #444 !important;
    }
    body.dark-mode .card-meta,
    body.dark-mode .news-admin-meta,
    body.dark-mode p { color: #aaa !important; }
    body.dark-mode .trending-title { color: #ddd !important; }
    body.dark-mode .market-widget,
    body.dark-mode .market-header,
    body.dark-mode .market-row,
    body.dark-mode .market-loading {
      background: #1e1e1e !important;
      border-color: #333 !important;
      color: #e0e0e0 !important;
    }
    body.dark-mode .market-row strong,
    body.dark-mode .market-values b {
      color: #f0f0f0 !important;
    }
    body.dark-mode .market-row span {
      color: #bbb !important;
    }
    body.dark-mode .btn-social {
      background: #2a2a2a !important;
      border-color: #444 !important;
      color: #f0f0f0 !important;
    }
    body.dark-mode .site-footer { background: #0a0a0a !important; }
    body.dark-mode #dark-toggle { background: #333 !important; border-color: #555 !important; }
  `;
  document.head.appendChild(style);
}


// Add share buttons for static news cards rendered outside the admin UI.
function addShareButtons() {
  document.querySelectorAll('.btn-read-more').forEach(btn => {
    const href = btn.href || FB_URL;
    const title = btn.closest('.news-card-body')?.querySelector('h3')?.textContent || 'SUNAM ALERT';
    if (btn.parentNode && !btn.parentNode.querySelector('.static-share')) {
      const waShare = document.createElement('a');
      waShare.className = 'static-share';
      waShare.href = `https://wa.me/?text=${encodeURIComponent(title + ' ' + href)}`;
      waShare.target = '_blank';
      waShare.style.cssText = 'display:inline-flex;align-items:center;gap:4px;background:#25D366;color:white;padding:6px 12px;border-radius:4px;font-size:12px;font-weight:700;text-decoration:none;margin-left:6px;';
      waShare.innerHTML = '💬 Share';
      btn.parentNode.appendChild(waShare);
    }
  });
}

// Inject shared animation styles used by the enhanced UI elements.
function addAnimStyles() {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
    @keyframes slideUp { from { transform: translateY(30px); opacity:0; } to { transform:translateY(0);opacity:1; } }
  `;
  document.head.appendChild(style);
}

// Initialize UI enhancements once the page DOM is loaded.
document.addEventListener('DOMContentLoaded', function () {
  addAnimStyles();
  createWhatsAppFloat();
  createBackToTop();
  createDarkModeToggle();
  addShareButtons();
  // First-open popup disabled by request.
});

