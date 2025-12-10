export const matches = [
    // --- Brasileirão 2025 (Rodada 1 - 29/03) ---
    {
        id: "pal-bot-br25",
        homeTeam: "Palmeiras",
        awayTeam: "Botafogo",
        league: "Brasileirão",
        eventDate: "2025-03-29T16:30:00",
        homePrice: 0.55, // Palmeiras slight favorite at home
        awayPrice: 0.45,
        volume: "R$ 3.5M",
        history: generateHistory(0.55)
    },
    {
        id: "fla-int-br25",
        homeTeam: "Flamengo",
        awayTeam: "Internacional",
        league: "Brasileirão",
        eventDate: "2025-03-29T21:00:00",
        homePrice: 0.60,
        awayPrice: 0.40,
        volume: "R$ 2.8M",
        history: generateHistory(0.60)
    },
    {
        id: "bah-cor-br25",
        homeTeam: "Bahia",
        awayTeam: "Corinthians",
        league: "Brasileirão",
        eventDate: "2025-03-29T18:30:00",
        homePrice: 0.48,
        awayPrice: 0.52, // Balanced game
        volume: "R$ 1.9M",
        history: generateHistory(0.48)
    },

    // --- Paulistão 2025 (Rodada 1 - 15/01) ---
    {
        id: "bra-cor-sp25",
        homeTeam: "Bragantino",
        awayTeam: "Corinthians",
        league: "Paulistão",
        eventDate: "2025-01-15T19:00:00", // Dates from research
        homePrice: 0.45,
        awayPrice: 0.55, // Corinthians favorite due to crowd/momentum?
        volume: "R$ 900K",
        history: generateHistory(0.45)
    },
    {
        id: "pal-por-sp25",
        homeTeam: "Palmeiras",
        awayTeam: "Portuguesa",
        league: "Paulistão",
        eventDate: "2025-01-15T21:30:00",
        homePrice: 0.85, // Heavy favorite
        awayPrice: 0.15,
        volume: "R$ 1.5M",
        history: generateHistory(0.85)
    },
    {
        id: "san-mir-sp25",
        homeTeam: "Santos",
        awayTeam: "Mirassol",
        league: "Paulistão",
        eventDate: "2025-01-16T19:00:00",
        homePrice: 0.65,
        awayPrice: 0.35,
        volume: "R$ 800K",
        history: generateHistory(0.65)
    },

    // --- Carioca 2025 (Rodada 1 - 11/01) ---
    {
        id: "bot-mar-rj25",
        homeTeam: "Botafogo",
        awayTeam: "Maricá",
        league: "Carioca", // Starts 11/01
        eventDate: "2025-01-11T16:00:00",
        homePrice: 0.92, // Massive favorite
        awayPrice: 0.08,
        volume: "R$ 600K",
        history: generateHistory(0.92)
    },
    {
        id: "nov-vas-rj25",
        homeTeam: "Nova Iguaçu",
        awayTeam: "Vasco",
        league: "Carioca",
        eventDate: "2025-01-11T16:30:00",
        homePrice: 0.30,
        awayPrice: 0.70,
        volume: "R$ 1.2M",
        history: generateHistory(0.30)
    },
    {
        id: "fla-boa-rj25",
        homeTeam: "Flamengo",
        awayTeam: "Boavista",
        league: "Carioca",
        eventDate: "2025-01-12T16:00:00",
        homePrice: 0.88,
        awayPrice: 0.12,
        volume: "R$ 2.5M",
        history: generateHistory(0.88)
    },

    // --- Copa do Brasil (Simulated R1) ---
    {
        id: "sou-cru-cb25",
        homeTeam: "Sousa-PB",
        awayTeam: "Cruzeiro",
        league: "Copa do Brasil",
        eventDate: "2025-02-21T21:30:00",
        homePrice: 0.20,
        awayPrice: 0.80, // Cruzeiro huge favorite against Dino
        volume: "R$ 400K",
        history: generateHistory(0.20)
    },

    // --- Regionais (Copa do Nordeste 2025) ---
    {
        id: "bah-spo-ne25",
        homeTeam: "Bahia",
        awayTeam: "Sport",
        league: "Copa do Nordeste",
        eventDate: "2025-02-05T21:30:00",
        homePrice: 0.58,
        awayPrice: 0.42,
        volume: "R$ 1.8M",
        history: generateHistory(0.58)
    },
    {
        id: "cea-for-ne25",
        homeTeam: "Ceará",
        awayTeam: "Fortaleza",
        league: "Copa do Nordeste",
        eventDate: "2025-02-08T16:00:00",
        homePrice: 0.45,
        awayPrice: 0.55, // Clássico-Rei
        volume: "R$ 2.2M",
        history: generateHistory(0.45)
    },

    // --- Regionais (Copa Verde 2025) ---
    {
        id: "pay-rem-cv25",
        homeTeam: "Paysandu",
        awayTeam: "Remo",
        league: "Copa Verde",
        eventDate: "2025-03-01T17:00:00",
        homePrice: 0.50,
        awayPrice: 0.50, // Re-Pa is always tight
        volume: "R$ 1.5M",
        history: generateHistory(0.50)
    },

    // --- Regionais (Mineiro 2025) ---
    {
        id: "cam-cru-mg25",
        homeTeam: "Atlético-MG",
        awayTeam: "Cruzeiro",
        league: "Mineiro",
        eventDate: "2025-02-02T16:00:00",
        homePrice: 0.52,
        awayPrice: 0.48,
        volume: "R$ 3.8M",
        history: generateHistory(0.52)
    },

    // --- Regionais (Gaúcho 2025) ---
    {
        id: "int-gre-rs25",
        homeTeam: "Internacional",
        awayTeam: "Grêmio",
        league: "Gaúcho",
        eventDate: "2025-02-23T16:00:00",
        homePrice: 0.50,
        awayPrice: 0.50,
        volume: "R$ 4.5M",
        history: generateHistory(0.50)
    },

    // --- Internacional (Libertadores 2025) ---
    {
        id: "pal-riv-lib25",
        homeTeam: "Palmeiras",
        awayTeam: "River Plate",
        league: "Libertadores",
        eventDate: "2025-04-02T21:30:00",
        homePrice: 0.55,
        awayPrice: 0.45,
        volume: "R$ 5.0M",
        history: generateHistory(0.55)
    },
    {
        id: "fla-pen-lib25",
        homeTeam: "Flamengo",
        awayTeam: "Peñarol",
        league: "Libertadores",
        eventDate: "2025-04-03T21:30:00",
        homePrice: 0.70,
        awayPrice: 0.30,
        volume: "R$ 4.2M",
        history: generateHistory(0.70)
    },

    // --- Internacional (Sul-Americana 2025) ---
    {
        id: "cor-rac-sul25",
        homeTeam: "Corinthians",
        awayTeam: "Racing",
        league: "Sul-Americana",
        eventDate: "2025-04-02T19:00:00",
        homePrice: 0.60,
        awayPrice: 0.40,
        volume: "R$ 3.1M",
        history: generateHistory(0.60)
    }
];

// Helper to generate a believable 24-point history (1 point per hour)
function generateHistory(finalPrice) {
    const data = [];
    let currentPrice = finalPrice - (Math.random() * 0.10 - 0.05); // Start slightly off

    for (let i = 0; i < 24; i++) {
        // Random walk with drift towards final price
        const drift = (finalPrice - currentPrice) * 0.1;
        const volatility = (Math.random() - 0.5) * 0.05;
        currentPrice += drift + volatility;

        // Clamp between 0.01 and 0.99
        currentPrice = Math.max(0.01, Math.min(0.99, currentPrice));

        // Format time (mocking last 24h)
        const date = new Date();
        date.setHours(date.getHours() - (24 - i));

        data.push({
            time: date.getHours() + ":00",
            price: currentPrice
        });
    }
    return data;
}

