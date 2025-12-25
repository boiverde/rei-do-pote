
const fetch = require('node-fetch');

async function checkSync() {
    try {
        console.log('Fetching debug-sync...');
        const res = await fetch('http://localhost:3001/api/debug-sync');
        const data = await res.json();

        console.log('Target Date:', data.target_date);
        console.log('Total Games Found:', data.total_games_found);

        const targetIds = [71, 73, 13, 11, 39, 140, 2, 1168, 15];

        console.log('\n--- Target Leagues Check ---');
        const fixtures = data.raw_response.response;
        const foundTargetGames = fixtures.filter(f => targetIds.includes(f.league.id));

        if (foundTargetGames.length === 0) {
            console.log('NO GAMES found for target IDs:', targetIds);
        } else {
            console.log(`Found ${foundTargetGames.length} games in target leagues:`);
            foundTargetGames.forEach(g => {
                console.log(`[${g.league.name}] ${g.teams.home.name} x ${g.teams.away.name} (ID: ${g.fixture.id})`);
            });
        }

        console.log('\n--- Relevant Matches (Custom Filter) ---');
        console.log(data.relevant_matches);

    } catch (e) {
        console.error('Error:', e);
    }
}

checkSync();
