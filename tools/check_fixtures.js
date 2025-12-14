const API_KEY = 'c31c7e6cff641d38a9ffc16dbfb69fae';

async function checkFixtures() {
    const leagueId = 73; // Copa do Brasil
    const season = 2025;

    console.log(`Checking fixtures for League ${leagueId} Season ${season}...`);

    // Try method 1: next=10
    console.log('\n--- Method 1: next=10 ---');
    try {
        const url = `https://v3.football.api-sports.io/fixtures?league=${leagueId}&next=10`;
        console.log(`Fetching: ${url}`);
        const res = await fetch(url, {
            headers: {
                'x-rapidapi-host': 'v3.football.api-sports.io',
                'x-rapidapi-key': API_KEY
            }
        });
        const data = await res.json();
        console.log(`Results found: ${data.response?.length || 0}`);
        if (data.response && data.response.length > 0) {
            data.response.forEach(m => {
                console.log(`[${m.fixture.date}] ${m.teams.home.name} vs ${m.teams.away.name} (Round: ${m.league.round})`);
            });
        } else {
            console.log('No fixtures found with next=10');
            if (data.errors && Object.keys(data.errors).length > 0) console.log('Errors:', data.errors);
        }
    } catch (e) {
        console.error('Error method 1:', e);
    }

    // Try method 2: Explicit date range (tomorrow)
    console.log('\n--- Method 2: Date 2025-12-14 ---');
    try {
        const url = `https://v3.football.api-sports.io/fixtures?league=${leagueId}&season=${season}&date=2025-12-14`;
        console.log(`Fetching: ${url}`);
        const res = await fetch(url, {
            headers: {
                'x-rapidapi-host': 'v3.football.api-sports.io',
                'x-rapidapi-key': API_KEY
            }
        });
        const data = await res.json();
        console.log(`Results found: ${data.response?.length || 0}`);
        if (data.response && data.response.length > 0) {
            data.response.forEach(m => {
                console.log(`[${m.fixture.date}] ${m.teams.home.name} vs ${m.teams.away.name}`);
            });
        }
    } catch (e) {
        console.error('Error method 2:', e);
    }

    // Try method 3: Just listing all fixtures for the season to see if they exist at all
    console.log('\n--- Method 3: All fixtures for 2025 (limited) ---');
    try {
        const url = `https://v3.football.api-sports.io/fixtures?league=${leagueId}&season=${season}`;
        console.log(`Fetching: ${url}`);
        const res = await fetch(url, {
            headers: {
                'x-rapidapi-host': 'v3.football.api-sports.io',
                'x-rapidapi-key': API_KEY
            }
        });
        const data = await res.json();
        console.log(`Total fixtures in season: ${data.response?.length || 0}`);
        // Filter for December matches
        const decMatches = data.response?.filter(m => m.fixture.date.includes('2025-12')) || [];
        console.log(`Matches in December 2025: ${decMatches.length}`);
        decMatches.slice(0, 5).forEach(m => {
            console.log(`[${m.fixture.date}] ${m.teams.home.name} vs ${m.teams.away.name}`);
        });
    } catch (e) {
        console.error('Error method 3:', e);
    }
}

checkFixtures();
