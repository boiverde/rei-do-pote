const https = require('https');

const API_KEY = 'c31c7e6cff641d38a9ffc16dbfb69fae';
// Use a date that definitely has games, e.g., the date we found earlier 2024-12-14 or a future date
const date = '2025-12-14';

const options = {
    hostname: 'v3.football.api-sports.io',
    path: `/odds?date=${date}&bookmaker=6`, // Bookmaker 6 is Bwin (usually has simplified odds)
    method: 'GET',
    headers: {
        'x-rapidapi-host': 'v3.football.api-sports.io',
        'x-apisports-key': API_KEY
    }
};

const req = https.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        console.log('Status Code:', res.statusCode);
        const parsed = JSON.parse(data);

        if (parsed.errors && Object.keys(parsed.errors).length > 0) {
            console.log('Errors:', parsed.errors);
        } else {
            console.log(`Results: ${parsed.response ? parsed.response.length : 0} odds found.`);
            if (parsed.response && parsed.response.length > 0) {
                console.log('Sample Odd:', JSON.stringify(parsed.response[0].bookmakers[0].bets[0]));
            } else {
                console.log('No odds found. Full Response:', JSON.stringify(parsed).slice(0, 200));
            }
        }
    });
});

req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
});

req.end();
