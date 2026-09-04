export type WeatherData = {
  current: {
    temperature: number;
    weatherCode: number;
    windSpeed: number;
  };
  daily: {
    time: string[];
    temperatureMax: number[];
    temperatureMin: number[];
    weatherCode: number[];
  };
};

export async function fetchWeather(lat: number, lng: number): Promise<WeatherData> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=3`;
  
  const res = await fetch(url);
  const data = await res.json();
  
  return {
    current: {
      temperature: data.current.temperature_2m,
      weatherCode: data.current.weather_code,
      windSpeed: data.current.wind_speed_10m,
    },
    daily: {
      time: data.daily.time,
      temperatureMax: data.daily.temperature_2m_max,
      temperatureMin: data.daily.temperature_2m_min,
      weatherCode: data.daily.weather_code,
    },
  };
}

export function getWeatherDesc(code: number) {
  if (code === 0) return { label: "Clear sky", icon: "☀️" };
  if (code <= 3) return { label: "Partly cloudy", icon: "⛅" };
  if (code <= 48) return { label: "Foggy", icon: "🌫️" };
  if (code <= 67) return { label: "Rainy", icon: "🌧️" };
  if (code <= 77) return { label: "Snowy", icon: "❄️" };
  if (code <= 82) return { label: "Rain showers", icon: "🌦️" };
  if (code <= 99) return { label: "Thunderstorm", icon: "⛈️" };
  return { label: "Unknown", icon: "❓" };
}
