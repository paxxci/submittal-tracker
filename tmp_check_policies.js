const https = require('https');
const projectRef = 'uxqbkxfctifxrgstxlwf';
const token = 'sbp_7467ad8c26913ae2546becc59bc2ebb235ea313c';
const sql = `SELECT * FROM pg_policies WHERE tablename = 'project_members';`;
const data = JSON.stringify({ query: sql });
const options = {
    hostname: 'api.supabase.com',
    port: 443,
    path: `/v1/projects/${projectRef}/query`,
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};
const req = https.request(options, (res) => {
    let body = '';
    res.on('data', d => body += d);
    res.on('end', () => {
        try {
            console.log(JSON.stringify(JSON.parse(body), null, 2));
        } catch (e) {
            console.log(body);
        }
    });
});
req.write(data);
req.end();
