const API_KEY = 'c31c7e6cff641d38a9ffc16dbfb69fae';

async function investigate() {
    // 1. Search for Team Corinthians
    console.log('--- 1. Searching for Team: Corinthians ---');
    let teamId = null;
    try {
        const res = await fetch(`https://v3.football.api-sports.io/teams?name=Corinthians`, {
            headers: { 'x-rapidapi-key': API_KEY, 'x-rapidapi-host': 'v3.football.api-sports.io' }
        });
        const data = await res.json();
        // find the brazillian one
        const corinthians = data.response?.find(t => t.team.country === 'Brazil');
        if (corinthians) {
            teamId = corinthians.team.id;
            console.log(`Found Corinthians: ID ${teamId}, Country: ${corinthians.team.country}`);
        } else {
            console.log('Corinthians (Brazil) not found in search.');
            // Fallback known ID if search fails? Corinthians ID is usually 131.
            teamId = 131;
        }
    } catch (e) { console.error(e); }

    if (!teamId) return;

    // 2. Search matches for this team in 2024
    console.log(`\n--- 2. Fetching matches for Team ${teamId} in 2024 ---`);
    try {
        const res = await fetch(`https://v3.football.api-sports.io/fixtures?team=${teamId}&season=2024`, {
            headers: { 'x-rapidapi-key': API_KEY, 'x-rapidapi-host': 'v3.football.api-sports.io' }
        });
        const data = await res.json();
        const matches = data.response || [];
        console.log(`Total matches found: ${matches.length}`);

        // Filter for December
        const recent = matches.filter(m => m.fixture.date.includes('2025-12'));
        console.log(`Matches in Dec 2025: ${recent.length}`);

        recent.forEach(m => {
            console.log(`\n[${m.fixture.date}] ${m.teams.home.name} x ${m.teams.away.name}`);
            console.log(`   League: ${m.league.name} (ID: ${m.league.id})`);
            console.log(`   Round: ${m.league.round}`);
        });

    } catch (e) { console.error(e); }
}

investigate();
