import { NextResponse } from 'next/server';

export async function GET(request) {
    try {
        const daysToFetch = 5;
        const today = new Date();
        const fetchPromises = [];

        const formatDate = (date) => date.toISOString().split('T')[0];

        // Fetch global fixtures for next 5 days
        for (let i = 0; i < daysToFetch; i++) {
            const d = new Date(today);
            d.setDate(today.getDate() + i);
            const dateStr = formatDate(d);

            fetchPromises.push(
                fetch(`https://v3.football.api-sports.io/fixtures?date=${dateStr}`, {
                    headers: {
                        'x-rapidapi-host': 'v3.football.api-sports.io',
                        'x-apisports-key': process.env.API_FOOTBALL_KEY
                    }
                }).then(r => r.json())
            );
        }

        const results = await Promise.all(fetchPromises);

        let allMatchesSummary = [];

        results.forEach((data, index) => {
            const date = new Date(today);
            date.setDate(today.getDate() + index);
            const dateStr = formatDate(date);

            if (data.response) {
                // Map to a readable summary
                const summaries = data.response.map(m => ({
                    date: dateStr,
                    league: m.league.name,
                    league_id: m.league.id, // CRITICAL: We need this ID
                    home: m.teams.home.name,
                    away: m.teams.away.name,
                    status: m.fixture.status.short
                }));

                // Filter specifically for Brazil or Big Teams to avoid 1000s of results
                // showing everything, but maybe filter lightly to things that look like "Copa" or "Brasil"
                const relevant = summaries.filter(s =>
                    s.league.includes('Brasil') ||
                    s.league.includes('Copa') ||
                    s.home.includes('Vasco') ||
                    s.home.includes('Corinthians')
                );

                allMatchesSummary = [...allMatchesSummary, ...relevant];
            }
        });

        return NextResponse.json({
            count: allMatchesSummary.length,
            matches: allMatchesSummary
        });

    } catch (error) {
        return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
    }
}
