import { NextResponse } from 'next/server';

export async function GET(request) {
    try {
        // Fetch ONLY Sunday 21st (Target Date) to avoid rate limits and noise
        const targetDate = '2025-12-21';

        const response = await fetch(`https://v3.football.api-sports.io/fixtures?date=${targetDate}`, {
            headers: {
                'x-rapidapi-host': 'v3.football.api-sports.io',
                'x-apisports-key': process.env.API_FOOTBALL_KEY
            }
        });

        const data = await response.json();
        const fixtures = data.response || [];

        // 1. List of ALL Leagues active on this day (Unique)
        const leagues = [...new Set(fixtures.map(f => `${f.league.name} [ID: ${f.league.id}]`))];

        // 2. Search for Specific Teams
        const specificMatches = fixtures.filter(f =>
            f.teams.home.name.includes('Vasco') ||
            f.teams.away.name.includes('Vasco') ||
            f.teams.home.name.includes('Corinthians') ||
            f.teams.away.name.includes('Corinthians') ||
            f.league.name.includes('Brasil') ||
            f.league.name.includes('Copa')
        ).map(f => ({
            fixture_id: f.fixture.id,
            league: `${f.league.name} [${f.league.id}]`,
            home: f.teams.home.name,
            away: f.teams.away.name,
            status: f.fixture.status.short
        }));

        return NextResponse.json({
            target_date: targetDate,
            raw_response: data, // INCLUDE FULL RESPONSE TO CHECK FOR ERRORS
            total_games_found: fixtures.length,
            leagues_found: leagues.slice(0, 50),
            relevant_matches: specificMatches
        });

    } catch (error) {
        return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
    }
}
