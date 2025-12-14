const API_KEY = 'c31c7e6cff641d38a9ffc16dbfb69fae';

async function checkStatus() {
    console.log('Checking Account Status...');
    // Check Status
    try {
        const res = await fetch(`https://v3.football.api-sports.io/status`, {
            headers: { 'x-rapidapi-key': API_KEY, 'x-rapidapi-host': 'v3.football.api-sports.io' }
        });
        const data = await res.json();
        console.log('Status Response:', JSON.stringify(data, null, 2));
    } catch (e) { console.error(e); }

    // Check a simple Premier League match (League 39, Season 2023 or 2024)
    console.log('\nChecking Premier League (ID 39) Season 2023...');
    try {
        const res = await fetch(`https://v3.football.api-sports.io/fixtures?league=39&season=2023&last=5`, {
            headers: { 'x-rapidapi-key': API_KEY, 'x-rapidapi-host': 'v3.football.api-sports.io' }
        });
        const data = await res.json();
        console.log(`Premier League Results: ${data.response?.length || 0}`);
    } catch (e) { console.error(e); }
}

checkStatus();
