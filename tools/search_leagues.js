const https = require('https');

const API_KEY = 'c31c7e6cff641d38a9ffc16dbfb69fae';

function fetchAPI(path) {
    const options = {
        hostname: 'v3.football.api-sports.io',
        path: path,
        method: 'GET',
        headers: {
            'x-rapidapi-host': 'v3.football.api-sports.io',
            'x-rapidapi-key': API_KEY
        }
    };

    const req = https.request(options, res => {
        let data = '';
        res.on('data', chunk => { data += chunk; });
        res.on('end', () => {
            const response = JSON.parse(data);
            console.log(`Path: ${path}`);
            if (response.response) {
                response.response.forEach(league => {
                    console.log(`ID: ${league.league.id} | Name: ${league.league.name} | Country: ${league.country.name}`);
                });
            } else {
                console.log(response);
            }
        });
    });

    req.on('error', error => {
        console.error(error);
    });

    req.end();
}

// Search for "Club World Cup"
fetchAPI('/leagues?search=' + encodeURIComponent('Club World Cup'));
// Search for "Intercontinental"
fetchAPI('/leagues?search=' + encodeURIComponent('Intercontinental'));
