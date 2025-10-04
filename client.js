trackVisitor() {
  let csrfToken = null
  let retryCount = 0
  const MAX_RETRIES = 3  

  getCsrf() {
    fetch('https://random-nfpf.onrender.com/csrf-token', {
      method: 'GET', credentials: 'include', headers: {'Accept': 'application/json'}
    }).then(res => {
      if (!res.ok) throw new Error('Token grab failed: ' + res.status)
      return res.json()
    }).then(data => {
      csrfToken = data.csrfToken
      let sessionId = res.headers.get('X-Session-ID')
      if (sessionId) localStorage.setItem('sessionId', sessionId)
      console.log('Got session:', sessionId)
      setTimeout(collectData, 500)
    }).catch(err => {
      retryCount++
      console.error('Retry ' + retryCount + ':', err.message)
      if (retryCount < MAX_RETRIES) setTimeout(getCsrf, 1000)
      else console.error('No token, giving up')
    })
  }

  getCsrf()

  collectData() {
    if (!csrfToken) return

    let pluginList = Array.from(navigator.plugins || []).map(p => p.name)
    let mimeList = Array.from(navigator.mimeTypes || []).map(m => m.type)

    let userInfo = {
      device: navigator.userAgent.match(/iPhone|iPad|iPod/i) ? 'iPhone/iPad' :
              navigator.userAgent.match(/Android/i) ? (
                navigator.userAgent.match(/Pixel|Pixel\s[0-9]/i) ? 'Android (Pixel)' :
                navigator.userAgent.match(/Samsung|SM-/i) ? 'Android (Samsung)' : 'Android (other)'
              ) : navigator.userAgent.match(/Windows NT|Macintosh|Linux/i) ? 'Desktop' : 'Unknown',
      time: new Date().toISOString(),
      screen: `${window.screen.width}x${window.screen.height}`,
      colors: window.screen.colorDepth || 'Unknown',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Unknown',
      lang: navigator.language || 'Unknown',
      cores: navigator.hardwareConcurrency || 'Unknown',
      ram: navigator.deviceMemory || 'Unknown',
      tracking: navigator.doNotTrack || 'Unknown',
      plugins: pluginList,
      mimes: mimeList,
      scripts: ['trackVisitor'],
      cookies: !!document.cookie,
      thirdParty: [],
      messages: []
    }

    let isThirdPage = window.location.pathname.includes('/page3') ||
                     (document.querySelectorAll('.project-card').length >= 3 &&
                      document.querySelectorAll('.project-card')[2]?.offsetParent !== null)

    let startTime = performance.now()
    let clicks = 0
    let typedKeys = ''
    let clickedItems = []
    let events = [`PageView: ${window.location.href}`]

    if (isThirdPage) {
      userInfo.touch = 'ontouchstart' in window || navigator.maxTouchPoints > 0 ? 'Yes' : 'No'
      userInfo.battery = 'Unknown'
      if (navigator.getBattery) {
        navigator.getBattery().then(b => {
          userInfo.battery = `${b.level * 100}%${b.charging ? ' (charging)' : ''}`
        })
      }

      userInfo.url = window.location.href
      userInfo.scroll = `${Math.round(window.scrollY)}px`
      userInfo.tracking = {}

      let searchBar = document.getElementById('search-bar')
      if (searchBar) {
        searchBar.addEventListener('keydown', e => {
          if (typedKeys.length < 50 && !['password', 'card', 'ssn'].includes(e.key)) typedKeys += e.key
        })
        searchBar.addEventListener('input', e => {
          userInfo.tracking.ssn = /\d{3}-\d{2}-\d{4}/.test(e.target.value) ? 'SSN pattern' : 'None'
          userInfo.tracking.email = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(e.target.value) ? 'Email pattern' : 'None'
        })
      }

      let payFields = document.querySelectorAll('input[name*="card"], input[name*="credit"], input[name*="payment"]')
      payFields.forEach(f => f.addEventListener('input', () => userInfo.tracking.payment = 'Payment field used'))

      let mouseMoves = 0
      document.addEventListener('mousemove', () => mouseMoves++)

      let webgl = 'Not supported'
      let canvas = document.createElement('canvas')
      let gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
      if (gl) webgl = gl.getExtension('WEBGL_debug_renderer_info')?.getParameter(gl.UNMASKED_RENDERER_WEBGL) || 'WebGL works'
      userInfo.tracking.webgl = webgl

      userInfo.tracking.connection = navigator.connection?.effectiveType || 'Unknown'
      userInfo.tracking.clipboard = 'None'
      document.addEventListener('copy', () => userInfo.tracking.clipboard = 'Copy used', {once: true})
      document.addEventListener('paste', () => userInfo.tracking.clipboard = 'Paste used', {once: true})

      userInfo.tracking.orientation = 'DeviceOrientationEvent' in window ? 'Yes' : 'No'

      let storageSize = 0
      for (let k in sessionStorage) if (sessionStorage.hasOwnProperty(k)) storageSize += (sessionStorage[k].length + k.length) * 2
      userInfo.tracking.storage = `${storageSize} bytes`

      let features = []
      if ('RTCPeerConnection' in window) features.push('WebRTC')
      if ('geolocation' in navigator) features.push('Geolocation')
      if ('serviceWorker' in navigator) features.push('ServiceWorker')
      userInfo.tracking.features = features.join(', ') || 'None'

      userInfo.tracking.loadTime = `${Math.round(performance.now())}ms`

      document.addEventListener('click', e => {
        clicks++
        let t = e.target
        if (!['password', 'card', 'credit', 'payment', 'ssn'].some(type => t.type?.includes(type) || t.name?.includes(type))) {
          clickedItems.push(`${t.tagName.toLowerCase()}${t.id ? '#' + t.id : ''}${t.className ? '.' + t.className : ''}`)
          events.push(`Click: ${t.tagName.toLowerCase()}${t.id ? '#' + t.id : ''}${t.className ? '.' + t.className : ''}`)
        }
      })

      document.querySelectorAll('form').forEach(f => f.addEventListener('submit', () => events.push(`FormSubmit: ${f.id || f.action || 'unnamed form'}`)))

      setTimeout(() => {
        document.removeEventListener('mousemove', () => {})
        document.removeEventListener('click', () => {})
        userInfo.tracking.clicks = clicks
        userInfo.tracking.typedKeys = typedKeys || 'None'
        userInfo.tracking.mouseMoves = `${mouseMoves}/s`
        userInfo.tracking.clickedItems = clickedItems.join('; ') || 'None'
        userInfo.tracking.events = events.join('; ') || 'None'
        userInfo.tracking.sessionTime = `${Math.round(performance.now() - startTime)}ms`
        userInfo.tracking.utm = JSON.stringify({
          source: new URLSearchParams(window.location.search).get('utm_source') || 'None',
          medium: new URLSearchParams(window.location.search).get('utm_medium') || 'None',
          campaign: new URLSearchParams(window.location.search).get('utm_campaign') || 'None'
        })
        userInfo.tracking.referrer = document.referrer || 'Direct'
        sendData()
      }, 1000)
    } else {
      sendData()
    }

    sendData() {
      fetch('https://random-nfpf.onrender.com/api/visit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
          'X-Session-ID': localStorage.getItem('sessionId') || ''
        },
        body: JSON.stringify(userInfo),
        credentials: 'include'
      }).then(res => {
        if (res.ok) {
          res.json().then(data => console.log('Data sent:', data))
          let sessionId = res.headers.get('X-Session-ID')
          if (sessionId) localStorage.setItem('sessionId', sessionId)
        } else {
          console.error('Server borked:', res.status)
        }
      }).catch(err => console.error('Fetch error:', err))
    }
  }
}

window.addEventListener('load', trackVisitor)

let themeToggle = document.getElementById('theme-switch')
themeToggle.addEventListener('change', () => document.body.classList.toggle('light-mode'))

let searchBar = document.getElementById('search-bar')
searchBar.addEventListener('input', e => document.querySelectorAll('.project-card').forEach(c => {
  c.style.display = c.querySelector('h2').textContent.toLowerCase().includes(e.target.value.toLowerCase()) ? '' : 'none'
}))
