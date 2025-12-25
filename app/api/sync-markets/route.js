import { NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { createClient as createSessionClient } from '../../utils/supabase/server';
import { calculateOdds } from '../../lib/team-ratings';
import { BIG_TEAMS, EURO_GIANTS } from '../../lib/teams';

// Initialize Supabase Client (Admin / Service Role)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
    console.warn('WARNING: SUPABASE_SERVICE_ROLE_KEY is missing. Admin operations will fail.');
}

export async function POST(request) {
    try {
        // 1. Security Check (Cron Secret OR Admin Session)
        const authHeader = request.headers.get('authorization');
        const isCron = authHeader === `Bearer ${process.env.CRON_SECRET}`;
        let isAdmin = false;

        if (!isCron) {
            const sessionClient = await createSessionClient();
            const { data: { user } } = await sessionClient.auth.getUser();
            if (user) {
                const { data: profile } = await sessionClient
                    .from('profiles')
                    .select('is_admin')
                    .eq('id', user.id)
                    .single();
                isAdmin = profile?.is_admin;
            }
        }

        if (!isCron && !isAdmin) {
            return NextResponse.json({ error: 'Unauthorized Access' }, { status: 401 });
        }

        // 2. Fetch from multiple leagues
        // Target Leagues
        // 71: Brasileirão A, 73: Copa do Brasil, 13: Libertadores, 11: Sul-Americana
        // 39: Premier League, 140: La Liga, 2: Champions League, 15: Mundial (Check ID)
        const targetLeagueIds = [71, 73, 13, 11, 39, 140, 2, 1168, 15];

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

        // League Categories
        const LEAGUES_BR = [71, 73]; // Brasileirão, Copa Brasil -> KEEP ALL
        const LEAGUES_INTL_SA = [13, 11, 15]; // Liberta, Sula, Mundial -> KEEP IF BR TEAM INVOLVED
        const LEAGUES_EURO = [39, 140, 2]; // Premier, La Liga, Champions -> KEEP IF CLASSIC (BOTH GIANTS)

        // Helper to match partial names strategies
        const isBigTeam = (teamName) => {
            if (!teamName) return false;
            // Direct Match
            if (BIG_TEAMS.includes(teamName)) return true;
            // Partial Match (e.g. API "Vasco" vs List "Vasco da Gama")
            return BIG_TEAMS.some(t =>
                teamName.includes(t) || t.includes(teamName) ||
                teamName.toLowerCase().includes(t.toLowerCase()) ||
                t.toLowerCase().includes(teamName.toLowerCase())
            );
        };

        const isEuroGiant = (teamName) => {
            if (!teamName) return false;
            return EURO_GIANTS.includes(teamName) || EURO_GIANTS.some(t => teamName.includes(t) || t.includes(teamName));
        };

        // Filter Logic:
        const filteredMatches = allMatches.filter(match => {
            const leagueId = match.league.id;

            // 1. National (BR) - Always keep
            if (LEAGUES_BR.includes(leagueId)) return true;

            // 2. Intl South America (Liberta/Sula/Mundial) - Keep if BR team involved
            if (LEAGUES_INTL_SA.includes(leagueId)) {
                return isBigTeam(match.teams.home.name) || isBigTeam(match.teams.away.name);
            }

            // 3. Europe (Premier, La Liga) - Keep IF Classic (BOTH must be Giants)
            if ([39, 140].includes(leagueId)) {
                return isEuroGiant(match.teams.home.name) && isEuroGiant(match.teams.away.name);
            }

            // 4. Champions League (ID 2) - KEEP ALL (It's elite by definition)
            if (leagueId === 2) return true;

            // 5. Regionals/State/Others (Fallback) - Keep if BR Big Team involved
            // If it's the Copa Final but under a weird ID, this will catch it if teams are matched correctly.
            const homeBig = isBigTeam(match.teams.home.name);
            const awayBig = isBigTeam(match.teams.away.name);
            return homeBig || awayBig;
        });

        // Initialize Supabase Client (Restored)
        // Initialize Supabase Client (Restored)
        const supabase = createAdminClient(supabaseUrl, supabaseKey);

        // Fetch existing markets to preserve 'volume' and 'history'
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

        // Use filteredMatches for processing
        const marketsToCreate = filteredMatches.map(match => {
            const homeTeam = match.teams.home.name;
            const awayTeam = match.teams.away.name;

            // Normalize League Name
            let leagueName = match.league.name;
            if (match.league.id === 71) leagueName = 'Brasileirão Série A';
            if (match.league.id === 73) leagueName = 'Copa do Brasil';
            if (match.league.id === 13) leagueName = 'Libertadores';
            if (match.league.id === 11) leagueName = 'Sul-Americana';
            if (match.league.id === 39) leagueName = 'Premier League';
            if (match.league.id === 140) leagueName = 'La Liga';
            if (match.league.id === 2) leagueName = 'Champions League';
            if (leagueName.includes('Intercontinental') || leagueName.includes('World Cup')) leagueName = 'Mundial de Clubes';

            // Map known State Leagues or ANY other league to 'Clássicos Estaduais' if it passed the Big Team filter but isn't a target ID
            if (!targetLeagueIds.includes(match.league.id)) {
                leagueName = 'Clássicos Estaduais';
            }

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
                history: existingHistory, // explicit preserve
                fixture_id: match.fixture.id // Store API ID for robust resolution
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
