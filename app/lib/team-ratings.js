export const TEAM_TIERS = {
    // TIER 1 - Elite / Favorites (Score: 90-95)
    'Flamengo': 1, 'Palmeiras': 1, 'Botafogo': 1, 'Atlético-MG': 1,
    'Real Madrid': 1, 'Manchester City': 1, 'Liverpool': 1, 'Bayern Munich': 1,
    'River Plate': 1,

    // TIER 2 - Strong / Competitive (Score: 80-85)
    'São Paulo': 2, 'Internacional': 2, 'Grêmio': 2, 'Fortaleza': 2,
    'Fluminense': 2, 'Bahia': 2, 'Cruzeiro': 2, 'Boca Juniors': 2,
    'Pachuca': 2, 'Al Ahly': 2, 'Al-Hilal': 2,

    // TIER 3 - Mid Table / Struggling Giants (Score: 70-75)
    'Corinthians': 3, 'Vasco': 3, 'Santos': 3, 'Bragantino': 3,
    'Athletico-PR': 3, 'Vitória': 3, 'Ceará': 3, 'Sport': 3,

    // TIER 4 - Underdogs (Default for everyone else)
};

export function calculateOdds(homeTeam, awayTeam) {
    // 1. Get Tiers (Default to 4 if unknown)
    const homeTier = TEAM_TIERS[homeTeam] || 4;
    const awayTier = TEAM_TIERS[awayTeam] || 4;

    // 2. Base Probability (50/50 split)
    let homeProb = 50;

    // 3. Apply Tier Difference
    // Lower Tier is better (1 is best). 
    // Diff > 0 means Home is "worse" (higher tier num).
    // Diff < 0 means Home is "better".
    const diff = homeTier - awayTier;

    // Each tier gap worth ~15% probability swing
    homeProb -= (diff * 15);

    // 4. Home Advantage (+5%)
    homeProb += 5;

    // 5. Random Noise (+/- 3%) to feel organic
    const noise = Math.floor(Math.random() * 7) - 3;
    homeProb += noise;

    // 6. Clamp values (Min 10%, Max 90%)
    if (homeProb > 90) homeProb = 90;
    if (homeProb < 10) homeProb = 10;

    // 7. Calculate Prices
    // Price ~= Probability / 100
    const homePrice = Number((homeProb / 100).toFixed(2));
    const awayPrice = Number((1 - homePrice).toFixed(2));

    return { homePrice, awayPrice };
}
