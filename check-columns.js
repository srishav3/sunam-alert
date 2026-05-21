// Inspect the Supabase news table and print the returned column keys.
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

async function checkColumns() {
    try {
        const content = fs.readFileSync('.env', 'utf8');
        const env = {};
        content.split(/\r?\n/).forEach(line => {
            const i = line.indexOf('=');
            if (i !== -1) {
                env[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^['"]|['"]$/g, '');
            }
        });

        const client = createClient(env.SUPABASE_URL, env.SUPABASE_KEY);
        
        // This query will fail if column doesn't exist, but we can try to select * and see what we get
        console.log('Fetching one row to check columns...');
        const { data, error } = await client.from('news').select('*').limit(1);
        
        if (error) {
            console.log('Error fetching:', error.message);
            // Try to get table info via RPC or just a generic error check
            if (error.message.includes('fbLink')) {
                console.log('CONFIRMED: Column "fbLink" is missing.');
            }
        } else if (data && data.length >= 0) {
            console.log('Columns found in database:');
            const sample = data[0] || {};
            // If table is empty, we might not see columns this way.
            // Let's try to insert a dummy row with just title to see what columns exist
            console.log('Row data keys:', Object.keys(sample));
        }

        // Another way: try to select a known column and see if it works
        const { error: err2 } = await client.from('news').select('fblink').limit(1);
        if (!err2) {
            console.log('NOTE: Found "fblink" (all lowercase). Your database is case-sensitive!');
        }

    } catch (err) {
        console.log('CRITICAL_ERROR: ' + err.message);
    }
}

checkColumns();

