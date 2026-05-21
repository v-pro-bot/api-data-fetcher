"use strict";

// ── State ─────────────────────────────────────────────────────────────────────
let activeTab = "weather";

const CONFIG = {
  weather: {
    hint: 'enter a city name like "tokyo" or "new york"',
    placeholder: "london",
    endpoint: (q) => `/api/weather?city=${encodeURIComponent(q)}`,
    render: renderWeather,
  },
  movie: {
    hint: 'enter a movie title like "inception" or "dune"',
    placeholder: "inception",
    endpoint: (q) => `/api/movie?title=${encodeURIComponent(q)}`,
    render: renderMovie,
  },
};

// ── DOM refs ──────────────────────────────────────────────────────────────────
const $ = (id) => document.getElementById(id);

// ── Tab switching ─────────────────────────────────────────────────────────────
function switchTab(tab, el) {
  activeTab = tab;
  document.querySelectorAll(".tab").forEach((t) => {
    t.classList.remove("active");
    t.setAttribute("aria-selected", "false");
  });
  el.classList.add("active");
  el.setAttribute("aria-selected", "true");

  const cfg = CONFIG[tab];
  $("hintText").innerHTML =
    `<span class="hint-keyword">tip:</span> ${cfg.hint}`;
  $("userInput").placeholder = cfg.placeholder;
  $("userInput").value = "";
  setIdle();
  $("userInput").focus();
}

// ── Panel state helpers ───────────────────────────────────────────────────────
function setIdle() {
  $("panelLabel").textContent = "stdout";
  $("panelStatus").textContent = "";
  $("panelStatus").className = "panel-status";
  $("outputBody").innerHTML = `<div class="idle-msg">
       <i class="ti ti-terminal" aria-hidden="true"></i>
       <p>awaiting input — pick a category and run a query</p>
     </div>`;
}

function setLoading(msg) {
  $("panelStatus").textContent = "⟳ fetching...";
  $("panelStatus").className = "panel-status s-loading";
  $("panelLabel").textContent = "stdout — loading";
  $("outputBody").innerHTML = `<div class="idle-msg">
       <i class="ti ti-loader spin" aria-hidden="true"></i>
       <p style="color:var(--amber)">${msg}</p>
     </div>`;
  $("fetchBtn").disabled = true;
}

function setStatus(ok, label) {
  $("panelStatus").textContent = ok ? "✓ 200 OK" : "✗ error";
  $("panelStatus").className = "panel-status " + (ok ? "s-ok" : "s-err");
  $("panelLabel").textContent = label;
  $("fetchBtn").disabled = false;
}

function setError(msg) {
  setStatus(false, "stderr");
  $("outputBody").innerHTML = `<div class="err-box">
       <i class="ti ti-alert-circle" aria-hidden="true"></i>
       <div><strong>Error:</strong> ${msg}</div>
     </div>`;
}

// ── Main fetch dispatcher ─────────────────────────────────────────────────────
async function fetchData() {
  const q = $("userInput").value.trim();
  if (!q) {
    $("userInput").focus();
    return;
  }

  const cfg = CONFIG[activeTab];
  setLoading(`calling Python backend for "${q}"…`);

  try {
    const res = await fetch(cfg.endpoint(q));
    const data = await res.json();

    if (!data.ok) {
      setError(data.error || "Unknown error from server");
      return;
    }
    cfg.render(data);
  } catch (err) {
    setError("Could not reach the Flask server. Is it running on :5000?");
  }
}

// ── Weather renderer ──────────────────────────────────────────────────────────
function renderWeather(d) {
  setStatus(true, `weather — ${d.city}, ${d.country}`);

  const feelClass = d.feels_like > d.temp ? "c-red" : "c-cyan";

  $("outputBody").innerHTML = `
    <div class="fade-in">
      <div class="weather-hero">
        <div class="weather-icon">${d.icon_emoji}</div>
        <div class="weather-temp">${d.temp}°C</div>
        <div class="weather-desc">${d.description} · ${d.city}, ${d.country}</div>
      </div>

      <div class="result-grid">
        <div class="result-card">
          <div class="rc-label">feels like</div>
          <div class="rc-val ${feelClass}">${d.feels_like}°C</div>
        </div>
        <div class="result-card">
          <div class="rc-label">humidity</div>
          <div class="rc-val c-blue">${d.humidity}%</div>
        </div>
        <div class="result-card">
          <div class="rc-label">wind</div>
          <div class="rc-val">${d.wind_kmh} km/h ${d.wind_dir}</div>
        </div>
        <div class="result-card">
          <div class="rc-label">pressure</div>
          <div class="rc-val c-purple">${d.pressure} hPa</div>
        </div>
        <div class="result-card">
          <div class="rc-label">visibility</div>
          <div class="rc-val">${d.visibility_km} km</div>
        </div>
        <div class="result-card">
          <div class="rc-label">cloud cover</div>
          <div class="rc-val c-amber">${d.cloud_pct}%</div>
        </div>
      </div>
    </div>`;
}

// ── Movie renderer ────────────────────────────────────────────────────────────
const TAG_COLORS = ["tag-blue", "tag-purple", "tag-amber", "tag-green"];

function renderMovie(d) {
  setStatus(true, `movie — ${d.title} (${d.year})`);

  const ratingClass =
    d.imdb_rating >= 8 ? "c-green" : d.imdb_rating >= 6 ? "c-amber" : "c-red";

  const genreTags = d.genres
    .map(
      (g, i) =>
        `<span class="tag ${TAG_COLORS[i % TAG_COLORS.length]}">${g}</span>`,
    )
    .join("");

  const posterHTML = d.poster
    ? `<img src="${d.poster}" alt="${d.title} poster"/>`
    : `<i class="ti ti-movie" aria-hidden="true"></i>`;

  const imdbLink = d.imdb_id
    ? `<a href="https://www.imdb.com/title/${d.imdb_id}/" target="_blank" rel="noopener"
          style="color:var(--amber);font-size:11px;text-decoration:none">
         View on IMDb <i class="ti ti-external-link" style="font-size:11px"></i>
       </a>`
    : "";

  $("outputBody").innerHTML = `
    <div class="fade-in">
      <div class="movie-hero">
        <div class="movie-poster">${posterHTML}</div>
        <div class="movie-meta">
          <div class="movie-title">${d.title}</div>
          <div class="tags">${genreTags}</div>
          <div class="movie-plot">${d.plot}</div>
        </div>
      </div>

      <div class="result-grid">
        <div class="result-card">
          <div class="rc-label">imdb rating</div>
          <div class="rc-val big ${ratingClass}">★ ${d.imdb_rating}</div>
        </div>
        <div class="result-card">
          <div class="rc-label">runtime</div>
          <div class="rc-val">${d.runtime}</div>
        </div>
        <div class="result-card">
          <div class="rc-label">year</div>
          <div class="rc-val c-blue">${d.year}</div>
        </div>
        <div class="result-card">
          <div class="rc-label">rated</div>
          <div class="rc-val c-amber">${d.rated}</div>
        </div>
        <div class="result-card" style="grid-column:1/-1">
          <div class="rc-label">director</div>
          <div class="rc-val" style="font-size:14px">${d.director}</div>
        </div>
        <div class="result-card" style="grid-column:1/-1">
          <div class="rc-label">cast</div>
          <div class="rc-val" style="font-size:12px;color:var(--muted)">${d.actors}</div>
        </div>
      </div>

      <div style="margin-top:12px;text-align:right">${imdbLink}</div>
    </div>`;
}
