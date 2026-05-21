// Page utilities for navigation, ticker, ads, weather, and responsive layout.

// Highlight the current navigation link in the main menu.
(function markActiveNav() {
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.main-nav a').forEach(a => {
    if (a.getAttribute('href') === currentPage) {
      a.classList.add('active');
    }
  });
})();

// Duplicate ticker content so the breaking news ticker scrolls continuously.
(function setupTicker() {
  const track = document.querySelector('.ticker-track');
  if (!track) return;
  const originalContent = track.innerHTML;
  if (!originalContent.trim()) return;
  // Duplicate the content for seamless infinite scroll
  track.innerHTML = originalContent + originalContent;
})();

// Display a temporary toast notification to the user.
function showToast(msg, type = 'success') {
  let toast = document.getElementById('global-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'global-toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.className = 'toast ' + type;
  void toast.offsetWidth;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3500);
}

// Facebook page URL used for sharing and follow actions.
const SUNAM_FB_PAGE = 'https://share.google/nPIYW8Nnlcsq6pZNR';

function openFbPage() {
  window.open(SUNAM_FB_PAGE, '_blank');
}

// Each news card's "ਪੜ੍ਹੋ →" button should call openNewsLink(url)
function openNewsLink(url) {
  window.open(url || SUNAM_FB_PAGE, '_blank');
}

// Toggle the mobile menu when the hamburger button is clicked.
document.addEventListener('DOMContentLoaded', function () {
  // Toggle visibility of the mobile navigation menu.
  const hamburger = document.getElementById('hamburger-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      mobileMenu.classList.toggle('open');
    });
  }

  // Follow button
  const followBtn = document.querySelector('.btn-follow');
  if (followBtn) {
    followBtn.addEventListener('click', () => {
      window.open(SUNAM_FB_PAGE, '_blank');
    });
  }
});

// Weather code labels used by the backend weather widget endpoint.
const WEATHER_CODE_LABELS = {
  0: ['☀️', 'Clear sky'],
  1: ['🌤️', 'Mainly clear'],
  2: ['⛅', 'Partly cloudy'],
  3: ['☁️', 'Cloudy'],
  45: ['🌫️', 'Fog'],
  48: ['🌫️', 'Fog'],
  51: ['🌦️', 'Light drizzle'],
  53: ['🌦️', 'Drizzle'],
  55: ['🌧️', 'Heavy drizzle'],
  61: ['🌧️', 'Light rain'],
  63: ['🌧️', 'Rain'],
  65: ['🌧️', 'Heavy rain'],
  80: ['🌦️', 'Rain showers'],
  81: ['🌧️', 'Rain showers'],
  82: ['⛈️', 'Heavy showers'],
  95: ['⛈️', 'Thunderstorm']
};

// Unified State for Mobile Ticker
const mobileTickerState = {
  weather: null,
  markets: [],
  ads: [],
  dataIndex: 0,
  adIndex: 0,
  dataIntervalId: null,
  adIntervalId: null
};

function renderWeatherWidget(widget, weather) {
  const codeInfo = WEATHER_CODE_LABELS[weather.code] || ['🌡️', weather.description || 'Current weather'];
  
  // Update mobile state
  mobileTickerState.weather = '<div class="ticker-slide">📍 <b>Sunam</b> <span>' + Math.round(weather.temperature) + '°C</span> ' + codeInfo[0] + ' ' + codeInfo[1] + '</div>';

  widget.innerHTML = '<div class="weather-top">' +
    '<div><div class="weather-location">' + (weather.location || 'Sunam, Punjab') + '</div>' +
    '<div class="weather-temp">' + Math.round(weather.temperature) + '°</div></div>' +
    '<div class="weather-icon">' + codeInfo[0] + '</div>' +
    '</div>' +
    '<div class="weather-desc">' + codeInfo[1] + '</div>' +
    '<div class="weather-stats">' +
    '<div class="weather-stat"><strong>Humidity</strong><span>' + Math.round(weather.humidity) + '%</span></div>' +
    '<div class="weather-stat"><strong>Wind</strong><span>' + Math.round(weather.wind) + ' km/h</span></div>' +
    '</div>';

  // Try to start ticker if data arrived
  startMobileTicker();
}

function showWeatherFallback(widget) {
  widget.querySelector('.weather-desc').textContent = 'Weather unavailable';
}

