const API_KEY = 'c31c7e6cff641d38a9ffc16dbfb69fae';

async function checkDate() {
    const targetDate = '2025-12-14';
    console.log(`Fetching ALL fixtures for date: ${targetDate}...`);

    try {
        const res = await fetch(`https://v3.football.api-sports.io/fixtures?date=${targetDate}`, {
            headers: {
                'x-apisports-key': API_KEY
            }
        });
        const data = await res.json();

        const count = data.response?.length || 0;
        console.log(`Total fixtures found: ${count}`);

        if (count > 0) {
            // Check if any are from Brazil
            const brazilMatches = data.response.filter(m => m.league.country === 'Brazil');
            console.log(`Matches in Brazil: ${brazilMatches.length}`);
            brazilMatches.forEach(m => {
                console.log(`- ${m.league.name} (ID: ${m.league.id}, Season: ${m.league.season})`);
                console.log(`  ${m.teams.home.name} vs ${m.teams.away.name}`);
            });

            // Specifically look for Copa do Brasil (League 73)
            const copa = data.response.find(m => m.league.id === 73);
            if (copa) {
                console.log('!!! FOUND COPA DO BRASIL MATCH !!!');
            } else {
                console.log('Copa do Brasil (ID 73) NOT found in the list.');
            }
        } else {
            console.log(JSON.stringify(data));
        }

    } catch (e) { console.error(e); }
}

checkDate();
