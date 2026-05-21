// Check ticker items and breaking news records in Supabase.
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

async function checkTicker() {
  try {
    const envContent = fs.readFileSync('.env', 'utf8');
    const env = {};
    envContent.split(/\r?\n/).forEach(line => {
      const i = line.indexOf('=');
      if (i !== -1) env[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^['"]|['"]$/g, '');
    });

    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_KEY);

    console.log('--- Ticker Logic Test ---');
    
    const { data: tickerItems } = await supabase.from('ticker_items').select('*');
    console.log('Manual Tickers:', tickerItems ? tickerItems.length : 0);

    const { data: breakingNews } = await supabase.from('news').select('id, title').eq('breaking', true).eq('status', 'published');
    console.log('News Tickers (Breaking=true):', breakingNews ? breakingNews.length : 0);
    if (breakingNews) {
        breakingNews.forEach(n => console.log(' - ' + n.title));
    }

  } catch (err) {
    console.error('TEST_FAILED:', err.message);
  }
}

checkTicker();

