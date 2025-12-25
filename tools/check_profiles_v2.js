
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env.local');

try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envConfig = {};

    envContent.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return;

        // Split by first equals sign
        const splitIndex = trimmed.indexOf('=');
        if (splitIndex === -1) return;

        const key = trimmed.substring(0, splitIndex).trim();
        let value = trimmed.substring(splitIndex + 1).trim();

        // Remove quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
        }

        envConfig[key] = value;
    });

    const supabaseUrl = envConfig.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = envConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabaseServiceKey = envConfig.SUPABASE_SERVICE_ROLE_KEY;

    // Prioritize service role, fall back to anon
    const keyToUse = supabaseServiceKey || supabaseKey;

    if (!supabaseUrl || !keyToUse) {
        console.error('Missing Supabase credentials in .env.local');
        console.log('Keys found:', Object.keys(envConfig));
        process.exit(1);
    }

    const supabase = createClient(supabaseUrl, keyToUse);

    async function run() {
        console.log('Connecting to Supabase...');
        const { data: profiles, error } = await supabase
            .from('profiles')
            .select('id, username, full_name, cpf, balance');

        if (error) {
            console.error('Supabase Error:', error);
            return;
        }

        console.log(`Found ${profiles.length} profiles.`);
        profiles.forEach(p => {
            console.log(`User: ${p.username}, CPF: [${p.cpf}], ID: ${p.id}`);
        });
    }

    run();

} catch (err) {
    console.error('Script Error:', err);
}
