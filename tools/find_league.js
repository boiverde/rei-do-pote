const API_KEY = 'c31c7e6cff641d38a9ffc16dbfb69fae';

async function searchLeague(name) {
    console.log(`Searching for league: ${name}...`);
    try {
        const response = await fetch(`https://v3.football.api-sports.io/leagues?name=${encodeURIComponent(name)}`, {
            headers: {
                'x-rapidapi-host': 'v3.football.api-sports.io',
                'x-rapidapi-key': API_KEY
            }
        });
        const data = await response.json();

        if (data.response) {
            data.response.forEach(item => {
                if (item.country.name === 'Brazil') {
                    console.log(`Found: ${item.league.name} (ID: ${item.league.id}) - Type: ${item.league.type}`);
                    console.log(`Seasons: ${item.seasons.map(s => s.year).join(', ')}`);
                }
            });
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

searchLeague('Copa do Brasil');
