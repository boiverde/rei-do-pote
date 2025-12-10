import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Client
// We use env vars for connection, ensuring server-side security.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// HARDCODED API KEY FOR IMMEDIATE TESTING
const API_KEY = 'c31c7e6cff641d38a9ffc16dbfb69fae';

export async function POST(request) {
    try {
        // 1. Fetch from multiple leagues
        // League 71: Brasileirão Série A
        // League 1168: FIFA Intercontinental Cup (Mundial)
        // League 15: FIFA Club World Cup (Legacy/Future)
        const leaguesToFetch = [71, 1168, 15];

        const fetchPromises = leaguesToFetch.map(id =>
            fetch(`https://v3.football.api-sports.io/fixtures?league=${id}&next=5`, {
                headers: {
                    'x-rapidapi-host': 'v3.football.api-sports.io',
                    'x-rapidapi-key': API_KEY
                }
            }).then(r => r.json())
        );

        const results = await Promise.all(fetchPromises);

        let allMatches = [];
        results.forEach(data => {
            if (data.response && data.response.length > 0) {
                allMatches = [...allMatches, ...data.response];
            }
        });

        if (allMatches.length === 0) {
            return NextResponse.json({ success: false, message: 'Nenhum jogo oficial encontrado nas ligas monitoradas.' }, { status: 404 });
        }

        const supabase = createClient(supabaseUrl, supabaseAnonKey);

        // 2. Transform Data
        const marketsToCreate = allMatches.map(match => {
            const homeTeam = match.teams.home.name;
            const awayTeam = match.teams.away.name;

            // Normalize League Name
            let leagueName = match.league.name;
            if (match.league.id === 71) leagueName = 'Brasileirão Série A';
            if (leagueName.includes('Intercontinental') || leagueName.includes('World Cup')) leagueName = 'Mundial de Clubes';

            return {
                home_team: homeTeam,
                away_team: awayTeam,
                description: `${homeTeam} vs ${awayTeam} - ${match.league.round || 'Final'}`,
                league: leagueName,
                event_date: match.fixture.date,
                status: 'active',
                home_price: 0.50,
                away_price: 0.50,
                volume: 0
            };
        });

        // 3. Insert into Supabase
        const { error } = await supabase
            .from('markets')
            .insert(marketsToCreate);

        if (error) throw error;

        return NextResponse.json({
            success: true,
            message: `${marketsToCreate.length} jogos sincronizados!`,
            games: marketsToCreate.map(m => `${m.home_team} x ${m.away_team} (${m.league})`)
        });

    } catch (error) {
        console.error('Sync Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
