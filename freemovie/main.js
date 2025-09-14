// dara diay dawg
// Main script -- thanks to daddygpt and grok frfr

    const $ = sel => document.querySelector(sel);

    const helpModal = $('#helpModal');
    const aboutModal = $('#aboutModal');
    const openHelpBtn = $('#openHelp');
    const openAboutBtn = $('#openAbout');
    const helpClose = $('#helpClose');
    const aboutClose = $('#aboutClose');

    openHelpBtn.addEventListener('click', () => helpModal.showModal());
    openAboutBtn.addEventListener('click', () => aboutModal.showModal());
    helpClose.addEventListener('click', () => helpModal.close());
    aboutClose.addEventListener('click', () => aboutModal.close());

    const input = $('#imdbInput');
    const select = $('#serverSelect');
    const frame = $('#movieFrame');
    const playerContainer = $('#playerContainer');
    const watchBtn = $('#watchBtn');
    const fullscreenBtn = document.getElementById("fullscreenBtn");

    const exitBtn = document.createElement("button");
    exitBtn.textContent = "❌ Exit Fullscreen";
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

    const statusText = $('#statusText');
    const resultsDiv = $('#results');
    const suggestionsDiv = $('#suggestions');

    const API_KEY = "6452370c23b5a8497b9a201cf46fba42";
    const TMDB_SEARCH = "https://api.themoviedb.org/3/search/movie?api_key="+API_KEY+"&query=";
    const TMDB_DETAILS = id => `https://api.themoviedb.org/3/movie/${id}?api_key=${API_KEY}`;

    const extractIMDb = (str='') => {
      const m = String(str).match(/tt\d{7,8}/i);
      return m ? m[0] : '';
    };

    function buildURL(server, imdbID, season=null, episode=null) {
      if (season && episode) {
        switch(server){
          case '2embed': return `https://www.2embed.cc/embedtv/${imdbID}&s=${season}&e=${episode}`;
          case 'vidsrc': return `https://vidsrc.me/embed/tv?imdb=${imdbID}&s=${season}&e=${episode}`;
          case 'vidsrcto': return `https://vidsrc.to/embed/tv/${imdbID}/${season}/${episode}`;
          case 'noads': return `https://vid-src-embeds-no-ads-demo.vercel.app/embed?url=${encodeURIComponent(`https://vidsrc.in/embed/${imdbID}/${season}-${episode}`)}`;
        }
      } else {
        switch(server){
          case '2embed': return `https://www.2embed.cc/embed/${imdbID}`;
          case 'vidsrc': return `https://vidsrc.me/embed/movie?imdb=${imdbID}`;
          case 'vidsrcto': return `https://vidsrc.to/embed/movie/${imdbID}`;
          case 'noads': return `https://vid-src-embeds-no-ads-demo.vercel.app/embed?url=${encodeURIComponent(`https://vidsrc.in/embed/${imdbID}`)}`;
        }
      }
    }

    const setStatus = (msg) => statusText.textContent = msg;

    function loadFromFields(imdbIDOverride, season=null, episode=null) {
      const imdbID = imdbIDOverride || extractIMDb(input.value.trim());
      if (!imdbID) { alert('Please enter a valid IMDb ID.'); return; }

      if (!select.value) select.value = "2embed";

      const embedURL = buildURL(select.value, imdbID, season, episode);
      if (!embedURL) { alert('Unknown server selected.'); return; }

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
        loadFromFields(imdbID, season, episode); // Load directly on change
      };

      episodeSelect.onchange = () => {
        const season = seasonSelect.value;
        const episode = episodeSelect.value;
        loadFromFields(imdbID, season, episode); // Load directly on change
      };

      watchBtn.style.display = "none"; // Hide Watch button for season/episode
      loadFromFields(imdbID, seasonSelect.value, episodeSelect.value); // Initial load
    }

    window.addEventListener('DOMContentLoaded', () => {
      const params = new URLSearchParams(window.location.search);
      const imdb = params.get('imdb');
      if (imdb && window.loadFromFields) {
        document.getElementById('imdbInput').value = imdb;
        window.loadFromFields(imdb);
        showInfoByIMDb(imdb);
      }

      const homeBtn = document.getElementById("homeBtn");
      homeBtn.addEventListener("click", () => {
        const input = document.getElementById("imdbInput");
        const imdbID = input.value.trim();
        const homeURL = "https://vanprojects.netlify.app/freemovie/";
        window.location.href = homeURL;
      });

      const select = document.getElementById('serverSelect');
      const input = document.getElementById('imdbInput');
      select.addEventListener('change', () => {
        const imdbID = input.value.trim();
        if (imdbID && extractIMDb(imdbID)) {
          loadFromFields();
        }
      });
    });

    $('#watchBtn').addEventListener('click', () => loadFromFields());
    $('#searchBtn').addEventListener('click', () => {
      const query = input.value.trim();
      if (extractIMDb(query)) {
        loadFromFields();
      } else {
        searchTMDB(query);
      }
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Enter' && document.activeElement === input) {
        e.preventDefault();
        if (extractIMDb(input.value.trim())) loadFromFields();
        else searchTMDB(input.value.trim());
      }
    });

    const TMDB_SEARCH_MOVIE = "https://api.themoviedb.org/3/search/movie?api_key="+API_KEY+"&query=";
    const TMDB_SEARCH_TV = "https://api.themoviedb.org/3/search/tv?api_key="+API_KEY+"&query=";

    async function searchTMDB(query) {
      if (!query) return;
      setStatus("Searching…");
      resultsDiv.innerHTML = "";

      const [resMovie, resTV] = await Promise.all([
        fetch(TMDB_SEARCH_MOVIE + encodeURIComponent(query)),
        fetch(TMDB_SEARCH_TV + encodeURIComponent(query))
      ]);

      const movies = (await resMovie.json()).results || [];
      const shows = (await resTV.json()).results || [];

      if (!movies.length && !shows.length) {
        setStatus("No results.");
        return;
      }

      [...movies, ...shows].forEach(m => {
        if (!m.poster_path) return;
        const title = m.title || m.name;
        const div = document.createElement("div");
        div.className = "movie";
        div.innerHTML = `<img src="https://image.tmdb.org/t/p/w342${m.poster_path}"><div class="movie-title">${title}</div>`;
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
            resultsDiv.innerHTML = "";
          } else {
            setStatus("No IMDb ID found.");
          }
        };
        resultsDiv.appendChild(div);
      });
      setStatus("Click a title to watch.");
    }

    async function loadTrending() {
      setStatus("Loading trending…");
      resultsDiv.innerHTML = "";

      const [resMovies, resShows] = await Promise.all([
        fetch(`https://api.themoviedb.org/3/trending/movie/week?api_key=${API_KEY}`),
        fetch(`https://api.themoviedb.org/3/trending/tv/week?api_key=${API_KEY}`)
      ]);

      const movies = (await resMovies.json()).results || [];
      const shows = (await resShows.json()).results || [];
      const items = [...movies, ...shows];

      if (!items.length) {
        setStatus("No trending results.");
        return;
      }

      items.forEach(m => {
        if (!m.poster_path) return;
        const title = m.title || m.name;
        const div = document.createElement("div");
        div.className = "movie";
        div.innerHTML = `<img src="https://image.tmdb.org/t/p/w342${m.poster_path}"><div class="movie-title">${title}</div>`;
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
            resultsDiv.innerHTML = "";
            showMovieInfo(m.id, type);
          } else {
            setStatus("No IMDb ID found.");
          }
        };
        resultsDiv.appendChild(div);
      });

      setStatus("Trending this week:");
    }

    const historyModal = $('#historyModal');
    const historyClose = $('#historyClose');
    const openHistoryBtn = $('#openHistory');
    const historyList = $('#historyList');

    openHistoryBtn.addEventListener('click', () => {
      renderHistory();
      historyModal.showModal();
    });
    historyClose.addEventListener('click', () => historyModal.close());

    const TMDB_KEY = "6452370c23b5a8497b9a201cf46fba42";

    async function fetchTitleFromTMDB(imdbID) {
      try {
        const res = await fetch(`https://api.themoviedb.org/3/find/${imdbID}?api_key=${TMDB_KEY}&external_source=imdb_id`);
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
          loadFromFields(h.imdbID);
          showInfoByIMDb(h.imdbID);
          historyModal.close();
        };
        historyList.appendChild(li);
      });
    }

    window.addEventListener("load", () => {
  console.log(`
██   ██ ██    ██ ██    ██ ██ 
██   ██ ██    ██  ██  ██  ██ 
███████ ██    ██   ████   ██ 
██   ██ ██    ██    ██       
██   ██  ██████     ██    ██ 
                                                        
 nag unsa ka diri dawg 😹🫵
`);
});

    window.addEventListener('DOMContentLoaded', () => {
      if (!new URLSearchParams(window.location.search).get('imdb')) {
        loadTrending();
      }
    });

    async function showMovieInfo(tmdbID, type="movie") {
      try {
        const res = await fetch(`https://api.themoviedb.org/3/${type}/${tmdbID}?api_key=${API_KEY}&append_to_response=credits`);
        const data = await res.json();

        const title = data.title || data.name || "Unknown Title";
        const mainOverview = data.overview || "No description available.";
        const mainRating = data.vote_average ? data.vote_average.toFixed(1) : null;

        document.getElementById("movieTitle").textContent = title;
        const movieOverviewEl = document.getElementById("movieOverview");
        if (movieOverviewEl) movieOverviewEl.textContent = mainOverview;
        const movieRatingEl = document.getElementById("movieRating");
        if (movieRatingEl) movieRatingEl.textContent = mainRating ? mainRating : "N/A";

        const castList = (data.credits?.cast || []).slice(0, 5).map(c => c.name).join(", ");
        const movieCastEl = document.getElementById("movieCast");
        if (movieCastEl) movieCastEl.textContent = castList || "Unknown";

        const releaseText = data.release_date || data.first_air_date || "N/A";
        const extraOverviewEl = document.getElementById("overview");
        const releaseEl = document.getElementById("releaseDate");
        const ratingEl = document.getElementById("rating");

        if (releaseEl) releaseEl.textContent = releaseText;
        if (extraOverviewEl) extraOverviewEl.textContent = mainOverview;
        if (ratingEl) ratingEl.textContent = mainRating ? (mainRating + "/10") : "N/A";

        const movieInfoContainer = document.getElementById("movieInfo");
        if (movieInfoContainer) movieInfoContainer.style.display = "block";

        const toggleBtn = document.getElementById("toggleInfo");
        const extraInfo = document.getElementById("extraInfo");
        if (extraInfo) {
          extraInfo.classList.remove("show");
          extraInfo.classList.add("hidden");
        }
        if (toggleBtn) toggleBtn.textContent = "More info ▼";
      } catch (e) {
        console.error("Movie info fetch failed:", e);
        const movieInfoContainer = document.getElementById("movieInfo");
        if (movieInfoContainer) movieInfoContainer.style.display = "none";
      }
    }

    async function showInfoByIMDb(imdbID) {
      try {
        const res = await fetch(`https://api.themoviedb.org/3/find/${imdbID}?api_key=${API_KEY}&external_source=imdb_id`);
        const data = await res.json();

        if (data.movie_results?.length) {
          return showMovieInfo(data.movie_results[0].id, "movie");
        }
        if (data.tv_results?.length) {
          return showMovieInfo(data.tv_results[0].id, "tv");
        }

        document.getElementById("movieInfo").style.display = "none";
      } catch (e) {
        console.error("IMDb->TMDB lookup failed:", e);
      }
    }

    const toggleBtn = document.getElementById("toggleInfo");
    const extraInfo = document.getElementById("extraInfo");

    if (toggleBtn && extraInfo) {
      toggleBtn.addEventListener("click", () => {
        if (extraInfo.classList.contains("show")) {
          extraInfo.classList.remove("show");
          extraInfo.classList.add("hidden");
          toggleBtn.textContent = "More info ▼";
        } else {
          extraInfo.classList.add("show");
          extraInfo.classList.remove("hidden");
          toggleBtn.textContent = "Less info ▲";
        }
      });
    }

    // Predictive Search
    input.addEventListener('input', async () => {
      const query = input.value.trim();
      if (query.length < 1) {
        suggestionsDiv.style.display = 'none';
        return;
      }

      const res = await fetch(`${TMDB_SEARCH_MOVIE}${encodeURIComponent(query)}`);
      const data = await res.json();
      const movies = data.results || [];

      suggestionsDiv.innerHTML = '';
      if (movies.length === 0) {
        const div = document.createElement('div');
        div.className = 'suggestion-item';
        div.textContent = 'No results';
        suggestionsDiv.appendChild(div);
      } else {
        movies.slice(0, 5).forEach(movie => {
          const title = movie.title || movie.name;
          const div = document.createElement('div');
          div.className = 'suggestion-item';
          div.textContent = title;
          div.onclick = () => {
            input.value = title;
            suggestionsDiv.style.display = 'none';
            searchTMDB(title);
          };
          suggestionsDiv.appendChild(div);
        });
      }
      suggestionsDiv.style.display = 'block';
    });

    input.addEventListener('blur', () => {
      setTimeout(() => suggestionsDiv.style.display = 'none', 200);
    });

    input.addEventListener('focus', () => {
      if (input.value.trim().length >= 1) {
        suggestionsDiv.style.display = 'block';
      }
    });
  
