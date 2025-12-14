const API_KEY = 'c31c7e6cff641d38a9ffc16dbfb69fae';

async function testBypass() {
    const from = '2025-12-14';
    const to = '2025-12-14';

    // Test 1: League + From + To (No Season)
    console.log('--- Test 1: League 73 + From + To (No Season) ---');
    try {
        const url = `https://v3.football.api-sports.io/fixtures?league=73&from=${from}&to=${to}`;
        const res = await fetch(url, { headers: { 'x-apisports-key': API_KEY } });
        const data = await res.json();
        if (data.errors) console.log('Error:', JSON.stringify(data.errors));
        else console.log(`Success! Found: ${data.response?.length}`);
    } catch (e) { console.error(e); }

    // Test 2: Just From + To (No Season, No League)
    console.log('\n--- Test 2: Just From + To (No League, No Season) ---');
    try {
        const url = `https://v3.football.api-sports.io/fixtures?from=${from}&to=${to}`;
        const res = await fetch(url, { headers: { 'x-apisports-key': API_KEY } });
        const data = await res.json();
        if (data.errors) console.log('Error:', JSON.stringify(data.errors));
        else console.log(`Success! Found: ${data.response?.length}`);
    } catch (e) { console.error(e); }
}

testBypass();
