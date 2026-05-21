// Trending news widget loader for the left sidebar.

const TRENDING_FALLBACK = [
  { title: 'ਸੁਨਾਮ ਅਲਰਟ ਨਾਲ ਜੁੜੇ ਰਹੋ।', category: 'SunamNews', fbLink: 'https://share.google/nPIYW8Nnlcsq6pZNR' }
];

async function getTrendingNews() {
  try {
    const res = await fetch('/api/news?trending=true&status=published');
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

async function renderTrendingNews() {
  const el = document.getElementById('trending-list');
  if (!el) return;
  const items = await getTrendingNews();
  const list = items.length ? items : TRENDING_FALLBACK;
  el.innerHTML = list.map((item, index) => {
    const link = item.fbLink || 'https://share.google/nPIYW8Nnlcsq6pZNR';
    return '<a class="trending-item" href="' + link + '" target="_blank" rel="noopener">' +
      '<span class="trending-num">#' + (index + 1) + '</span>' +
      '<div><span class="trending-cat">' + (item.category || 'Trending') + '</span>' +
      '<span class="trending-title">' + item.title + '</span></div></a>';
  }).join('');
}

document.addEventListener('DOMContentLoaded', renderTrendingNews);

