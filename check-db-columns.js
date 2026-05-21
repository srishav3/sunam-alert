// Print the column names for the Supabase news table for debugging.
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

async function checkColumns() {
  try {
    const envContent = fs.readFileSync('.env', 'utf8');
    const env = {};
    envContent.split(/\r?\n/).forEach(line => {
      const i = line.indexOf('=');
      if (i !== -1) env[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^['"]|['"]$/g, '');
    });

    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_KEY);

    const { data, error } = await supabase.from('news').select('*').limit(1);
    if (data && data[0]) {
        console.log('Columns in "news" table:', Object.keys(data[0]));
    }
  } catch (err) {
    console.error('ERROR:', err.message);
  }
}

checkColumns();