async function loadWeatherWidgets() {
  const widgets = document.querySelectorAll('[data-weather-widget]');
  if (!widgets.length) return;
  try {
    const res = await fetch('/api/weather');
    if (!res.ok) throw new Error('Weather request failed');
    const weather = await res.json();
    widgets.forEach(widget => renderWeatherWidget(widget, weather));
  } catch (err) {
    widgets.forEach(showWeatherFallback);
  }
}
document.addEventListener('DOMContentLoaded', loadWeatherWidgets);


// Adjust widget placement for mobile and desktop layouts.
function ensureMobileSlot(className, afterElement) {
  let slot = document.querySelector('.' + className);
  if (!slot && afterElement) {
    slot = document.createElement('div');
    slot.className = className;
    afterElement.insertAdjacentElement('afterend', slot);
  }
  return slot;
}

function placeMobileSidebarSlots() {
  const leftSidebar = document.querySelector('.sidebar-left');
  const rightSidebar = document.querySelector('.sidebar-right');
  const breakingBar = document.querySelector('.breaking-bar');
  const weather = document.querySelector('[data-weather-widget]');
  const market = document.querySelector('[data-market-widget]');
  if (!leftSidebar || !breakingBar) return;

  const infoSlot = ensureMobileSlot('mobile-info-slot', breakingBar);
  if (infoSlot && infoSlot.parentElement !== breakingBar.parentElement) {
    breakingBar.parentElement.insertBefore(infoSlot, breakingBar.nextSibling);
  }

  // Ensure ticker and ad containers exist in mobile info slot
  if (infoSlot && !infoSlot.querySelector('.mobile-data-ticker')) {
    const dataTicker = document.createElement('div');
    dataTicker.className = 'mobile-data-ticker';
    dataTicker.innerHTML = '<div class="ticker-container"></div>';
    infoSlot.appendChild(dataTicker);

    const adRotator = document.createElement('div');
    adRotator.className = 'mobile-ad-rotator';
    adRotator.innerHTML = '<div class="ad-container"></div>';
    infoSlot.appendChild(adRotator);
  }

  // Ticker and Ad data should be fetched and started on all screen sizes
  fetchAds().then(ads => {
    // Clear previous ads in state
    mobileTickerState.ads = [];

    if (ads.ad1 && ads.ad1.img) {
      mobileTickerState.ads.push('<div class="ad-slide"><img class="ad-mini" src="' + ads.ad1.img + '" /> <div class="ad-info-wrap"><span class="ad-tag">Ad</span> <span>' + (ads.ad1.title || 'Advertisement') + '</span></div></div>');
    }
    if (ads.ad2 && ads.ad2.img) {
      mobileTickerState.ads.push('<div class="ad-slide"><img class="ad-mini" src="' + ads.ad2.img + '" /> <div class="ad-info-wrap"><span class="ad-tag">Ad</span> <span>' + (ads.ad2.title || 'Advertisement') + '</span></div></div>');
    }
    
    startMobileTicker();
  }).catch(() => {});

  if (window.matchMedia('(max-width: 1280px)').matches) {
    if (market && market.parentElement !== infoSlot) infoSlot.appendChild(market);
    if (weather && weather.parentElement !== infoSlot) infoSlot.appendChild(weather);
  } else {
    if (market && market.parentElement !== leftSidebar) {
      const trendingWidget = leftSidebar.querySelector('.sidebar-trending-widget');
      leftSidebar.insertBefore(market, trendingWidget || leftSidebar.firstChild);
    }
    if (weather && rightSidebar && weather.parentElement !== rightSidebar) {
      rightSidebar.insertAdjacentElement('afterbegin', weather);
    }
  }
}
window.addEventListener('DOMContentLoaded', placeMobileSidebarSlots);
window.addEventListener('resize', placeMobileSidebarSlots);


// Create and render the market widget with financial summaries.
function ensureMarketWidget() {
  const leftSidebar = document.querySelector('.sidebar-left');
  if (!leftSidebar || document.querySelector('[data-market-widget]')) return;
  const widget = document.createElement('div');
  widget.className = 'widget market-widget';
  widget.setAttribute('data-market-widget', '');
  widget.innerHTML = '<div class="market-header"><span>📈 MARKET LIVE</span><small>Delayed</small></div>' +
    '<div class="market-list"><div class="market-loading">Loading NIFTY / SENSEX...</div></div>';
  const trending = leftSidebar.querySelector('.sidebar-trending-widget');
  leftSidebar.insertBefore(widget, trending || leftSidebar.firstChild);
}

