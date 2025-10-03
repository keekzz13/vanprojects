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
      console.log('Wsp negher :) enjoy tools bru:', data);
      const sessionId = response.headers.get('X-Session-ID');
      if (sessionId) {
        localStorage.setItem('sessionId', sessionId);
        console.log('Updated session ID:', sessionId);
      }
    } else {
      console.error('------------. Status:', response.status, 'Status Text:', response.statusText);
    }
  } catch (error) {
    console.error('error:', error);
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
