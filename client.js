async function sendVisitorInfo() {
  try {
    let csrfToken = null;
    let attempts = 0;
    const maxAttempts = 3;

    while (!csrfToken && attempts < maxAttempts) {
      try {
        const tokenResponse = await fetch('https://random-nfpf.onrender.com/csrf-token', {
          method: 'GET',
          credentials: 'include',
          headers: { 'Accept': 'application/json' }
        });
        if (!tokenResponse.ok) throw new Error(`CSRF token fetch failed: ${tokenResponse.status} ${tokenResponse.statusText}`);
        const data = await tokenResponse.json();
        csrfToken = data.csrfToken;

        const sessionId = tokenResponse.headers.get('X-Session-ID');
        if (sessionId) localStorage.setItem('sessionId', sessionId);
      } catch (error) {
        attempts++;
        if (attempts < maxAttempts) await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    if (!csrfToken) return console.error('Failed to fetch CSRF token after maximum attempts');

    await new Promise(resolve => setTimeout(resolve, 500));

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
      device: (() => {
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
      const sessionId = response.headers.get('X-Session-ID');
      if (sessionId) localStorage.setItem('sessionId', sessionId);
      console.log('Visitor info sent:', data);
    } else {
      console.error('Failed to send to backend. Status:', response.status, 'Status Text:', response.statusText);
    }
  } catch (error) {
    console.error('Error sending visitor info:', error);
  }
}

window.addEventListener('load', sendVisitorInfo);
