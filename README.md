# api-data-fetcher

# apifetcher.sh
A terminal-styled API explorer with a **Python + Flask** backend and a clean
HTML / CSS / JS frontend. API keys live on the server — never in the browser.

## Project structure

```
api-fetcher/
├── app.py                  ← Flask server + all API logic
├── requirements.txt        ← Python dependencies
├── templates/
│   └── index.html          ← Jinja2 HTML template
└── static/
    ├── css/
    │   └── style.css       ← All styles
    └── js/
        └── app.js          ← Frontend JS (fetch + render)
```

## Supported APIs

| Tab     | Service        | Key required?      |
|---------|---------------|--------------------|
| Weather | OpenWeatherMap | Yes (free tier)    |
| Movies  | OMDB           | Yes (free tier)    |

## Quick start

### 1. Install dependencies
```bash
pip install -r requirements.txt
```

### 2. Add your API keys
Open `app.py` and replace the placeholder values:

```python
OWM_KEY  = "your_openweathermap_key"   # https://openweathermap.org/api
OMDB_KEY = "your_omdb_key"             # https://www.omdbapi.com/apikey.aspx
```

Both services offer a **free tier** (no credit card required).

### 3. Run the server
```bash
python app.py
```

### 4. Open the app
Visit **http://localhost:5000** in your browser.

## API endpoints

| Method | Endpoint             | Params         |
|--------|----------------------|----------------|
| GET    | `/api/weather`       | `?city=london` |
| GET    | `/api/movie`         | `?title=dune`  |

Both return JSON: `{ "ok": true, ...fields }` on success  
or `{ "ok": false, "error": "message" }` on failure.

## Example responses

### `/api/weather?city=tokyo`
```json
{
  "ok": true,
  "city": "Tokyo",
  "country": "JP",
  "temp": 22,
  "feels_like": 21,
  "humidity": 60,
  "pressure": 1013,
  "description": "clear sky",
  "icon_emoji": "☀️",
  "wind_kmh": 14.4,
  "wind_dir": "N",
  "cloud_pct": 0,
  "visibility_km": 10.0
}
```

### `/api/movie?title=inception`
```json
{
  "ok": true,
  "title": "Inception",
  "year": "2010",
  "rated": "PG-13",
  "runtime": "148 min",
  "genres": ["Action", "Adventure", "Sci-Fi"],
  "director": "Christopher Nolan",
  "actors": "Leonardo DiCaprio, ...",
  "plot": "A thief who steals corporate secrets...",
  "poster": "https://...",
  "imdb_rating": 8.8,
  "imdb_id": "tt1375666"
}
```
