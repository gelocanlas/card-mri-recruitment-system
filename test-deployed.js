const https = require('https');

const BASE = 'https://card-mri-recruitment-system.vercel.app';
const loginData = JSON.stringify({email:'michealangelo.canlas@cardmri.com',password:'AdminPassword123!'});

function post(path, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(path, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve(JSON.parse(d)); } catch (e) { resolve(d); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function get(path, token) {
  return new Promise((resolve, reject) => {
    const headers = {};
    if (token) headers['Authorization'] = 'Bearer ' + token;
    https.get(path, { headers }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve(JSON.parse(d)); } catch (e) { resolve(d); }
      });
    }).on('error', reject);
  });
}

(async () => {
  const login = await post(BASE + '/api/auth/login', loginData);
  console.log('Login:', login.message);
  const token = login.user.token;

  const jobs = await get(BASE + '/api/jobs', token);
  console.log('Jobs:', Array.isArray(jobs) ? jobs.length : 'error');

  const apps = await get(BASE + '/api/applications', token);
  console.log('Applications:', Array.isArray(apps) ? apps.length : apps.error || 'unknown');

  const logs = await get(BASE + '/api/system-logs', token);
  console.log('System Logs:', Array.isArray(logs) ? logs.length : logs.error || 'unknown');
})();
