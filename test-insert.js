// Run sample inserts to validate Supabase write permissions for news and ticker tables.
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

async function testInsert() {
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

    console.log('Testing Ticker Insert...');
    const { data: tData, error: tErr } = await supabase.from('ticker_items').insert([{ text: 'ਸੁਨਾਮ ਅਲਰਟ ਟੈਸਟ ਟਿੱਕਰ' }]).select();
    if (tErr) console.error('Ticker Insert Error:', tErr.message);
    else console.log('Ticker Insert Success:', tData);

    console.log('Testing News Insert...');
    const { data: nData, error: nErr } = await supabase.from('news').insert([{ 
        title: 'ਟੈਸਟ ਖ਼ਬਰ', 
        status: 'published',
        category: 'ਮੁੱਖ ਖ਼ਬਰ',
        author: 'Test System'
    }]).select();
    if (nErr) console.error('News Insert Error:', nErr.message);
    else console.log('News Insert Success:', nData);

  } catch (err) {
    console.error('TEST_FAILED:', err.message);
  }
}

testInsert();

