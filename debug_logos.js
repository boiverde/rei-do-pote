const { createClient } = require('@supabase/supabase-js');

// Config from project (mocking env vars for script)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMarkets() {
    const { data, error } = await supabase
        .from('markets')
        .select('id, home_team, home_logo, away_team, away_logo')
        .limit(5);

    if (error) console.error(error);
    else console.log(JSON.stringify(data, null, 2));
}

checkMarkets();
