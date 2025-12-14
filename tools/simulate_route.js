const API_KEY = 'c31c7e6cff641d38a9ffc16dbfb69fae';

async function simulateRoute() {
    const leaguesToFetch = [71, 73, 1168, 15];
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);

    const formatDate = (date) => date.toISOString().split('T')[0];
    const fromDate = formatDate(today);
    const toDate = formatDate(nextWeek);
    const currentYear = today.getFullYear();

    console.log(`Params: season=${currentYear}, from=${fromDate}, to=${toDate}`);
    console.log(`Leagues: ${leaguesToFetch.join(', ')}`);

    for (const id of leaguesToFetch) {
        const url = `https://v3.football.api-sports.io/fixtures?league=${id}&season=${currentYear}&from=${fromDate}&to=${toDate}`;
        console.log(`\nFetching: ${url}`);
        try {
            const res = await fetch(url, {
                headers: {
                    'x-rapidapi-host': 'v3.football.api-sports.io',
                    'x-apisports-key': API_KEY
                }
            });
            const data = await res.json();
            if (data.errors && Object.keys(data.errors).length > 0) {
                console.log('ERROR:', JSON.stringify(data.errors));
            } else {
                console.log(`Success! Matches found: ${data.response?.length || 0}`);
                if (data.response && data.response.length > 0) {
                    data.response.forEach(m => console.log(` - ${m.fixture.date}: ${m.teams.home.name} vs ${m.teams.away.name}`));
                }
            }
        } catch (e) {
            console.error('Fetch Failed:', e);
        }
    }
}

simulateRoute();
