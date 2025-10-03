var gk_isXlsx = false;
var gk_xlsxFileLookup = {};
var gk_fileData = {};

function filledCell(cell) {
  return cell !== '' && cell != null;
}

function loadFileData(filename) {
  if (gk_isXlsx && gk_xlsxFileLookup[filename]) {
    try {
      var workbook = XLSX.read(gk_fileData[filename], { type: 'base64' });
      var firstSheetName = workbook.SheetNames[0];
      var worksheet = workbook.Sheets[firstSheetName];
      var jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, blankrows: false, defval: '' });
      var filteredData = jsonData.filter(row => row.some(filledCell));
      var headerRowIndex = filteredData.findIndex((row, index) =>
        row.filter(filledCell).length >= filteredData[index + 1]?.filter(filledCell).length
      );
      if (headerRowIndex === -1 || headerRowIndex > 25) {
        headerRowIndex = 0;
      }
      var csv = XLSX.utils.aoa_to_sheet(filteredData.slice(headerRowIndex));
      csv = XLSX.utils.sheet_to_csv(csv, { header: 1 });
      return csv;
    } catch (e) {
      console.error(e);
      return "";
    }
  }
  return gk_fileData[filename] || "";
}

document.addEventListener('DOMContentLoaded', () => {
  const themeToggle = document.getElementById('themeToggle');
  const hamburger = document.getElementById('hamburger');
  const sidebar = document.getElementById('sidebar');
  const sidebarOverlay = document.getElementById('sidebarOverlay');
  const primaryColorPicker = document.getElementById('primaryColorPicker');
  const accentColorPicker = document.getElementById('accentColorPicker');
  const buttonColorPicker = document.getElementById('buttonColorPicker');
  const textColorPicker = document.getElementById('textColorPicker');
  const resetColors = document.getElementById('resetColors');
  const gradientToggle = document.getElementById('gradientToggle');

  if (!primaryColorPicker || !accentColorPicker || !buttonColorPicker || !textColorPicker) {
    console.error('One or more color picker elements not found');
    return;
  }

  function applyColor(variable, color, storageKey, picker) {
    document.documentElement.style.setProperty(variable, color);
    document.documentElement.style.setProperty(`${variable}-light`, color);
    localStorage.setItem(storageKey, color);
    if (picker) {
      picker.value = color;
    }
  }

  function adjustBrightness(hex, factor) {
    hex = hex.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const newR = Math.min(255, Math.round(r * factor));
    const newG = Math.min(255, Math.round(g * factor));
    const newB = Math.min(255, Math.round(b * factor));
    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
  }

  function loadSavedColors() {
    const savedPrimary = localStorage.getItem('primaryColor');
    const savedAccent = localStorage.getItem('accentColor');
    const savedButton = localStorage.getItem('buttonColor');
    const savedText = localStorage.getItem('textColor');
    const savedGradient = localStorage.getItem('gradientEnabled') === 'true';

    if (savedPrimary) applyColor('--bg-primary', savedPrimary, 'primaryColor', primaryColorPicker);
    if (savedAccent) applyColor('--accent-secondary', savedAccent, 'accentColor', accentColorPicker);
    if (savedButton) applyColor('--accent-primary', savedButton, 'buttonColor', buttonColorPicker);
    if (savedText) applyColor('--text-primary', savedText, 'textColor', textColorPicker);
    
    if (savedGradient) {
      document.body.classList.add('gradient-bg');
      gradientToggle.innerHTML = '<svg class="w-5 h-5" stroke="currentColor" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg> Disable Gradient';
    } else {
      document.body.style.background = 'var(--bg-primary)';
      gradientToggle.innerHTML = '<svg class="w-5 h-5" stroke="currentColor" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg> Enable Gradient';
    }
  }

  loadSavedColors();

  primaryColorPicker.addEventListener('input', () => {
    applyColor('--bg-primary', primaryColorPicker.value, 'primaryColor', primaryColorPicker);
    if (!document.body.classList.contains('gradient-bg')) {
      document.body.style.background = primaryColorPicker.value;
    }
  });

  accentColorPicker.addEventListener('input', () => {
    applyColor('--accent-secondary', accentColorPicker.value, 'accentColor', accentColorPicker);
    applyColor('--accent-hover', adjustBrightness(accentColorPicker.value, 0.9), 'accentHover', null);
  });

  buttonColorPicker.addEventListener('input', () => {
    applyColor('--accent-primary', buttonColorPicker.value, 'buttonColor', buttonColorPicker);
    applyColor('--accent-hover', adjustBrightness(buttonColorPicker.value, 0.9), 'accentHover', null);
  });

  textColorPicker.addEventListener('input', () => {
    applyColor('--text-primary', textColorPicker.value, 'textColor', textColorPicker);
    applyColor('--text-secondary', adjustBrightness(textColorPicker.value, 0.8), 'textSecondary', null);
  });

  resetColors.addEventListener('click', () => {
    const isLight = document.body.classList.contains('light');
    applyColor('--bg-primary', isLight ? '#ffffff' : '#2f3136', 'primaryColor', primaryColorPicker);
    applyColor('--accent-secondary', isLight ? '#5865F2' : '#7289DA', 'accentColor', accentColorPicker);
    applyColor('--accent-primary', isLight ? '#4752C4' : '#5865F2', 'buttonColor', buttonColorPicker);
    applyColor('--text-primary', isLight ? '#2f3136' : '#dcddde', 'textColor', textColorPicker);
    applyColor('--text-secondary', isLight ? '#72767d' : '#b9bbbe', 'textSecondary', null);
    applyColor('--accent-hover', isLight ? '#7289DA' : '#4752C4', 'accentHover', null);
    document.body.classList.remove('gradient-bg');
    document.body.style.background = isLight ? '#ffffff' : '#2f3136';
    gradientToggle.innerHTML = '<svg class="w-5 h-5" stroke="currentColor" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg> Enable Gradient';
    localStorage.setItem('gradientEnabled', 'false');
  });

  gradientToggle.addEventListener('click', () => {
    document.body.classList.toggle('gradient-bg');
    const isGradient = document.body.classList.contains('gradient-bg');
    gradientToggle.innerHTML = isGradient 
      ? '<svg class="w-5 h-5" stroke="currentColor" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg> Disable Gradient'
      : '<svg class="w-5 h-5" stroke="currentColor" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg> Enable Gradient';
    localStorage.setItem('gradientEnabled', isGradient.toString());
    if (!isGradient) {
      document.body.style.background = 'var(--bg-primary)';
    } else {
      document.body.style.background = '';
    }
  });

  themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('light');
    const isLight = document.body.classList.contains('light');
    themeToggle.textContent = isLight ? '🌙' : '☀️';
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
    if (!localStorage.getItem('primaryColor')) {
      applyColor('--bg-primary', isLight ? '#ffffff' : '#2f3136', 'primaryColor', primaryColorPicker);
    }
    if (!localStorage.getItem('accentColor')) {
      applyColor('--accent-secondary', isLight ? '#5865F2' : '#7289DA', 'accentColor', accentColorPicker);
    }
    if (!localStorage.getItem('buttonColor')) {
      applyColor('--accent-primary', isLight ? '#4752C4' : '#5865F2', 'buttonColor', buttonColorPicker);
    }
    if (!localStorage.getItem('textColor')) {
      applyColor('--text-primary', isLight ? '#2f3136' : '#dcddde', 'textColor', textColorPicker);
    }
    if (!document.body.classList.contains('gradient-bg')) {
      document.body.style.background = 'var(--bg-primary)';
    }
    themeToggle.classList.add('spin');
    setTimeout(() => themeToggle.classList.remove('spin'), 400);
  });

  if (localStorage.getItem('theme') !== 'light') {
    document.body.classList.remove('light');
    localStorage.setItem('theme', 'dark');
    themeToggle.textContent = '☀️';
  } else {
    document.body.classList.add('light');
    themeToggle.textContent = '🌙';
  }

  hamburger.addEventListener('click', () => {
    sidebar.classList.toggle('active');
    sidebar.classList.toggle('hidden');
    document.body.classList.toggle('sidebar-open');
    hamburger.classList.toggle('active');
    hamburger.setAttribute('aria-label', sidebar.classList.contains('active') ? 'Close menu' : 'Open menu');
  });

  sidebarOverlay.addEventListener('click', () => {
    sidebar.classList.remove('active');
    sidebar.classList.add('hidden');
    document.body.classList.remove('sidebar-open');
    hamburger.classList.remove('active');
    hamburger.setAttribute('aria-label', 'Open menu');
  });

  const $ = sel => document.querySelector(sel);

  const helpModal = $('#helpModal');
  const aboutModal = $('#aboutModal');
  const historyModal = $('#historyModal');
  const openHelpBtn = $('#openHelp');
  const openAboutBtn = $('#openAbout');
  const openHistoryBtn = $('#openHistory');
  const helpClose = $('#helpClose');
  const aboutClose = $('#aboutClose');
  const historyClose = $('#historyClose');

  openHelpBtn.addEventListener('click', () => helpModal.showModal());
  openAboutBtn.addEventListener('click', () => aboutModal.showModal());
  openHistoryBtn.addEventListener('click', () => {
    renderHistory();
    historyModal.showModal();
  });
  helpClose.addEventListener('click', () => helpModal.close());
  aboutClose.addEventListener('click', () => aboutModal.close());
  historyClose.addEventListener('click', () => historyModal.close());

  const input = $('#imdbInput');
  const select = $('#serverSelect');
  const frame = $('#movieFrame');
  const playerContainer = $('#playerContainer');
  const watchBtn = $('#watchBtn');
  const fullscreenBtn = $('#fullscreenBtn');
  const trendingResults = $('#trendingResults');
  const searchResults = $('#searchResults');
  const trendingHeading = $('#trendingHeading');
  const searchHeading = $('#searchHeading');
  const trendingEmpty = $('#trendingEmpty');
  const searchEmpty = $('#searchEmpty');
  const statusText = $('#statusText');
  const suggestionsDiv = $('#suggestions');
  const historyList = $('#historyList');
  const copyBtn = $('#copyBtn');
  const movieInfo = $('#movieInfo');
  const movieTitle = $('#movieTitle');
  const toggleInfo = $('#toggleInfo');
  const extraInfo = $('#extraInfo');
  const releaseDate = $('#releaseDate');
  const movieOverview = $('#movieOverview');
  const movieRating = $('#movieRating');
  const movieCast = $('#movieCast');

  const exitBtn = document.createElement("button");
  exitBtn.textContent = "Exit Fullscreen";
  Object.assign(exitBtn.style, {
    position: "absolute",
    top: "10px",
    right: "10px",
    zIndex: "9999",
    padding: "10px 14px",
    fontSize: "14px",
    background: "#ff4d4d",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    opacity: "0.6",
    display: "none",
    pointerEvents: "auto"
  });

  playerContainer.appendChild(exitBtn);

  fullscreenBtn.addEventListener("click", () => {
    if (playerContainer.requestFullscreen) playerContainer.requestFullscreen();
    else if (playerContainer.webkitRequestFullscreen) playerContainer.webkitRequestFullscreen();
    else if (playerContainer.mozRequestFullScreen) playerContainer.mozRequestFullScreen();
    else if (playerContainer.msRequestFullscreen) playerContainer.msRequestFullscreen();
    exitBtn.style.display = "block";
  });

  exitBtn.addEventListener("click", () => {
    if (document.exitFullscreen) document.exitFullscreen();
    else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
    else if (document.mozCancelFullScreen) document.mozCancelFullScreen();
    else if (document.msExitFullscreen) document.msExitFullscreen();
  });

  function onFsChange() {
    const inFs = document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement;
    exitBtn.style.display = inFs ? "block" : "none";
  }

  document.addEventListener("fullscreenchange", onFsChange);
  document.addEventListener("webkitfullscreenchange", onFsChange);
  document.addEventListener("mozfullscreenchange", onFsChange);
  document.addEventListener("MSFullscreenChange", onFsChange);

  const API_KEY = "6452370c23b5a8497b9a201cf46fba42";
  const TMDB_SEARCH_MOVIE = `https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&query=`;
  const TMDB_SEARCH_TV = `https://api.themoviedb.org/3/search/tv?api_key=${API_KEY}&query=`;
  const TMDB_DETAILS = id => `https://api.themoviedb.org/3/movie/${id}?api_key=${API_KEY}`;
  const TMDB_VIDEOS = (id, type) => `https://api.themoviedb.org/3/${type}/${id}/videos?api_key=${API_KEY}`;
  const TMDB_CREDITS = (id, type) => `https://api.themoviedb.org/3/${type}/${id}/credits?api_key=${API_KEY}`;

  const extractIMDb = (str='') => {
    const m = String(str).match(/tt\d{7,8}/i);
    return m ? m[0] : '';
  };

  function buildURL(server, imdbID, season=null, episode=null) {
    if (season && episode) {
      switch(server) {
        case '2embed': return `https://www.2embed.cc/embedtv/${imdbID}&s=${season}&e=${episode}`;
        case 'vidsrc': return `https://vidsrc.me/embed/tv?imdb=${imdbID}&s=${season}&e=${episode}`;
        case 'vidsrcto': return `https://vidsrc.to/embed/tv/${imdbID}/${season}/${episode}`;
        case 'noads': return `https://vid-src-embeds-no-ads-demo.vercel.app/embed?url=${encodeURIComponent(`https://vidsrc.in/embed/${imdbID}/${season}-${episode}`)}`;
      }
    } else {
      switch(server) {
        case '2embed': return `https://www.2embed.cc/embed/${imdbID}`;
        case 'vidsrc': return `https://vidsrc.me/embed/movie?imdb=${imdbID}`;
        case 'vidsrcto': return `https://vidsrc.to/embed/movie/${imdbID}`;
        case 'noads': return `https://vid-src-embeds-no-ads-demo.vercel.app/embed?url=${encodeURIComponent(`https://vidsrc.in/embed/${imdbID}`)}`;
      }
    }
  }

  const setStatus = (msg) => statusText.textContent = msg;

  async function fetchTitleFromTMDB(imdbID) {
    try {
      const res = await fetch(`https://api.themoviedb.org/3/find/${imdbID}?api_key=${API_KEY}&external_source=imdb_id`);
      const data = await res.json();
      if (data.movie_results?.length) {
        return data.movie_results[0].title;
      } else if (data.tv_results?.length) {
        return data.tv_results[0].name;
      }
      return imdbID;
    } catch (e) {
      console.error("TMDB lookup failed:", e);
      return imdbID;
    }
  }

  function saveHistory(imdbID, title, season=null, episode=null) {
    if (!imdbID || imdbID.toLowerCase().includes("free")) return;

    let history = JSON.parse(localStorage.getItem('watchHistory') || "[]");
    history = history.filter(h => h.imdbID !== imdbID || h.season !== season || h.episode !== episode);

    history.unshift({ imdbID, title, season, episode, time: Date.now() });
    if (history.length > 20) history.pop();

    localStorage.setItem('watchHistory', JSON.stringify(history));
  }

  function renderHistory() {
    let history = JSON.parse(localStorage.getItem('watchHistory') || "[]");
    historyList.innerHTML = "";
    if (!history.length) {
      historyList.innerHTML = "<li>No history yet.</li>";
      return;
    }
    history.forEach(h => {
      const li = document.createElement("li");
      const d = new Date(h.time).toLocaleString();
      li.textContent = h.season && h.episode
        ? `${h.title} — S${h.season}E${h.episode} — ${d}`
        : `${h.title} — ${d}`;
      li.style.cursor = "pointer";
      li.onclick = () => {
        input.value = h.imdbID;
        if (h.season && h.episode) {
          document.getElementById('seasonSelect').value = h.season;
          document.getElementById('episodeSelect').value = h.episode;
          loadFromFields(h.imdbID, h.season, h.episode);
        } else {
          loadFromFields(h.imdbID);
        }
        showInfoByIMDb(h.imdbID);
        historyModal.close();
      };
      historyList.appendChild(li);
    });
  }

  async function loadFromFields(imdbIDOverride, season=null, episode=null) {
    const imdbID = imdbIDOverride || extractIMDb(input.value.trim());
    if (!imdbID) { 
      setStatus('Please enter a valid IMDb ID.');
      alert('Please enter a valid IMDb ID.'); 
      return; 
    }

    if (!select.value) select.value = "2embed";

    const embedURL = buildURL(select.value, imdbID, season, episode);
    if (!embedURL) { 
      setStatus('Unknown server selected.');
      alert('Unknown server selected.'); 
      return; 
    }

    playerContainer.classList.add("active");

    frame.setAttribute("allowfullscreen", "true");
    frame.setAttribute("webkitallowfullscreen", "true");
    frame.setAttribute("mozallowfullscreen", "true");

    const spinner = document.getElementById("spinner");
    spinner.classList.remove("hidden");
    frame.classList.remove("show");

    frame.onload = () => {
      frame.classList.add("show");
      spinner.classList.add("hidden");
    };

    frame.src = embedURL;
    showInfoByIMDb(imdbID);

    fetchTitleFromTMDB(imdbID).then(title => {
      if (season && episode) {
        setStatus(`Now Playing: ${title} — Season ${season}, Episode ${episode}`);
        document.querySelector(".header h1").textContent = `Now Watching: ${title} — S${season}E${episode}`;
      } else {
        setStatus(`Now Playing: ${title}`);
        document.querySelector(".header h1").textContent = `Now Watching: ${title}`;
      }
      if (title && !title.toLowerCase().includes("free")) {
        saveHistory(imdbID, title, season, episode);
      }
    });

    searchResults.innerHTML = "";
    searchHeading.style.display = "none";
    searchEmpty.style.display = "none";
  }

  async function loadSeasons(showData, imdbID) {
    const seasonSelect = document.getElementById("seasonSelect");
    const episodeSelect = document.getElementById("episodeSelect");
    seasonSelect.style.display = "inline-block";
    episodeSelect.style.display = "inline-block";

    seasonSelect.innerHTML = showData.seasons
      .map(s => `<option value="${s.season_number}">Season ${s.season_number}</option>`)
      .join("");

    async function loadEpisodes(seasonNum) {
      const res = await fetch(`https://api.themoviedb.org/3/tv/${showData.id}/season/${seasonNum}?api_key=${API_KEY}`);
      const data = await res.json();
      episodeSelect.innerHTML = data.episodes
        .map(e => `<option value="${e.episode_number}">Ep ${e.episode_number} — ${e.name}</option>`)
        .join("");
    }

    await loadEpisodes(seasonSelect.value);

    seasonSelect.onchange = () => {
      loadEpisodes(seasonSelect.value);
      const season = seasonSelect.value;
      const episode = episodeSelect.value;
      loadFromFields(imdbID, season, episode);
    };

    episodeSelect.onchange = () => {
      const season = seasonSelect.value;
      const episode = episodeSelect.value;
      loadFromFields(imdbID, season, episode);
    };

    watchBtn.style.display = "none";
    loadFromFields(imdbID, seasonSelect.value, episodeSelect.value);
  }

  async function fetchTrailerUrl(tmdbId, type) {
    try {
      const res = await fetch(TMDB_VIDEOS(tmdbId, type));
      const data = await res.json();
      const trailer = data.results.find(v => v.type === "Trailer" && v.site === "YouTube");
      return trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : null;
    } catch (e) {
      console.error("Trailer fetch failed:", e);
      return null;
    }
  }

  async function showInfoByIMDb(imdbID) {
    try {
      const res = await fetch(`https://api.themoviedb.org/3/find/${imdbID}?api_key=${API_KEY}&external_source=imdb_id`);
      const data = await res.json();
      let details, credits, type;
      
      if (data.movie_results?.length) {
        type = 'movie';
        details = await (await fetch(TMDB_DETAILS(data.movie_results[0].id))).json();
        credits = await (await fetch(TMDB_CREDITS(data.movie_results[0].id, 'movie'))).json();
      } else if (data.tv_results?.length) {
        type = 'tv';
        details = await (await fetch(`https://api.themoviedb.org/3/tv/${data.tv_results[0].id}?api_key=${API_KEY}`)).json();
        credits = await (await fetch(TMDB_CREDITS(data.tv_results[0].id, 'tv'))).json();
      } else {
        movieInfo.style.display = 'none';
        return;
      }

      movieInfo.style.display = 'block';
      movieTitle.textContent = details.title || details.name || 'N/A';
      releaseDate.textContent = details.release_date || details.first_air_date || 'N/A';
      movieOverview.textContent = details.overview || 'No description available';
      movieRating.textContent = details.vote_average ? details.vote_average.toFixed(1) : 'N/A';
      movieCast.textContent = credits.cast?.slice(0, 5).map(c => c.name).join(', ') || 'N/A';

      toggleInfo.onclick = () => {
        extraInfo.classList.toggle('show');
        toggleInfo.textContent = extraInfo.classList.contains('show') ? 'Less info' : 'More info';
      };
    } catch (e) {
      console.error("Failed to load movie info:", e);
      movieInfo.style.display = 'none';
    }
  }

  async function searchTMDB(query) {
    if (!query) return;
    setStatus("Searching…");
    trendingResults.innerHTML = "";
    trendingHeading.style.display = "none";
    trendingEmpty.style.display = "none";
    searchResults.innerHTML = "";
    searchHeading.style.display = "block";
    searchEmpty.style.display = "none";

    const [resMovie, resTV] = await Promise.all([
      fetch(TMDB_SEARCH_MOVIE + encodeURIComponent(query)),
      fetch(TMDB_SEARCH_TV + encodeURIComponent(query))
    ]);

    const movies = (await resMovie.json()).results || [];
    const shows = (await resTV.json()).results || [];
    const items = [...movies, ...shows];

    if (!items.length) {
      setStatus("No results found.");
      searchHeading.style.display = "block";
      searchEmpty.style.display = "block";
      return;
    }

    items.forEach(async (m, index) => {
      if (!m.poster_path) return;
      const title = m.title || m.name;
      const year = m.release_date ? m.release_date.split('-')[0] : m.first_air_date ? m.first_air_date.split('-')[0] : 'N/A';
      const rating = m.vote_average ? m.vote_average.toFixed(1) : 'N/A';
      const overview = m.overview ? m.overview.substring(0, 100) + (m.overview.length > 100 ? '...' : '') : 'No description';
      const trailerUrl = await fetchTrailerUrl(m.id, m.title ? 'movie' : 'tv');

      const div = document.createElement("div");
      div.className = "movie";
      div.style.animationDelay = `${0.1 * (index + 1)}s`;
      div.setAttribute('aria-label', `Select ${title} (${year})`);
      div.innerHTML = `
        <img src="https://image.tmdb.org/t/p/w342${m.poster_path}">
        <div class="movie-year">${year}</div>
        <div class="movie-title">${title}</div>
        <div class="movie-overlay">
          <div class="movie-info-hover">
            <p><strong>Rating:</strong> ${rating}</p>
            <p><strong>Release:</strong> ${m.release_date || m.first_air_date || 'N/A'}</p>
            <p>${overview}</p>
          </div>
        </div>
        <div class="movie-tooltip" style="top: -100%; left: 50%; transform: translateX(-50%) translateY(10px);">
          <strong>${title}</strong> (${year})<br>
          <p><strong>Rating:</strong> ${rating}</p>
          <p>${overview}</p>
          ${trailerUrl ? `<a href="${trailerUrl}" target="_blank">Watch Trailer</a>` : '<p>No trailer available</p>'}
        </div>
      `;
      div.onclick = async () => {
        const type = m.title ? "movie" : "tv";
        const detRes = await fetch(`https://api.themoviedb.org/3/${type}/${m.id}?api_key=${API_KEY}&append_to_response=external_ids`);
        const det = await detRes.json();
        const imdbID = det.external_ids?.imdb_id;
        if (imdbID) {
          input.value = imdbID;
          if (type === "tv") {
            await loadSeasons(det, imdbID);
          } else {
            loadFromFields(imdbID);
          }
          searchResults.innerHTML = "";
          searchHeading.style.display = "none";
          searchEmpty.style.display = "none";
        } else {
          setStatus("No IMDb ID found.");
        }
      };
      searchResults.appendChild(div);
    });
    setStatus("Click a title to watch.");
    searchHeading.style.display = "block";
    searchEmpty.style.display = items.length ? "none" : "block";
  }

  async function loadTrending() {
    setStatus("Loading trending…");
    trendingResults.innerHTML = "";
    searchResults.innerHTML = "";
    searchHeading.style.display = "none";
    searchEmpty.style.display = "none";
    trendingHeading.style.display = "block";
    trendingEmpty.style.display = "none";

    const [resMovies, resShows] = await Promise.all([
      fetch(`https://api.themoviedb.org/3/trending/movie/week?api_key=${API_KEY}`),
      fetch(`https://api.themoviedb.org/3/trending/tv/week?api_key=${API_KEY}`)
    ]);

    const movies = (await resMovies.json()).results || [];
    const shows = (await resShows.json()).results || [];
    const items = [...movies, ...shows].slice(0, 20);

    if (!items.length) {
      setStatus("No trending movies or shows found.");
      trendingHeading.style.display = "block";
      trendingEmpty.style.display = "block";
      return;
    }

    items.forEach(async (m, index) => {
      if (!m.poster_path) return;
      const title = m.title || m.name;
      const year = m.release_date ? m.release_date.split('-')[0] : m.first_air_date ? m.first_air_date.split('-')[0] : 'N/A';
      const rating = m.vote_average ? m.vote_average.toFixed(1) : 'N/A';
      const overview = m.overview ? m.overview.substring(0, 100) + (m.overview.length > 100 ? '...' : '') : 'No description';
      const trailerUrl = await fetchTrailerUrl(m.id, m.title ? 'movie' : 'tv');

      const div = document.createElement("div");
      div.className = "movie";
      div.style.animationDelay = `${0.1 * (index + 1)}s`;
      div.setAttribute('aria-label', `Select ${title} (${year})`);
      div.innerHTML = `
        <img src="https://image.tmdb.org/t/p/w342${m.poster_path}">
        <div class="movie-year">${year}</div>
        <div class="movie-title">${title}</div>
        <div class="movie-overlay">
          <div class="movie-info-hover">
            <p><strong>Rating:</strong> ${rating}</p>
            <p><strong>Release:</strong> ${m.release_date || m.first_air_date || 'N/A'}</p>
            <p>${overview}</p>
          </div>
        </div>
        <div class="movie-tooltip" style="top: -100%; left: 50%; transform: translateX(-50%) translateY(10px);">
          <strong>${title}</strong> (${year})<br>
          <p><strong>Rating:</strong> ${rating}</p>
          <p>${overview}</p>
          ${trailerUrl ? `<a href="${trailerUrl}" target="_blank">Watch Trailer</a>` : '<p>No trailer available</p>'}
        </div>
      `;
      div.onclick = async () => {
        const type = m.title ? "movie" : "tv";
        const detRes = await fetch(`https://api.themoviedb.org/3/${type}/${m.id}?api_key=${API_KEY}&append_to_response=external_ids`);
        const det = await detRes.json();
        const imdbID = det.external_ids?.imdb_id;
        if (imdbID) {
          input.value = imdbID;
          if (type === "tv") {
            await loadSeasons(det, imdbID);
          } else {
            loadFromFields(imdbID);
          }
          trendingResults.innerHTML = "";
          trendingHeading.style.display = "none";
          trendingEmpty.style.display = "none";
        } else {
          setStatus("No IMDb ID found.");
        }
      };
      trendingResults.appendChild(div);
    });
    setStatus("Click a title to watch.");
    trendingHeading.style.display = "block";
    trendingEmpty.style.display = items.length ? "none" : "block";
  }

  async function fetchSuggestions(query) {
    if (!query) {
      suggestionsDiv.style.display = 'none';
      return;
    }
    const [resMovie, resTV] = await Promise.all([
      fetch(TMDB_SEARCH_MOVIE + encodeURIComponent(query)),
      fetch(TMDB_SEARCH_TV + encodeURIComponent(query))
    ]);
    const movies = (await resMovie.json()).results || [];
    const shows = (await resTV.json()).results || [];
    const items = [...movies, ...shows].slice(0, 5);

    suggestionsDiv.innerHTML = '';
    if (items.length) {
      items.forEach(item => {
        const div = document.createElement('div');
        div.className = 'suggestion-item';
        div.textContent = item.title || item.name;
        div.onclick = () => {
          input.value = item.title || item.name;
          suggestionsDiv.style.display = 'none';
          searchTMDB(input.value);
        };
        suggestionsDiv.appendChild(div);
      });
      suggestionsDiv.style.display = 'block';
    } else {
      suggestionsDiv.style.display = 'none';
    }
  }

  input.addEventListener('input', () => {
    document.getElementById('seasonSelect').style.display = 'none';
    document.getElementById('episodeSelect').style.display = 'none';
    watchBtn.style.display = 'inline-block';
    fetchSuggestions(input.value.trim());
  });

  input.addEventListener('keypress', e => {
    if (e.key === 'Enter') {
      suggestionsDiv.style.display = 'none';
      searchTMDB(input.value.trim());
    }
  });

  document.getElementById('searchBtn').addEventListener('click', () => {
    suggestionsDiv.style.display = 'none';
    searchTMDB(input.value.trim());
  });

  watchBtn.addEventListener('click', () => {
    loadFromFields();
  });

  copyBtn.addEventListener('click', () => {
    const imdbID = extractIMDb(input.value.trim());
    if (!imdbID) {
      setStatus('Please enter a valid IMDb ID to copy.');
      return;
    }
    const url = buildURL(select.value, imdbID);
    navigator.clipboard.writeText(url).then(() => {
      setStatus('Link copied to clipboard!');
      setTimeout(() => setStatus('Ready. Tip: Press Enter or click Search to find movies.'), 2000);
    }).catch(() => {
      setStatus('Failed to copy link.');
    });
  });

  document.getElementById('homeBtn').addEventListener('click', () => {
    input.value = '';
    frame.src = '';
    playerContainer.classList.remove('active');
    movieInfo.style.display = 'none';
    searchResults.innerHTML = '';
    searchHeading.style.display = 'none';
    searchEmpty.style.display = 'none';
    document.getElementById('seasonSelect').style.display = 'none';
    document.getElementById('episodeSelect').style.display = 'none';
    watchBtn.style.display = 'inline-block';
    setStatus('Ready. Tip: Press Enter or click Search to find movies.');
    loadTrending();
  });

  loadTrending();
});
