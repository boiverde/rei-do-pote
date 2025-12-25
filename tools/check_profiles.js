
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually parse env file
const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envConfig = {};
envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
        let key = match[1].trim();
        let value = match[2].trim().replace(/^['"](.*)['"]$/, '$1'); // removing quotes
        envConfig[key] = value;
    }
});

const supabaseUrl = envConfig.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY;
// Or SERVICE_ROLE if we can find it
const supabaseServiceKey = envConfig.SUPABASE_SERVICE_ROLE_KEY;

const keyToUse = supabaseServiceKey || supabaseKey;

console.log('Using URL:', supabaseUrl);
// console.log('Using Key:', keyToUse ? '***' : 'Missing');

const supabase = createClient(supabaseUrl, keyToUse);

async function checkProfiles() {
    console.log('Fetching profiles...');
    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, username, full_name, cpf, balance');

    if (error) {
        console.error('Error fetching profiles:', error);
        return;
    }

    console.log(`Found ${profiles.length} profiles:`);
    profiles.forEach(p => {
        // Obfuscate CPF slightly for privacy in logs if needed, but here we need to see if it's empty
        console.log(`User: ${p.username} (${p.full_name}) | CPF: '${p.cpf}' | Balance: ${p.balance}`);
    });
}

checkProfiles();
