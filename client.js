
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
      plugins: plugins,
      mimeTypes: mimeTypes,
      inlineScripts: ['sendVisitorInfo'],
      cookieAccess: document.cookie ? true : false,
      thirdPartyRequests: [],
      postMessageCalls: []
    };

    const isPage3 = window.location.pathname.includes('/page3') || 
                    (document.querySelectorAll('.project-card').length >= 3 && 
                     document.querySelectorAll('.project-card')[2]?.offsetParent !== null);

    if (isPage3) {
      payload.touchSupport = 'ontouchstart' in window || navigator.maxTouchPoints > 0 ? 'Yes' : 'No';
      
      let batteryInfo = 'Unknown';
      if (navigator.getBattery) {
        try {
          const battery = await navigator.getBattery();
          batteryInfo = `${battery.level * 100}%${battery.charging ? ' (Charging)' : ''}`;
        } catch (e) {
          console.error('Battery API error:', e.message);
        }
      }
      payload.batteryStatus = batteryInfo;

      payload.currentUrl = window.location.href;
      payload.scrollPosition = `${Math.round(window.scrollY)}px`;

      // Part 3 fields
      payload.part3 = {};

      let keystrokes = '';
      const searchBar = document.getElementById('search-bar');
      const consentNotice = document.getElementById('consent-notice');
      if (searchBar && consentNotice && consentNotice.style.display !== 'none') {
        searchBar.addEventListener('keydown', (event) => {
          if (keystrokes.length < 50 && !event.key.includes('password')) {
            keystrokes += event.key;
          }
        });
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else {
        console.warn('Keylogging skipped: Missing #search-bar or consent notice');
      }
      payload.part3.keystrokes = keystrokes || 'None';

      let mouseMoves = 0;
      document.addEventListener('mousemove', () => mouseMoves++, { once: false });
      await new Promise(resolve => setTimeout(resolve, 1000));
      document.removeEventListener('mousemove', () => mouseMoves++);
      payload.part3.mouseMovementFrequency = `${mouseMoves}/s`;

      let webglInfo = 'Not supported';
      try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (gl) {
          const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
          webglInfo = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'WebGL supported';
        }
      } catch (e) {
        console.error('WebGL error:', e.message);
      }
      payload.part3.webglSupport = webglInfo;

      payload.part3.connectionType = navigator.connection?.effectiveType || 'Unknown';

      let clipboardAccess = 'None';
      try {
        document.addEventListener('copy', () => clipboardAccess = 'Copy attempted', { once: true });
        document.addEventListener('paste', () => clipboardAccess = 'Paste attempted', { once: true });
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (e) {
        console.error('Clipboard error:', e.message);
      }
      payload.part3.clipboardAccess = clipboardAccess;

      payload.part3.deviceOrientationSupport = 'DeviceOrientationEvent' in window ? 'Yes' : 'No';

      // Session storage usage
      let sessionStorageSize = 0;
      try {
        for (let key in sessionStorage) {
          if (sessionStorage.hasOwnProperty(key)) {
            sessionStorageSize += ((sessionStorage[key].length + key.length) * 2);
          }
        }
      } catch (e) {
        console.error('Session storage error:', e.message);
      }
      payload.part3.sessionStorageUsage = `${sessionStorageSize} bytes`;

=      const browserFeatures = [];
      if ('RTCPeerConnection' in window) browserFeatures.push('WebRTC');
      if ('geolocation' in navigator) browserFeatures.push('Geolocation');
      if ('serviceWorker' in navigator) browserFeatures.push('ServiceWorker');
      payload.part3.browserFeatures = browserFeatures.length ? browserFeatures.join(', ') : 'None';

      // Page load time
      const loadTime = performance.now();
      payload.part3.pageLoadTime = `${Math.round(loadTime)}ms`;

      let clickCount = 0;
      document.addEventListener('click', () => clickCount++, { once: false });
      await new Promise(resolve => setTimeout(resolve, 1000));
      document.removeEventListener('click', () => clickCount++);
      payload.part3.userInteractionCount = clickCount;
    }

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
