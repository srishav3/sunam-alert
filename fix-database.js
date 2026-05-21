// Fix outdated news records by ensuring they include the 'home' page tag.
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

async function fixData() {
  try {
    const envContent = fs.readFileSync('.env', 'utf8');
    const env = {};
    envContent.split(/\r?\n/).forEach(line => {
      const i = line.indexOf('=');
      if (i !== -1) env[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^['"]|['"]$/g, '');
    });

    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_KEY);

    console.log('Fixing News Item #7 (Adding "home" page)...');
    // Find items without 'home' and add it
    const { data: news } = await supabase.from('news').select('id, title, page');
    if (news) {
        for (const n of news) {
            const pages = Array.isArray(n.page) ? n.page : [];
            if (!pages.includes('home')) {
                console.log(`Updating item: ${n.title}`);
                const newPages = [...pages, 'home'];
                await supabase.from('news').update({ page: newPages }).eq('id', n.id);
            }
        }
    }
    console.log('Done.');

  } catch (err) {
    console.error('FIX_FAILED:', err.message);
  }
}

fixData();

