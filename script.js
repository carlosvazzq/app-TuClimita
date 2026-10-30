const DEFAULT_COORDINATES = {
  latitude: 20.97,
  longitude: -89.62,
};
const WEATHER_API_BASE_URL = "https://api.open-meteo.com/v1/forecast";

const weatherCard = document.querySelector(".weather-card");
const loadingMessage = document.querySelector("#weather-loading");
const errorMessage = document.querySelector("#weather-error");
const locationName = document.querySelector("#location-name");
const temperatureValue = document.querySelector("#temperature-value");
const windValue = document.querySelector("#wind-value");
const conditionValue = document.querySelector("#weather-condition");
const weatherIcon = document.querySelector(".weather-icon");

function showWeatherError(message) {
  errorMessage.textContent = message;
  errorMessage.hidden = false;
}

function getUserCoordinates() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({ ...DEFAULT_COORDINATES, isDefault: true });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        resolve({
          latitude: coords.latitude,
          longitude: coords.longitude,
          isDefault: false,
        });
      },
      () => {
        resolve({ ...DEFAULT_COORDINATES, isDefault: true });
      },
      { enableHighAccuracy: false, maximumAge: 300000, timeout: 10000 }
    );
  });
}

function buildWeatherUrl(latitude, longitude) {
  const url = new URL(WEATHER_API_BASE_URL);
  url.search = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current_weather: "true",
  });
  return url;
}

function describeWeatherCode(code) {
  const conditions = {
    0: { description: "Cielo despejado", icon: "☀️" },
    1: { description: "Mayormente despejado", icon: "🌤️" },
    2: { description: "Parcialmente nublado", icon: "⛅" },
    3: { description: "Nublado", icon: "☁️" },
    45: { description: "Niebla", icon: "🌫️" },
    48: { description: "Niebla con escarcha", icon: "🌫️" },
    51: { description: "Llovizna ligera", icon: "🌦️" },
    53: { description: "Llovizna moderada", icon: "🌦️" },
    55: { description: "Llovizna intensa", icon: "🌧️" },
    56: { description: "Llovizna helada ligera", icon: "🌧️" },
    57: { description: "Llovizna helada intensa", icon: "🌧️" },
    61: { description: "Lluvia ligera", icon: "🌦️" },
    63: { description: "Lluvia moderada", icon: "🌧️" },
    65: { description: "Lluvia intensa", icon: "🌧️" },
    66: { description: "Lluvia helada ligera", icon: "🌧️" },
    67: { description: "Lluvia helada intensa", icon: "🌧️" },
    71: { description: "Nevada ligera", icon: "🌨️" },
    73: { description: "Nevada moderada", icon: "🌨️" },
    75: { description: "Nevada intensa", icon: "❄️" },
    77: { description: "Granos de nieve", icon: "❄️" },
    80: { description: "Chubascos ligeros", icon: "🌦️" },
    81: { description: "Chubascos moderados", icon: "🌧️" },
    82: { description: "Chubascos violentos", icon: "🌧️" },
    85: { description: "Chubascos de nieve ligeros", icon: "🌨️" },
    86: { description: "Chubascos de nieve intensos", icon: "❄️" },
    95: { description: "Tormenta eléctrica", icon: "⛈️" },
    96: { description: "Tormenta con granizo ligero", icon: "⛈️" },
    99: { description: "Tormenta con granizo intenso", icon: "⛈️" },
  };

  return conditions[code] ?? {
    description: "Condición no disponible",
    icon: "🌡️",
  };
}

async function loadWeather() {
  loadingMessage.hidden = false;
  errorMessage.hidden = true;
  weatherCard.setAttribute("aria-busy", "true");

  try {
    const coordinates = await getUserCoordinates();
    locationName.textContent = coordinates.isDefault
      ? "Mérida, Yucatán"
      : "Ubicación actual";
    const weatherUrl = buildWeatherUrl(coordinates.latitude, coordinates.longitude);
    const response = await fetch(weatherUrl);

    if (!response.ok) {
      throw new Error(`El servicio respondió con el estado ${response.status}.`);
    }

    const data = await response.json();
    const current = data?.current_weather;

    if (
      !data ||
      Object.keys(data).length === 0 ||
      !current ||
      !Number.isFinite(current.temperature) ||
      !Number.isFinite(current.windspeed) ||
      !Number.isFinite(current.weathercode)
    ) {
      throw new Error("La respuesta del servicio está vacía o no contiene datos meteorológicos válidos.");
    }

    const weather = describeWeatherCode(current.weathercode);
    temperatureValue.textContent = current.temperature;
    windValue.firstChild.textContent = `${current.windspeed} `;
    conditionValue.textContent = weather.description;
    weatherIcon.textContent = weather.icon;
    weatherIcon.setAttribute("aria-label", weather.description);
  } catch (error) {
    console.error("Error al obtener el clima:", error);

    if (!navigator.onLine) {
      showWeatherError("No hay conexión a internet. Revisa tu conexión e inténtalo de nuevo.");
    } else if (error instanceof TypeError) {
      showWeatherError("No se pudo conectar con el servicio del clima. Inténtalo de nuevo más tarde.");
    } else {
      showWeatherError(error.message || "No se pudo obtener el clima. Inténtalo de nuevo más tarde.");
    }
  } finally {
    loadingMessage.hidden = true;
    weatherCard.setAttribute("aria-busy", "false");
  }
}

loadWeather();
