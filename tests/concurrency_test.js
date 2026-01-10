const http = require('http');
const process = require('process');

const TARGETS = {
    'v1': { port: 8081, name: 'V1 (PHP)' },
    'v2': { port: 8082, name: 'V2 (Python)' },
    'v3': { port: 8083, name: 'V3 (Bun)' }
};

const targetKey = process.argv[2] || 'v1';
const target = TARGETS[targetKey];

if (!target) {
    console.error(`❌ Unknown target: ${targetKey}. Use v1, v2, or v3.`);
    process.exit(1);
}

const API_BASE = `http://localhost:${target.port}/api`;
const LOGIN_URL = `${API_BASE}/login`;
const RESERV_URL = `${API_BASE}/reservations`;

console.log(`🎯 Target: ${target.name} on Port ${target.port}`);

const SPOT_ID = 1;
const CONCURRENCY = 20;

// Helper for requests
function request(url, method, data, headers = {}) {
    return new Promise((resolve, reject) => {
        const payload = JSON.stringify(data);
        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': payload.length,
                ...headers
            }
        };

        const req = http.request(url, options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => resolve({ status: res.statusCode, body }));
        });

        req.on('error', (e) => resolve({ status: 500, error: e.message }));
        req.write(payload);
        req.end();
    });
}

(async () => {
    console.log(`🚀 Starting Concurrency Test: ${CONCURRENCY} parallel requests for Spot #${SPOT_ID}`);

    // 1. Login to get Token
    console.log("🔑 Logging in...");
    const loginRes = await request(LOGIN_URL, 'POST', { username: 'test', password: 'test' });

    if (loginRes.status !== 200) {
        console.error("❌ Login Failed:", loginRes.body);
        process.exit(1);
    }

    const token = JSON.parse(loginRes.body).token;
    console.log("✅ Logged in. Token obtained.");

    // 2. Fire requests
    console.log("🔥 Firing requests...");
    const promises = [];
    const now = new Date();
    // Use a time in the future to ensure valid start
    const start = new Date(now.getTime() + 1000 * 60 * 60 * 24); // Tomorrow

    // Format YYYY-MM-DD HH:mm:ss
    const fmt = (d) => d.toISOString().replace('T', ' ').slice(0, 19);

    const bookingData = {
        spot_id: SPOT_ID,
        start_time: fmt(start),
        end_time: fmt(new Date(start.getTime() + 3600000))
    };

    for (let i = 0; i < CONCURRENCY; i++) {
        promises.push(request(RESERV_URL, 'POST', bookingData, {
            'Authorization': `Bearer ${token}`
        }));
    }

    const results = await Promise.all(promises);

    // 3. Analyze
    const successes = results.filter(r => r.status === 201).length;
    const conflicts = results.filter(r => r.status === 409).length;
    const errors = results.filter(r => r.status !== 201 && r.status !== 409);

    console.log(`\n📊 Results:`);
    console.log(`✅ Successes: ${successes} (Target: 1)`);
    console.log(`⚠️ Conflicts: ${conflicts} (Target: ${CONCURRENCY - 1})`);
    console.log(`❌ Errors:    ${errors.length}`);

    if (errors.length > 0) {
        console.log("Error Samples:", errors.slice(0, 3).map(e => `${e.status} - ${e.body}`));
    }

    if (successes === 1 && conflicts === (CONCURRENCY - 1)) {
        console.log(`\n✅ PASS: Concurrency handled correctly.`);
        process.exit(0);
    } else {
        console.log(`\n❌ FAIL: Race condition detected or unexpected errors.`);
        process.exit(1);
    }
})();
