// Run a Supabase audit to verify the main tables and row counts.
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

async function checkDatabase() {
  try {
    const envContent = fs.readFileSync('.env', 'utf8');
    const env = {};
    envContent.split(/\r?\n/).forEach(line => {
      const i = line.indexOf('=');
      if (i !== -1) {
        env[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^['"]|['"]$/g, '');
      }
    });

    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_KEY);

    console.log('--- Database Audit ---');
    
    const { data: tickers, error: tErr } = await supabase.from('ticker_items').select('*');
    console.log('Ticker Items:', tErr ? 'ERROR: ' + tErr.message : (tickers ? tickers.length : 0));

    const { data: ads, error: aErr } = await supabase.from('site_ads').select('*');
    console.log('Site Ads:', aErr ? 'ERROR: ' + aErr.message : (ads ? ads.length : 0));

    const { data: contacts, error: cErr } = await supabase.from('contact_messages').select('*');
    console.log('Contact Messages:', cErr ? 'ERROR: ' + cErr.message : (contacts ? contacts.length : 0));

    const { data: news, error: nErr } = await supabase.from('news').select('*').order('date', { ascending: false });
    console.log('Total News:', nErr ? 'ERROR: ' + nErr.message : (news ? news.length : 0));
    if (news) {
        news.forEach((n, i) => {
            console.log(`${i+1}. Title: ${n.title} | Status: ${n.status} | Breaking: ${n.breaking} | Pages: ${JSON.stringify(n.page)}`);
        });
    }

  } catch (err) {
    console.error('AUDIT_FAILED:', err.message);
  }
}

checkDatabase();

