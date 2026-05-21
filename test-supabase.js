// Test that the Supabase connection works and the news table schema is correct.
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

async function test() {
    try {
        if (!fs.existsSync('.env')) {
            console.log('ERROR: .env file not found');
            return;
        }
        const content = fs.readFileSync('.env', 'utf8');
        const env = {};
        content.split(/\r?\n/).forEach(line => {
            const i = line.indexOf('=');
            if (i !== -1) {
                const key = line.slice(0, i).trim();
                const value = line.slice(i + 1).trim().replace(/^['"]|['"]$/g, '');
                env[key] = value;
            }
        });

        if (!env.SUPABASE_URL || !env.SUPABASE_KEY) {
            console.log('ERROR: SUPABASE_URL or SUPABASE_KEY missing in .env');
            return;
        }

        console.log('Testing connection to:', env.SUPABASE_URL);
        const client = createClient(env.SUPABASE_URL, env.SUPABASE_KEY);
        
        const { data, error } = await client.from('news').select('id,title,fbLink').limit(1);
        
        if (error) {
            console.log('SUPABASE_ERROR: ' + error.message);
            if (error.message.includes('column') || error.message.includes('schema')) {
                console.log('ADVICE: It seems your table schema is incorrect or columns are missing.');
            }
        } else {
            console.log('SUCCESS: Connected to Supabase and "news" table found with "fbLink" column.');
        }
    } catch (err) {
        console.log('CRITICAL_ERROR: ' + err.message);
    }
}

test();

