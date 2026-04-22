const https = require('https');

const sql = `
SELECT tablename 
FROM pg_catalog.pg_tables 
WHERE schemaname = 'public';
`;

const projectRef = 'uxqbkxfctifxrgstxlwf';
const token = 'sbp_7467ad8c26913ae2546becc59bc2ebb235ea313c';

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
  let responseData = '';
  res.on('data', (chunk) => { responseData += chunk; });
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', responseData);
  });
});

req.on('error', (error) => { console.error(error); });
req.write(data);
req.end();
