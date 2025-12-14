const API_KEY = 'c31c7e6cff641d38a9ffc16dbfb69fae';

async function checkHeaders() {
    console.log('Testing with x-apisports-key header...');

    // Test Status again with new header
    try {
        const res = await fetch(`https://v3.football.api-sports.io/status`, {
            headers: {
                'x-apisports-key': API_KEY
            }
        });
        const data = await res.json();
        console.log('Status Response (x-apisports-key):', data.response ? 'OK' : JSON.stringify(data));
    } catch (e) { console.error(e); }

    // Test specific fixture search with new header (Premier League 2023, just to see if we get anything)
    // Using date range to avoid 'last/next' issues
    try {
        // Premier League 2023/2024 usually runs Aug to May.
        // Let's pick a random date: 2024-02-10
        const url = `https://v3.football.api-sports.io/fixtures?league=39&season=2023&date=2024-02-10`;
        console.log(`Fetching: ${url}`);
        const res = await fetch(url, {
            headers: {
                'x-apisports-key': API_KEY
            }
        });
        const data = await res.json();
        console.log(`Results with x-apisports-key: ${data.response?.length || 0}`);
        if (data.errors) console.log(data.errors);
    } catch (e) { console.error(e); }
}

checkHeaders();
