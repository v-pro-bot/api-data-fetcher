
import os
from dotenv import load_dotenv
load_dotenv()
from flask import Flask, jsonify, render_template, request
from flask_cors import CORS
import requests

app = Flask(__name__)
CORS(app)

# ── API Keys ──────────────────────────────────────────────────────────────────
OWM_KEY  = os.getenv("WEATHER_API_KEY")
OMDB_KEY = os.getenv("MOVIE_API_KEY")

# ── Base URLs ─────────────────────────────────────────────────────────────────
OWM_BASE  = "https://api.openweathermap.org/data/2.5/weather"
OMDB_BASE = "https://www.omdbapi.com/"

# ── Helpers ───────────────────────────────────────────────────────────────────
WIND_DIRS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"]

def wind_direction(degrees: float) -> str:
    return WIND_DIRS[round(degrees / 45) % 8]

def weather_emoji(code: int) -> str:
    if code == 800:  return "☀️"
    if code  > 800:  return "⛅"
    if code >= 700:  return "🌫️"
    if code >= 600:  return "❄️"
    if code >= 500:  return "🌧️"
    if code >= 300:  return "🌦️"
    if code >= 200:  return "⛈️"
    return "🌡️"

def api_error(message: str, status: int = 400):
    return jsonify({"ok": False, "error": message}), status

# ── Routes ────────────────────────────────────────────────────────────────────
@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/weather")
def get_weather():
    city = request.args.get("city", "").strip()
    if not city:
        return api_error("City name is required")

    try:
        resp = requests.get(
            OWM_BASE,
            params={"q": city, "appid": OWM_KEY, "units": "metric"},
            timeout=8,
        )
        data = resp.json()
    except requests.RequestException:
        return api_error("Could not reach weather service", 503)

    if data.get("cod") != 200:
        return api_error(data.get("message", "City not found"), 404)

    main    = data["main"]
    wind    = data.get("wind", {})
    clouds  = data.get("clouds", {})
    weather = data["weather"][0]

    payload = {
        "ok": True,
        "city":        data["name"],
        "country":     data["sys"]["country"],
        "temp":        round(main["temp"]),
        "feels_like":  round(main["feels_like"]),
        "humidity":    main["humidity"],
        "pressure":    main["pressure"],
        "description": weather["description"],
        "icon_emoji":  weather_emoji(weather["id"]),
        "wind_kmh":    round(wind.get("speed", 0) * 3.6, 1),
        "wind_dir":    wind_direction(wind.get("deg", 0)),
        "cloud_pct":   clouds.get("all", 0),
        "visibility_km": round(data.get("visibility", 0) / 1000, 1),
    }
    return jsonify(payload)


@app.route("/api/movie")
def get_movie():
    title = request.args.get("title", "").strip()
    if not title:
        return api_error("Movie title is required")

    try:
        resp = requests.get(
            OMDB_BASE,
            params={"t": title, "apikey": OMDB_KEY, "plot": "short"},
            timeout=8,
        )
        data = resp.json()
    except requests.RequestException:
        return api_error("Could not reach movie database", 503)

    if data.get("Response") == "False":
        return api_error(data.get("Error", "Movie not found"), 404)

    genres = [g.strip() for g in data.get("Genre", "").split(",")][:3]

    try:
        imdb_rating = float(data.get("imdbRating", 0))
    except ValueError:
        imdb_rating = 0.0

    payload = {
        "ok":          True,
        "title":       data.get("Title"),
        "year":        data.get("Year"),
        "rated":       data.get("Rated", "—"),
        "runtime":     data.get("Runtime", "—"),
        "genres":      genres,
        "director":    data.get("Director", "—"),
        "actors":      data.get("Actors", "—"),
        "plot":        data.get("Plot", "No plot available."),
        "poster":      data.get("Poster") if data.get("Poster") != "N/A" else None,
        "imdb_rating": imdb_rating,
        "imdb_id":     data.get("imdbID"),
    }
    return jsonify(payload)


# ── Entry point ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    app.run(debug=True, port=5000)
