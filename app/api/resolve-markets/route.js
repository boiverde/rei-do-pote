import { NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { createClient as createSessionClient } from '../../utils/supabase/server';

// Init Supabase (Admin Context)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function POST(request) {
    console.log("Starting Auto-Resolution...");

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

        const supabase = createAdminClient(supabaseUrl, supabaseKey);

        // 1. Get Open Markets that are "Past Due" (Event Date < Now)
        // We look back 3 days to catch anything missed.
        const now = new Date();
        const pastLimit = new Date();
        pastLimit.setDate(now.getDate() - 3);

        const { data: openMarkets, error: dbError } = await supabase
            .from('markets')
            .select('*')
            .eq('status', 'open')
            .lt('event_date', now.toISOString())
            .gt('event_date', pastLimit.toISOString())
            .limit(50); // Optimization: Process in batches to avoid timeout

        if (dbError) throw dbError;

        if (!openMarkets || openMarkets.length === 0) {
            return NextResponse.json({ success: true, message: 'Nenhum mercado pendente para resolver.' });
        }

        console.log(`Checking ${openMarkets.length} pending markets...`);

        // 2. Fetch Results from Football API (Yesterday & Today)
        // We fetch a range to be safe.
        const formatDate = (d) => d.toISOString().split('T')[0];
        const dateStr = formatDate(now); // Today for testing. In prod, maybe fetch yesterday too.

        // Note: For real robustness, we might need multiple fetches if games span days. 
        // For the MVP, we fetch TODAY's fixtures.
        const apiRes = await fetch(`https://v3.football.api-sports.io/fixtures?date=${dateStr}&status=FT-AET-PEN`, {
            headers: {
                'x-rapidapi-host': 'v3.football.api-sports.io',
                'x-apisports-key': process.env.API_FOOTBALL_KEY
            }
        });

        const apiData = await apiRes.json();

        if (!apiData.response) {
            return NextResponse.json({ success: false, message: 'Falha ao buscar resultados na API externa.' });
        }

        const finishedGames = apiData.response; // Games that are Finished, AET or Penalties
        const logs = [];
        let resolvedCount = 0;

        // 3. Match and Resolve
        for (const market of openMarkets) {
            let matchResult = null;

            // STRATEGY A: Robust ID Match (New Standard)
            if (market.fixture_id) {
                matchResult = finishedGames.find(g => g.fixture.id === market.fixture_id);
            }

            // STRATEGY B: Legacy Name Match (Fallback)
            // Only if ID is missing or ID match failed (though ID match shouldn't fail if ID is correct)
            if (!matchResult && !market.fixture_id) {
                matchResult = finishedGames.find(g =>
                    (g.teams.home.name === market.home_team || g.teams.home.name.includes(market.home_team)) &&
                    (g.teams.away.name === market.away_team || g.teams.away.name.includes(market.away_team))
                );
            }

            if (matchResult) {
                // Determine Winner
                let winner = null;
                const goalsHome = matchResult.goals.home;
                const goalsAway = matchResult.goals.away;

                // Check Penalties first?
                if (matchResult.score.penalty.home !== null) {
                    if (matchResult.score.penalty.home > matchResult.score.penalty.away) winner = 'home';
                    else winner = 'away';
                } else {
                    // Regular Time / AET
                    if (goalsHome > goalsAway) winner = 'home';
                    else if (goalsAway > goalsHome) winner = 'away';
                    else winner = 'draw';
                }

                // EXECUTE RESOLUTION (Call RPC)
                console.log(`Resolving ${market.id}: Winner ${winner}`);

                const { data: rpcData, error: rpcError } = await supabase.rpc('resolve_market', {
                    p_market_id: market.id,
                    p_winning_outcome: winner
                });

                if (rpcError) {
                    logs.push(`❌ Erro RPC ${market.id}: ${rpcError.message}`);
                } else {
                    logs.push(`✅ Resolvido: ${market.home_team} x ${market.away_team} -> Vencedor: ${winner.toUpperCase()}`);
                }
            } else {
                logs.push(`⏳ Jogo não encontrado ou não finalizado na API: ${market.home_team} x ${market.away_team}`);
            }
        }

        // 4. Resolve P2P Challenges
        // We also need to check 'challenges' table for 'matched' bets on these finished fixtures.
        if (finishedGames.length > 0) {
            // Get all matched challenges linked to finished fixtures
            const finishedFixtureIds = finishedGames.map(g => g.fixture.id);
            const { data: challenges, error: chalError } = await supabase
                .from('challenges')
                .select('*')
                .eq('status', 'matched')
                .in('fixture_id', finishedFixtureIds);

            if (challenges && challenges.length > 0) {
                for (const challenge of challenges) {
                    const matchResult = finishedGames.find(g => g.fixture.id === challenge.fixture_id);
                    if (matchResult) {
                        let winner = 'draw';
                        const goalsHome = matchResult.goals.home;
                        const goalsAway = matchResult.goals.away;

                        // Check Penalties (if relevant for X1? Usually 90min, but let's stick to standard win logic)
                        if (matchResult.score.penalty.home !== null) {
                            if (matchResult.score.penalty.home > matchResult.score.penalty.away) winner = 'home';
                            else winner = 'away';
                        } else {
                            if (goalsHome > goalsAway) winner = 'home';
                            else if (goalsAway > goalsHome) winner = 'away';
                        }

                        console.log(`Resolving Challenge ${challenge.id}: Result ${winner}`);
                        const { error: rpcError } = await supabase.rpc('resolve_challenge', {
                            p_challenge_id: challenge.id,
                            p_winning_outcome: winner
                        });

                        if (rpcError) {
                            logs.push(`❌ Erro Desafio ${challenge.id}: ${rpcError.message}`);
                        } else {
                            logs.push(`✅ Desafio Resolvido: ${challenge.match_name}`);
                            resolvedCount++;
                        }
                    }
                }
            }
        }

        return NextResponse.json({
            success: true,
            resolved: resolvedCount,
            logs: logs
        });

    } catch (error) {
        console.error('Auto-Resolve Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
