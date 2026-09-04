import { createFileRoute, Link } from "@tanstack/react-router";
import { destinations, type Destination } from "@/data/destinations";
import { scoreDestination, type Prefs } from "@/lib/scoring";
import { cn } from "@/lib/utils";
import { z } from "zod";
import { useState, useEffect } from "react";
import { fetchWeather, getWeatherDesc, type WeatherData } from "@/lib/weather";

const destinationSearchSchema = z.object({
  budget: z.number().optional(),
  duration: z.number().optional(),
  origin: z.string().optional(),
  month: z.string().optional(),
  interests: z.array(z.string()).optional(),
  crowd: z.enum(["Any", "Low", "Medium", "High"]).optional(),
  traveler: z.enum(["Solo", "Couple", "Family", "Friends"]).optional(),
});

export const Route = createFileRoute("/destination/$destinationId")({
  validateSearch: (search) => destinationSearchSchema.parse(search),
  component: DestinationDetail,
});

function inr(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

function getGenImg(
  prompt: string,
  size:
    | "square_hd"
    | "square"
    | "portrait_4_3"
    | "portrait_16_9"
    | "landscape_4_3"
    | "landscape_16_9" = "landscape_4_3",
) {
  return `https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=${encodeURIComponent(prompt)}&image_size=${size}`;
}

function DestinationDetail() {
  const { destinationId } = Route.useParams();
  const search = Route.useSearch();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loadingWeather, setLoadingWeather] = useState(true);

  const destination = destinations.find((d) => d.id === destinationId);

  useEffect(() => {
    if (destination) {
      setLoadingWeather(true);
      fetchWeather(destination.lat, destination.lng)
        .then(setWeather)
        .catch(console.error)
        .finally(() => setLoadingWeather(false));
    }
  }, [destination]);

  if (!destination) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-5 text-center">
        <h1 className="text-4xl font-black">404</h1>
        <p className="mt-2 text-muted-foreground">Destination not found</p>
        <Link to="/" className="mt-6 font-bold text-primary hover:underline">
          ← Back to Search
        </Link>
      </div>
    );
  }

  const prefs: Prefs = {
    budget: search.budget || 10000,
    duration: search.duration || 3,
    origin: search.origin || "Kolkata",
    month: search.month || "Nov",
    interests: search.interests || [],
    crowd: search.crowd || "Any",
    traveler: search.traveler || "Couple",
  };

  const result = scoreDestination(destination, prefs);
  const isSelectedMonthPeak = destination.seasons.includes(prefs.month);

  return (
    <main className="min-h-screen bg-background text-foreground pb-20">
      {/* Hero Section */}
      <div className="relative h-[45vh] w-full overflow-hidden">
        <img src={destination.image} alt={destination.alt} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10">
          <div className="mx-auto max-w-6xl">
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-full bg-background/80 px-4 py-2 text-xs font-bold backdrop-blur hover:bg-background"
            >
              ← Back to Results
            </Link>
            <div className="mt-6 flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
              <div>
                <h1 className="text-4xl font-black tracking-tight sm:text-7xl">
                  {destination.name}
                </h1>
                <p className="mt-2 text-lg font-medium text-muted-foreground sm:text-2xl">
                  {destination.region} · {destination.crowd} Crowd
                </p>
              </div>

              {/* Current Weather Widget */}
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-md sm:w-64">
                {loadingWeather ? (
                  <div className="flex animate-pulse flex-col gap-2">
                    <div className="h-4 w-20 rounded bg-white/20" />
                    <div className="h-8 w-32 rounded bg-white/20" />
                  </div>
                ) : weather ? (
                  <div>
                    <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-white/60">
                      <span>Live Weather</span>
                      <span>{getWeatherDesc(weather.current.weatherCode).icon}</span>
                    </div>
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-4xl font-black text-white">
                        {weather.current.temperature}°
                      </span>
                      <span className="text-sm font-medium text-white/80">
                        {getWeatherDesc(weather.current.weatherCode).label}
                      </span>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-10 grid max-w-6xl gap-10 px-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-16">
          {/* Overview */}
          <section>
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-black">Overview</h2>
              <div className="flex gap-2">
                {destination.tags.slice(0, 3).map((t) => (
                  <span
                    key={t}
                    className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <p className="mt-6 text-xl leading-relaxed text-muted-foreground">
              {destination.description}
            </p>
          </section>

          {/* Dynamic Itinerary */}
          {result.plan && (
            <section className="relative rounded-[2.5rem] border border-border bg-card p-8 shadow-2xl sm:p-12">
              <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
                <h2 className="text-3xl font-black">Your {result.plan.length}-Day Adventure</h2>

                {/* Weather/Season Advice */}
                <div
                  className={cn(
                    "flex items-center gap-3 rounded-2xl px-5 py-3 text-sm font-bold shadow-inner",
                    isSelectedMonthPeak
                      ? "bg-success/10 text-success"
                      : "bg-warning/10 text-warning",
                  )}
                >
                  <span>{isSelectedMonthPeak ? "✨ Perfect Season" : "⚠️ Off-Peak Visit"}</span>
                  <div className="h-4 w-px bg-current/20" />
                  <span className="opacity-80">Selected: {prefs.month}</span>
                </div>
              </div>

              {!isSelectedMonthPeak && (
                <div className="mt-6 rounded-2xl bg-warning/5 p-4 text-sm font-medium text-warning border border-warning/10">
                  💡 Note: {destination.name} is best visited in {destination.seasons.join(", ")}.
                  Expect different weather conditions in {prefs.month}.
                </div>
              )}

              <div className="mt-12 space-y-12">
                {result.plan.map((day) => (
                  <div key={day.day} className="group relative flex flex-col gap-8 sm:flex-row">
                    <div className="flex flex-col items-center">
                      <div className="grid size-14 place-items-center rounded-3xl bg-primary text-xl font-black text-primary-foreground shadow-xl shadow-primary/20 transition-transform group-hover:scale-110">
                        D{day.day}
                      </div>
                      {day.day < result.plan!.length && (
                        <div className="mt-4 w-1 flex-1 rounded-full bg-gradient-to-b from-primary/30 to-transparent" />
                      )}
                    </div>

                    <div className="flex-1 space-y-6">
                      <div className="flex-1">
                        <h3 className="text-2xl font-black text-primary">{day.title}</h3>

                        {/* Daily Weather Forecast */}
                        {weather && (
                          <div className="mt-2 flex items-center gap-2 text-xs font-bold text-muted-foreground">
                            <span>
                              {getWeatherDesc(weather.daily.weatherCode[day.day - 1] || 0).icon}
                            </span>
                            <span>
                              {weather.daily.temperatureMax[day.day - 1] || 0}° /{" "}
                              {weather.daily.temperatureMin[day.day - 1] || 0}°
                            </span>
                            <span>·</span>
                            <span>
                              {getWeatherDesc(weather.daily.weatherCode[day.day - 1] || 0).label}
                            </span>
                          </div>
                        )}

                        <ul className="mt-6 space-y-4">
                          {day.activities.map((act, idx) => (
                            <li
                              key={idx}
                              className="flex items-start gap-4 text-lg font-medium text-muted-foreground/80"
                            >
                              <span className="mt-2.5 size-2 shrink-0 rounded-full bg-primary/60" />
                              {act}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Famous Foods */}
          <section>
            <h2 className="text-3xl font-black">Local Delicacies 🍲</h2>
            <div className="mt-8 flex flex-wrap gap-3">
              {destination.famousFoods.map((food) => (
                <div
                  key={food}
                  className="flex items-center gap-2 rounded-full border border-border bg-surface px-5 py-3 text-sm font-bold text-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/5 hover:shadow-md"
                >
                  <span className="text-lg">🍽️</span>
                  {food}
                </div>
              ))}
            </div>
          </section>

          {/* Best Hotels */}
          <section>
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-3xl font-black">Best Places to Stay 🏨</h2>
              <a
                href={`https://www.google.com/maps/search/hotels+in+${encodeURIComponent(
                  destination.name + ", West Bengal",
                )}/@${destination.lat},${destination.lng},13z`}
                target="_blank"
                rel="noreferrer"
                className="shrink-0 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-xs font-bold text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
              >
                View all on Maps →
              </a>
            </div>
            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              {destination.nearbyHotels.map((h, idx) => {
                const tier =
                  idx === 0
                    ? { label: "Luxury", cls: "bg-accent/15 text-accent border-accent/30" }
                    : idx === 1
                      ? { label: "Premium", cls: "bg-primary/15 text-primary border-primary/30" }
                      : { label: "Value", cls: "bg-success/15 text-success border-success/30" };
                const stars = Math.round(h.rating);
                return (
                  <div
                    key={h.name}
                    className="group rounded-[2rem] border border-border bg-card p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider",
                              tier.cls,
                            )}
                          >
                            {tier.label}
                          </span>
                          <span className="text-[11px] font-bold text-warning">
                            {"★".repeat(stars)}
                            <span className="text-muted-foreground">{"★".repeat(5 - stars)}</span>
                            <span className="ml-1 text-foreground/70">{h.rating.toFixed(1)}</span>
                          </span>
                        </div>
                        <h3 className="mt-3 text-lg font-black">{h.name}</h3>
                        <p className="mt-1 text-xs font-medium text-muted-foreground">
                          Highly rated stay in {destination.name}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          From
                        </p>
                        <p className="text-2xl font-black text-primary">{inr(h.price)}</p>
                        <p className="text-[10px] font-medium text-muted-foreground">per night</p>
                      </div>
                    </div>
                    <div className="mt-5 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                        <span>🛏️</span>
                        <span>Breakfast · WiFi · Parking</span>
                      </div>
                      <a
                        href={`https://www.google.com/maps/search/${encodeURIComponent(
                          h.name + " " + destination.name + " West Bengal",
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-full bg-foreground/5 px-4 py-1.5 text-xs font-bold text-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
                      >
                        Check →
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Infrastructure: Hospitals & Maps */}
          <div className="grid gap-10 sm:grid-cols-2">
            <section>
              <h2 className="text-3xl font-black">Nearby Hospitals 🏥</h2>
              <div className="mt-8 space-y-6">
                <a
                  href={`https://www.google.com/maps/search/hospitals+near+${encodeURIComponent(
                    destination.name + ", West Bengal",
                  )}/@${destination.lat},${destination.lng},12z`}
                  target="_blank"
                  rel="noreferrer"
                  className="group relative block aspect-video w-full overflow-hidden rounded-[2rem] border-4 border-card shadow-lg"
                >
                  <img
                    src={`https://staticmap.openstreetmap.de/staticmap.php?center=${destination.lat},${destination.lng}&zoom=11&size=800x450&markers=${destination.lat},${destination.lng},red-pushpin`}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = getGenImg(
                        `Aerial satellite map view of ${destination.name} West Bengal showing town layout, roads and surrounding area, realistic high detail map`,
                        "landscape_16_9",
                      );
                    }}
                    alt={`Map of ${destination.name} area`}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="pointer-events-none absolute inset-0 flex items-end justify-center bg-gradient-to-t from-background/80 via-transparent to-transparent p-4 opacity-0 transition-opacity group-hover:opacity-100">
                    <span className="rounded-full bg-background px-4 py-2 text-xs font-bold text-primary shadow-lg">
                      🔍 Open Hospitals on Google Maps →
                    </span>
                  </div>
                </a>
                <ul className="space-y-4">
                  {destination.nearbyHospitals.map((h) => (
                    <li
                      key={h}
                      className="flex items-center gap-4 rounded-2xl bg-surface p-4 text-sm font-bold text-muted-foreground border border-border"
                    >
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                        ✚
                      </span>
                      {h}
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-3xl font-black">Travel Route 🚗</h2>
              <div className="mt-8 space-y-6">
                <a
                  href={`https://www.google.com/maps/dir/?api=1&origin=Kolkata,+West+Bengal&destination=${encodeURIComponent(
                    destination.name + ", West Bengal",
                  )}&travelmode=driving`}
                  target="_blank"
                  rel="noreferrer"
                  className="group relative block aspect-video w-full overflow-hidden rounded-[2rem] border-4 border-card shadow-lg"
                >
                  <img
                    src={`https://staticmap.openstreetmap.de/staticmap.php?center=${(22.5726 + destination.lat) / 2},${(88.3639 + destination.lng) / 2}&zoom=${destination.distanceFromKolkata < 200 ? 9 : destination.distanceFromKolkata < 450 ? 8 : 7}&size=800x450&markers=22.5726,88.3639,ol-marker|${destination.lat},${destination.lng},red-pushpin`}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = getGenImg(
                        `Highway road map journey from Kolkata to ${destination.name} West Bengal, showing national highway route, waypoints and road network, realistic cartography`,
                        "landscape_16_9",
                      );
                    }}
                    alt={`Route from Kolkata to ${destination.name}`}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="pointer-events-none absolute inset-0 flex items-end justify-between bg-gradient-to-t from-background/80 via-transparent to-transparent p-4 opacity-0 transition-opacity group-hover:opacity-100">
                    <div className="flex items-center gap-2 rounded-full bg-background px-3 py-1.5 text-[10px] font-bold shadow-lg">
                      <span>📍 Kolkata</span>
                      <span className="text-muted-foreground">→</span>
                      <span>🎯 {destination.name}</span>
                    </div>
                    <span className="rounded-full bg-background px-4 py-2 text-xs font-bold text-primary shadow-lg">
                      🧭 Get Directions →
                    </span>
                  </div>
                </a>
                <div className="rounded-[2rem] bg-primary/5 p-8 border border-primary/10">
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-black text-primary">
                      {destination.distanceFromKolkata}
                    </span>
                    <span className="text-xl font-bold text-primary/60">km from Kolkata</span>
                  </div>
                  <p className="mt-4 text-sm font-medium text-muted-foreground leading-relaxed">
                    Estimated drive time: {Math.round(destination.distanceFromKolkata / 45)}–
                    {Math.round(destination.distanceFromKolkata / 35)} hours via AH1/NH12. We
                    recommend starting early to avoid city traffic.
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="space-y-8">
          <div className="sticky top-24 space-y-8">
            {/* Score & Match */}
            <div className="rounded-[2.5rem] border border-border bg-card p-8 shadow-xl">
              <h3 className="text-xl font-black italic text-primary">Traveloo Match</h3>
              <div className="mt-6">
                <div className="flex items-center justify-between">
                  <span className="text-5xl font-black">{result.total}%</span>
                  <div className="flex flex-col items-end">
                    <span
                      className={cn(
                        "rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest",
                        result.total >= 80
                          ? "bg-success/20 text-success"
                          : "bg-accent/20 text-accent",
                      )}
                    >
                      {result.total >= 80 ? "Perfect" : "Great"}
                    </span>
                    <span className="mt-1 text-xs font-bold text-muted-foreground">
                      Match Score
                    </span>
                  </div>
                </div>
                <div className="mt-6 h-3 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full bg-primary transition-all duration-1000 ease-out"
                    style={{ width: `${result.total}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Budget Breakdown */}
            <div className="rounded-[2.5rem] border border-border bg-card p-8 shadow-xl">
              <h3 className="text-xl font-black">Estimated Cost</h3>
              <div className="mt-8 space-y-5">
                {[
                  { label: "Accommodation", val: destination.stay, sub: "per night" },
                  { label: "Daily Meals", val: 600, sub: "avg. per day" },
                  {
                    label: "Local Travel",
                    val: Math.round(destination.distanceFromKolkata * 4) + 400,
                    sub: "approx. total",
                  },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between">
                    <div>
                      <p className="text-sm font-bold">{item.label}</p>
                      <p className="text-[10px] font-medium text-muted-foreground uppercase">
                        {item.sub}
                      </p>
                    </div>
                    <span className="text-sm font-black">{inr(item.val)}</span>
                  </div>
                ))}

                <div className="mt-4 border-t border-border pt-6 flex items-center justify-between">
                  <span className="text-lg font-black uppercase tracking-tighter">Total Est.</span>
                  <span className="text-3xl font-black text-primary">
                    {inr(
                      (() => {
                        const budgetFactor = result.factors.find((f) => f.label === "Budget fit");
                        if (!budgetFactor) return 0;
                        const match = budgetFactor.reason.match(/₹([\d,]+)/);
                        if (!match || !match[1]) return 0;
                        return parseInt(match[1].replace(/,/g, ""));
                      })(),
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
