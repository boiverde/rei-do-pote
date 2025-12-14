import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { calculateOdds } from '../../lib/team-ratings';

// Initialize Supabase Client
// We use env vars for connection, ensuring server-side security.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Use Service Role Key for Admin operations (bypasses RLS), fallback to Anon Key (read-only usually)
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// HARDCODED API KEY FOR IMMEDIATE TESTING
// const API_KEY = process.env.API_FOOTBALL_KEY; // Using direct process.env usage below

export async function POST(request) {
    try {
        // 1. Fetch from multiple leagues
        // Target Leagues
        const targetLeagueIds = [71, 73, 1168, 15];

        // Fetch methodology for Free Plan:
        // querying by 'season=2025' is blocked on free plan for future seasons.
        // querying by 'next=5' is blocked.
        // querying by 'date=YYYY-MM-DD' WORKS.
        // So we fetch the next 5 days of GLOBAL fixtures and filter locally.

        const daysToFetch = 5;
        const today = new Date();
        const fetchPromises = [];

        const formatDate = (date) => date.toISOString().split('T')[0];

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

        let allMatches = [];
        results.forEach(data => {
            if (data.response && data.response.length > 0) {
                // Filter locally for our leagues
                const relevant = data.response.filter(m => targetLeagueIds.includes(m.league.id));
                allMatches = [...allMatches, ...relevant];
            }
        });

        if (allMatches.length === 0) {
            return NextResponse.json({ success: false, message: 'Nenhum jogo oficial encontrado nas ligas monitoradas (próximos 5 dias).' }, { status: 404 });
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        // 2a. Fetch existing markets to preserve 'volume' and 'history'
        // We only need ID and Volume for the ones we are about to update.
        const { data: existingMarkets } = await supabase
            .from('markets')
            .select('id, volume, history');

        const volumeMap = {};
        const historyMap = {};
        if (existingMarkets) {
            existingMarkets.forEach(m => {
                volumeMap[m.id] = m.volume;
                historyMap[m.id] = m.history;
            });
        }

        // 2b. Transform Data
        const marketsToCreate = allMatches.map(match => {
            const homeTeam = match.teams.home.name;
            const awayTeam = match.teams.away.name;

            // Normalize League Name
            let leagueName = match.league.name;
            if (match.league.id === 71) leagueName = 'Brasileirão Série A';
            if (match.league.id === 73) leagueName = 'Copa do Brasil';
            if (leagueName.includes('Intercontinental') || leagueName.includes('World Cup')) leagueName = 'Mundial de Clubes';

            // Helper to slugify (e.g. "Corinthians" -> "cor")
            const slugify = (text) => text.toLowerCase().replace(/[^a-z]/g, '').slice(0, 3);
            const homeSlug = slugify(homeTeam);
            const awaySlug = slugify(awayTeam);
            // League slug
            let leagueSlug = 'gen';
            if (leagueName.includes('Brasileirão')) leagueSlug = 'br';
            if (leagueName.includes('Copa')) leagueSlug = 'cb';
            if (leagueName.includes('Mundial')) leagueSlug = 'wc';

            const year = new Date(match.fixture.date).getFullYear().toString().slice(-2);
            const uniqueId = `${homeSlug}-${awaySlug}-${leagueSlug}${year}`;

            const { homePrice, awayPrice } = calculateOdds(homeTeam, awayTeam);

            // Preserve existing volume/history if exists, else default
            const existingVolume = volumeMap[uniqueId] || 0;
            const existingHistory = historyMap[uniqueId] || '[]'; // jsonb default

            return {
                id: uniqueId,
                home_team: homeTeam,
                away_team: awayTeam,
                home_logo: match.teams.home.logo,
                away_logo: match.teams.away.logo,
                league: leagueName,
                event_date: match.fixture.date,
                status: 'open',
                home_price: homePrice,
                away_price: awayPrice,
                volume: existingVolume,
                history: existingHistory // explicit preserve
            };
        });

        // 3. Insert into Supabase (Upsert with update to apply new logos)
        const { error } = await supabase
            .from('markets')
            .upsert(marketsToCreate, { onConflict: 'id', ignoreDuplicates: false }); // Changed to FALSE to allow updates

        if (error) throw error;

        return NextResponse.json({
            success: true,
            message: `${marketsToCreate.length} jogos sincronizados e atualizados!`,
            games: marketsToCreate.map(m => `${m.home_team} x ${m.away_team} (${m.league})`)
        });

    } catch (error) {
        console.error('Sync Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
