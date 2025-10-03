async function sendVisitorInfo() {
  try {
    // Retry fetching CSRF token up to 3 times
    let csrfToken = null;
    let attempts = 0;
    const maxAttempts = 3;

    while (!csrfToken && attempts < maxAttempts) {
      try {
        const tokenResponse = await fetch('https://random-nfpf.onrender.com/csrf-token', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Accept': 'application/json'
          }
        });
        if (!tokenResponse.ok) {
          throw new Error(`CSRF token fetch failed: ${tokenResponse.status} ${tokenResponse.statusText}`);
        }
        const data = await tokenResponse.json();
        csrfToken = data.csrfToken;
        const sessionId = tokenResponse.headers.get('X-Session-ID');
        if (sessionId) {
          localStorage.setItem('sessionId', sessionId);
          console.log('Stored session ID:', sessionId);
        }
        console.log('Fetched CSRF token:', csrfToken);
      } catch (error) {
        attempts++;
        console.error(`CSRF token fetch attempt ${attempts} failed:`, error.message);
        if (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }

    if (!csrfToken) {
      console.error('Aborting /api/visit request: Failed to fetch CSRF token after maximum attempts');
      return;
    }

    // Delay to ensure cookie is set
    await new Promise(resolve => setTimeout(resolve, 500));

    // Collect browser signals
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('Hello, World!', 2, 15);
    const canvasHash = canvas.toDataURL();

    const plugins = [];
    if (navigator.plugins && navigator.plugins.length) {
      for (let i = 0; i < navigator.plugins.length; i++) {
        plugins.push(navigator.plugins[i].name);
      }
    }

    const mimeTypes = [];
    if (navigator.mimeTypes && navigator.mimeTypes.length) {
      for (let i = 0; i < navigator.mimeTypes.length; i++) {
        mimeTypes.push(navigator.mimeTypes[i].type);
      }
    }

    const payload = {
      device: (function getDevice() {
        const ua = navigator.userAgent;
        if (/iPhone|iPad|iPod/i.test(ua)) return 'iPhone/iPad';
        if (/Android/i.test(ua)) {
          if (/Pixel|Pixel\s[0-9]/i.test(ua)) return 'Android (Pixel)';
          if (/Samsung|SM-/i.test(ua)) return 'Android (Samsung)';
          return 'Android (unknown)';
        }
        if (/Windows NT|Macintosh|Linux/i.test(ua)) return 'PC';
        return 'Unknown';
      })(),
      ts: new Date().toISOString(),
      screenSize: `${window.screen.width}x${window.screen.height}`,
      colorDepth: window.screen.colorDepth || 'Unknown',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Unknown',
      language: navigator.language || 'Unknown',
      hardwareConcurrency: navigator.hardwareConcurrency || 'Unknown',
      deviceMemory: navigator.deviceMemory || 'Unknown',
      doNotTrack: navigator.doNotTrack || 'Unknown',
      canvasHash: canvasHash,
      plugins: plugins,
      mimeTypes: mimeTypes,
      inlineScripts: ['sendVisitorInfo'],
      cookieAccess: document.cookie ? true : false,
      thirdPartyRequests: [],
      postMessageCalls: []
    };

    const response = await fetch('https://random-nfpf.onrender.com/api/visit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken,
        'X-Session-ID': localStorage.getItem('sessionId') || ''
      },
      body: JSON.stringify(payload),
      credentials: 'include'
    });

    if (response.ok) {
      const data = await response.json();
      console.log('Visitor info sent:', data);
      const sessionId = response.headers.get('X-Session-ID');
      if (sessionId) {
        localStorage.setItem('sessionId', sessionId);
        console.log('Updated session ID:', sessionId);
      }
    } else {
      console.error('Failed to send to backend. Status:', response.status, 'Status Text:', response.statusText);
    }
  } catch (error) {
    console.error('Error sending visitor info:', error);
  }
}

// Run on page load
window.addEventListener('load', sendVisitorInfo);

const themeSwitch = document.getElementById('theme-switch');
themeSwitch.addEventListener('change', () => {
  document.body.classList.toggle('light-mode');
});

const searchBar = document.getElementById('search-bar');
searchBar.addEventListener('input', (event) => {
  const searchQuery = event.target.value.toLowerCase();
  document.querySelectorAll('.project-card').forEach((card) => {
    const title = card.querySelector('h2').textContent.toLowerCase();
    card.style.display = title.includes(searchQuery) ? '' : 'none';
  });
});
