// Updated server with JSON responses, CORS whitelist, defaults and safer validation
const express = require('express');
const axios = require('axios');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Update allowed origins to include your front-end host(s)
const ALLOWED_ORIGINS = [
  "https://autoshareby-kristbella.vercel.app",
  "https://lalat.vercel.app",
  "http://localhost:3000",
  "http://localhost:5000"
];

// CORS middleware with whitelist
app.use(cors({
  origin: function(origin, callback) {
    // allow requests with no origin (like curl or same-origin)
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.indexOf(origin) !== -1) {
      return callback(null, true);
    }
    return callback(new Error('CORS_NOT_ALLOWED'));
  },
}));

app.use(express.json());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/api/submit', async (req, res) => {
  try {
    // Basic validation — cookie and url are required; amount/interval have sensible defaults
    const { cookie, url } = req.body;
    let { amount, interval } = req.body;

    if (!cookie || !url) {
      return res.status(400).json({ status: 400, error: 'Missing required fields: cookie or url' });
    }

    amount = parseInt(amount, 10);
    interval = parseInt(interval, 10);

    if (Number.isNaN(amount) || amount <= 0) amount = 1;           // default 1 share
    if (Number.isNaN(interval) || interval <= 0) interval = 1;     // default 1 second

    const cookies = await convertCookie(cookie);
    if (!cookies) {
      return res.status(400).json({ status: 400, error: 'Invalid cookies format' });
    }

    // Launch the share process (non-blocking)
    startShareSession(cookies, url, amount, interval)
      .catch(err => console.error('startShareSession failed:', err));

    return res.status(200).json({ status: 200, message: 'Share session started successfully.' });
  } catch (err) {
    console.error('POST /api/submit error:', err);
    return res.status(500).json({ status: 500, error: err.message || 'Server Error' });
  }
});

async function startShareSession(cookies, url, amount, interval) {
  const id = await getPostID(url);
  const accessToken = await getAccessToken(cookies);

  if (!id) throw new Error('Invalid URL: Post may be private or visible to friends only.');
  if (!accessToken) throw new Error('Failed to retrieve access token. Check cookies.');

  let sharedCount = 0;
  const headers = {
    accept: '*/*',
    'accept-encoding': 'gzip, deflate',
    connection: 'keep-alive',
    cookie: cookies,
    host: 'graph.facebook.com',
  };

  // Use ms from interval argument (seconds -> ms)
  const intervalMs = Math.max(100, interval * 1000);

  const timer = setInterval(async () => {
    try {
      // Post to Graph API (be aware of API/permission changes)
      const response = await axios.post(
        `https://graph.facebook.com/me/feed?link=https://m.facebook.com/${id}&published=0&access_token=${accessToken}`,
        {}, { headers, timeout: 10000 }
      );

      if (response.status === 200) {
        sharedCount++;
      } else {
        console.warn('Facebook responded with non-200 status', response.status);
      }

      if (sharedCount >= amount) {
        clearInterval(timer);
        console.log(`Completed share session for post ${id}. sharedCount=${sharedCount}`);
      }
    } catch (error) {
      console.error('Error sharing post:', error.message || error);
      // stop the interval on repeated failures to avoid infinite spam
      clearInterval(timer);
    }
  }, intervalMs);

  // Failsafe timeout: stop after maximum expected time
  setTimeout(() => {
    clearInterval(timer);
  }, amount * intervalMs + 5000);
}

async function convertCookie(cookie) {
  // Accept either a JSON array string or a pre-joined cookie string
  try {
    if (typeof cookie !== 'string') return null;

    // If it already looks like "key=value; key2=value2" return it directly
    if (cookie.includes('=') && cookie.includes(';')) {
      return cookie;
    }

    // Try parse JSON array (appstate)
    const parsed = JSON.parse(cookie);
    if (Array.isArray(parsed)) {
      const sb = parsed.find(c => c.key === 'sb');
      if (!sb) throw new Error('Missing "sb" cookie in appstate.');
      return parsed.map(c => `${c.key}=${c.value}`).join('; ');
    }

    // If parsed is object with cookies map
    if (typeof parsed === 'object' && parsed !== null) {
      // attempt to handle object with cookies
      const entries = Object.entries(parsed);
      if (entries.length) {
        return entries.map(([k, v]) => `${k}=${v}`).join('; ');
      }
    }

    return null;
  } catch (err) {
    console.error('convertCookie error:', err);
    return null;
  }
}

async function getPostID(url) {
  try {
    const response = await axios.post('https://id.traodoisub.com/api.php', `link=${encodeURIComponent(url)}`, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 10000
    });
    return response.data && response.data.id ? response.data.id : null;
  } catch (err) {
    console.error('getPostID failed:', err.message || err);
    return null;
  }
}

async function getAccessToken(cookie) {
  try {
    const headers = {
      authority: 'business.facebook.com',
      accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      cookie,
      referer: 'https://www.facebook.com/',
      'User-Agent': 'Mozilla/5.0 (compatible)'
    };

    const response = await axios.get('https://business.facebook.com/content_management', { headers, timeout: 10000 });
    const tokenMatch = response.data.match(/"accessToken"\s*:\s*"([^"]+)"/);
    return tokenMatch ? tokenMatch[1] : null;
  } catch (err) {
    console.error('getAccessToken failed:', err.message || err);
    return null;
  }
}

app.use((err, req, res, next) => {
  // CORS error handling
  if (err && err.message === 'CORS_NOT_ALLOWED') {
    return res.status(403).json({ status: 403, error: 'Origin not allowed by CORS' });
  }
  next(err);
});

app.listen(PORT, () => {
  console.log(`Server running at http://0.0.0.0:${PORT}`);
});
