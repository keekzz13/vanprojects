# FreeMovie Embed Player

A lightweight web-based movie & TV show embed player powered by [TMDb](https://www.themoviedb.org/) and various public embed servers.  
It allows searching for movies/TV shows by title or IMDb ID, fetching details from TMDb, and embedding streams from different providers — all in one simple interface.

---

## ✨ Features
- 🔎 **Search** movies and TV shows via TMDb
- 🎬 **Play** via multiple embed servers (`vidsrc`, `2embed`, etc.)
- 📺 **TV support** with season & episode selection
- 🧩 **Trending** fetch on load
- 💾 **Local watch history** (stored in `localStorage`)
- 🖼️ **Movie info display** (overview, cast, rating, release date)
- 📱 **Responsive design** (works on desktop and mobile)
- 🖥️ **Fullscreen support** with exit button

---

## 🛠️ Setup

1. **Fork** this repository or download the source.
2. **Get a TMDb API Key**:
   - Create a free TMDb account.
   - Go to [API Settings](https://www.themoviedb.org/settings/api).
   - Generate an API key (v3 auth).
3. **Edit the script**:
   - Find:
     ```js
     const TMDB_KEY = "YOUR_API_HERE";
     ```
     Replace with your own API key.
4. **Update your site URL**:
   - Find:
     ```js
     const homeURL = "https://vanprojects.netlify.app/freemovie/";
     ```
     Replace with your own deployed site URL so it won't send to my site 😭✌.

5. **Deploy** the files to any static hosting provider (Netlify, Vercel, GitHub Pages, etc.).

---

## ⚠️ Important Notes
- **Never share your TMDb API key publicly** if you’re worried about abuse. Ideally, use a backend proxy.
- This project **does not host any video content** — it embeds from third-party providers.
- Make sure to **credit the original author(s)** if you reuse or modify this project.

---

## 👏 Credits
- Original concept & code: [@vanprojects](https://github.com/aivanleigh25/vanprojects/)
- Helper: daddygpt & grok and me (Aivan)
- Movie data provided by [The Movie Database (TMDb)](https://www.themoviedb.org/)

---

## 📝 License
MIT — feel free to use, modify, and share with attribution.