function formatMarketValue(value) {
  if (!Number.isFinite(value) || value <= 0) return '--';
  return value.toLocaleString('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 2 });
}

function renderMarketWidgets(data) {
  const items = data && Array.isArray(data.items) ? data.items : [];
  
  // Update mobile state
  mobileTickerState.markets = items.map(item => {
    const up = Number(item.change) >= 0;
    return '<div class="ticker-slide">' + (up ? '📈' : '📉') + ' <b>' + item.label + '</b> ' +
           '<span>' + formatMarketValue(Number(item.price)) + '</span> ' +
           '<em class="' + (up ? 'up' : 'down') + '">' + (up ? '+' : '') + Number(item.changePercent || 0).toFixed(2) + '%</em></div>';
  });

  document.querySelectorAll('[data-market-widget]').forEach(widget => {
    const list = widget.querySelector('.market-list');
    if (!list || !items.length) {
      list.innerHTML = '<div class="market-loading">Market data unavailable</div>';
      return;
    }
    list.innerHTML = items.map(item => {
      const up = Number(item.change) >= 0;
      return '<div class="market-row">' +
        '<div><strong>' + item.label + '</strong><span>' + (data.delayed ? 'Delayed quote' : 'Live quote') + '</span></div>' +
        '<div class="market-values"><b>' + formatMarketValue(Number(item.price)) + '</b>' +
        '<em class="' + (up ? 'up' : 'down') + '">' + (up ? '+' : '') + Number(item.change || 0).toFixed(2) + ' (' + (up ? '+' : '') + Number(item.changePercent || 0).toFixed(2) + '%)</em></div>' +
        '</div>';
    }).join('');
  });

  // Start rotation
  startMobileTicker();
}

function startMobileTicker() {
  const dataContainer = document.querySelector('.ticker-container');
  const adContainer = document.querySelector('.ad-container');

  // DATA TICKER (Weather + Market) - 2 Seconds
  if (dataContainer && !mobileTickerState.dataIntervalId) {
    function updateData() {
      const pool = [];
      if (mobileTickerState.weather) pool.push(mobileTickerState.weather);
      if (mobileTickerState.markets.length) pool.push(...mobileTickerState.markets);
      if (!pool.length) return;
      mobileTickerState.dataIndex = (mobileTickerState.dataIndex + 1) % pool.length;
      dataContainer.innerHTML = pool[mobileTickerState.dataIndex];
    }
    // Initial display
    const pool = [];
    if (mobileTickerState.weather) pool.push(mobileTickerState.weather);
    if (mobileTickerState.markets.length) pool.push(...mobileTickerState.markets);
    if (pool.length) dataContainer.innerHTML = pool[0];
    
    mobileTickerState.dataIntervalId = setInterval(updateData, 2000);
  }

  // AD ROTATOR - 5 Seconds
  if (adContainer && !mobileTickerState.adIntervalId) {
    function updateAds() {
      const pool = mobileTickerState.ads;
      if (!pool.length) return;

      const isWide = window.innerWidth >= 600;
      let html = '';

      if (isWide && pool.length >= 2) {
        // Show 2 ads side by side
        const idx2 = (mobileTickerState.adIndex + 1) % pool.length;
        html = '<div class="ad-slide-wrapper">' + pool[mobileTickerState.adIndex] + pool[idx2] + '</div>';
        mobileTickerState.adIndex = (mobileTickerState.adIndex + 2) % pool.length;
      } else {
        // Show 1 ad centered
        html = '<div class="ad-slide-wrapper">' + pool[mobileTickerState.adIndex] + '</div>';
        mobileTickerState.adIndex = (mobileTickerState.adIndex + 1) % pool.length;
      }
      
      adContainer.innerHTML = html;
    }

    // Initial display
    updateAds();
    
    mobileTickerState.adIntervalId = setInterval(updateAds, 5000);
  }
}

async function loadMarketWidgets() {
  ensureMarketWidget();
  placeMobileSidebarSlots();
  const widgets = document.querySelectorAll('[data-market-widget]');
  if (!widgets.length) return;
  try {
    const res = await fetch('/api/markets');
    if (!res.ok) throw new Error('Market request failed');
    const data = await res.json();
    renderMarketWidgets(data);
  } catch (err) {
    widgets.forEach(widget => {
      const list = widget.querySelector('.market-list');
      if (list) list.innerHTML = '<div class="market-loading">Market data unavailable</div>';
    });
  }
}
document.addEventListener('DOMContentLoaded', loadMarketWidgets);

