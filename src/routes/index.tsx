import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  destinations,
  INTERESTS,
  MONTHS,
  REGIONS,
  type Crowd,
  type Destination,
  type Traveler,
} from "@/data/destinations";
import { rank, verdict, WEIGHTS, type Prefs, type Scored } from "@/lib/scoring";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Traveloo — Find Your Perfect West Bengal Destination" },
      {
        name: "description",
        content:
          "A personalized travel decision engine that scores all 33 West Bengal destinations dynamically and explains exactly why each one matches your trip.",
      },
      { property: "og:title", content: "Traveloo — West Bengal Travel Decision Engine" },
      {
        property: "og:description",
        content:
          "Dynamic scoring, full explainability, dataset-backed matches across 33 West Bengal destinations.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

const BUDGETS = [5000, 10000, 20000, 40000, 60000, 100000];
const DURATIONS = [1, 2, 3, 5, 7, 10];
const CROWDS: Array<"Any" | Crowd> = ["Any", "Low", "Medium", "High"];
const TRAVELERS: Traveler[] = ["Solo", "Couple", "Family", "Friends"];

function inr(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

function Chip({
  active,
  onClick,
  children,
  className,
}: {
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-lg border px-4 py-2 text-sm font-semibold transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground shadow-[0_6px_20px_-8px_var(--primary)]"
          : "border-border bg-secondary/60 text-foreground/85 hover:border-primary/50 hover:bg-secondary",
        className,
      )}
    >
      {children}
    </button>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3">
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-xl bg-accent text-lg font-black text-accent-foreground">
            T
          </div>
          <div>
            <p className="text-lg font-extrabold tracking-tight">TRAVELOO</p>
            <p className="text-xs text-muted-foreground">Don't Just Search. Decide.</p>
          </div>
        </div>
        <span className="hidden items-center gap-2 rounded-full border border-border bg-secondary/60 px-3 py-1.5 text-xs font-medium text-muted-foreground sm:inline-flex">
          <span className="size-1.5 rounded-full bg-success" />
          Dataset-backed · 33 WB Destinations
        </span>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="hero-surface border-b border-border/60 px-5 pb-14 pt-16 text-center">
      <span className="inline-block rounded-full border border-primary/40 bg-primary/15 px-4 py-1.5 text-sm font-semibold text-accent">
        🗺️ Personalized Travel Decision Engine · West Bengal
      </span>
      <h1 className="mx-auto mt-6 max-w-4xl text-4xl font-black leading-[1.05] tracking-tight sm:text-6xl">
        Find Your Perfect
        <br />
        <span className="text-gradient-sky">West Bengal Destination</span>
      </h1>
      <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg">
        Tell us your preferences. Our engine scores all 33 destinations dynamically and shows you
        exactly why each one matches — or doesn't.
      </p>
      <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-7 gap-y-2 text-sm text-muted-foreground">
        {[
          "Dynamic scoring — no hardcoded results",
          "Full explainability for every match",
          "Dataset-backed from WB_Support_Local",
        ].map((f) => (
          <li key={f} className="flex items-center gap-2">
            <span className="text-success">✓</span>
            {f}
          </li>
        ))}
      </ul>
    </section>
  );
}

function Stepper({ step, onStep }: { step: number; onStep: (n: number) => void }) {
  const labels = ["Trip Basics", "Your Interests", "Travel Style"];
  return (
    <div className="flex items-center gap-3">
      {labels.map((label, i) => (
        <div key={label} className="flex flex-1 items-center gap-3 last:flex-none">
          <button
            type="button"
            onClick={() => onStep(i + 1)}
            className={cn(
              "grid size-8 shrink-0 place-items-center rounded-full text-sm font-bold transition-colors",
              step === i + 1
                ? "bg-primary text-primary-foreground"
                : step > i + 1
                  ? "bg-success/25 text-success"
                  : "bg-secondary text-muted-foreground",
            )}
          >
            {i + 1}
          </button>
          {i < labels.length - 1 ? (
            <span className="h-px flex-1 bg-border" />
          ) : (
            <span className="text-sm font-medium text-muted-foreground">{labels[step - 1]}</span>
          )}
        </div>
      ))}
    </div>
  );
}

function ScoreBar({ value }: { value: number }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
      <div
        className={cn(
          "h-full rounded-full",
          value >= 80
            ? "bg-success"
            : value >= 65
              ? "bg-primary"
              : value >= 50
                ? "bg-warning"
                : "bg-destructive",
        )}
        style={{ width: `${Math.max(3, value)}%` }}
      />
    </div>
  );
}

function ResultCard({ result, rankIndex }: { result: Scored; rankIndex: number }) {
  const [open, setOpen] = useState(rankIndex === 0);
  const d = result.destination;
  const v = verdict(result.total);
  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex flex-col gap-4 p-5 sm:flex-row">
        <img
          src={d.image}
          alt={d.alt}
          loading="lazy"
          className="h-36 w-full rounded-xl object-cover sm:w-52"
        />
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-secondary px-2 py-0.5 text-xs font-semibold text-muted-foreground">
              #{rankIndex + 1}
            </span>
            <h3 className="text-xl font-bold">{d.name}</h3>
            <span className="text-xs text-muted-foreground">{d.region}</span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">{d.description}</p>
          <div className="mt-4 flex items-center gap-3">
            <ScoreBar value={result.total} />
            <span className="w-28 shrink-0 text-right text-sm font-bold">
              {result.total}
              <span className="text-muted-foreground">/100</span>
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs">
            <span
              className={cn(
                "font-semibold",
                v.tone === "high"
                  ? "text-success"
                  : v.tone === "good"
                    ? "text-accent"
                    : v.tone === "mid"
                      ? "text-warning"
                      : "text-destructive",
              )}
            >
              {v.label}
            </span>
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              className="font-semibold text-accent hover:underline"
            >
              {open ? "▲ Hide breakdown" : "▼ Why this score?"}
            </button>
          </div>
        </div>
      </div>
      {open && (
        <div className="border-t border-border bg-surface px-5 py-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Score breakdown
          </p>
          <ul className="space-y-3">
            {result.factors.map((f) => (
              <li key={f.label}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold">
                    {f.label}{" "}
                    <span className="text-xs font-normal text-muted-foreground">({f.weight}%)</span>
                  </span>
                  <span className="text-sm font-semibold">
                    {Math.round(f.weight * f.score)}/{f.weight}
                  </span>
                </div>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${f.score * 100}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{f.reason}</p>
              </li>
            ))}
          </ul>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase text-muted-foreground">Top attractions</p>
              <p className="mt-1 text-sm">{d.attractions.join(" · ")}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-muted-foreground">Local experiences</p>
              <p className="mt-1 text-sm">{d.local.join(" · ")}</p>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}

function DestinationCard({ d }: { d: Destination }) {
  const [open, setOpen] = useState(false);
  const crowdIcon = d.crowd === "High" ? "🏙️" : d.crowd === "Medium" ? "🏘️" : "🌾";
  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-colors hover:border-primary/50">
      <div className="relative">
        <img src={d.image} alt={d.alt} loading="lazy" className="h-44 w-full object-cover" />
        <span className="absolute left-3 top-3 rounded-md bg-background/85 px-2 py-1 text-xs font-semibold backdrop-blur">
          {d.region}
        </span>
        <span className="absolute right-3 top-3 rounded-md bg-background/85 px-2 py-1 text-xs font-semibold backdrop-blur">
          {crowdIcon} {d.crowd} Crowd
        </span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-lg font-bold">{d.name}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{d.description}</p>
        <dl className="mt-4 grid grid-cols-3 gap-2 rounded-xl border border-border bg-surface p-3 text-center">
          <div>
            <dt className="text-[11px] uppercase text-muted-foreground">Stay/Night</dt>
            <dd className="text-sm font-bold">{inr(d.stay)}+</dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase text-muted-foreground">Best For</dt>
            <dd className="text-sm font-bold">{d.bestFor}</dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase text-muted-foreground">Duration</dt>
            <dd className="text-sm font-bold">
              {d.durMin}–{d.durMax}d
            </dd>
          </div>
        </dl>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {d.tags.slice(0, 5).map((t) => (
            <span
              key={t}
              className="rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-muted-foreground"
            >
              {t}
            </span>
          ))}
          {d.tags.length > 5 && (
            <span className="rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-muted-foreground">
              +{d.tags.length - 5}
            </span>
          )}
        </div>
        <div className="mt-3 text-xs text-muted-foreground">
          <span className="font-semibold text-foreground/80">Best Season</span>{" "}
          {d.seasons.join(" · ")}
        </div>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="mt-4 self-start text-sm font-semibold text-accent hover:underline"
        >
          {open ? "▲ Less Details" : "▼ More Details"}
        </button>
        {open && (
          <div className="mt-3 space-y-2 border-t border-border pt-3 text-sm">
            <p>
              <span className="font-semibold">Attractions:</span> {d.attractions.join(", ")}
            </p>
            <p>
              <span className="font-semibold">Local experiences:</span> {d.local.join(", ")}
            </p>
            <p>
              <span className="font-semibold">Distance from Kolkata:</span>{" "}
              {d.distanceFromKolkata} km
            </p>
          </div>
        )}
      </div>
    </article>
  );
}

function Home() {
  const [step, setStep] = useState(1);
  const [budget, setBudget] = useState(10000);
  const [customBudget, setCustomBudget] = useState("");
  const [duration, setDuration] = useState(3);
  const [origin, setOrigin] = useState("Kolkata");
  const [month, setMonth] = useState("Nov");
  const [interests, setInterests] = useState<string[]>([]);
  const [crowd, setCrowd] = useState<"Any" | Crowd>("Any");
  const [traveler, setTraveler] = useState<Traveler>("Couple");
  const [results, setResults] = useState<Scored[] | null>(null);

  const [region, setRegion] = useState("All Regions");
  const [interestFilter, setInterestFilter] = useState("All Interests");

  const prefs: Prefs = { budget, duration, origin, month, interests, crowd, traveler };

  const filtered = useMemo(
    () =>
      destinations.filter(
        (d) =>
          (region === "All Regions" || d.region === region) &&
          (interestFilter === "All Interests" || d.tags.includes(interestFilter)),
      ),
    [region, interestFilter],
  );

  function toggleInterest(i: string) {
    setInterests((cur) => (cur.includes(i) ? cur.filter((x) => x !== i) : [...cur, i]));
  }

  function runEngine() {
    setResults(rank(destinations, prefs));
    setTimeout(() => {
      document.getElementById("results")?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <Header />
      <Hero />

      <section className="mx-auto -mt-8 max-w-4xl px-5">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-2xl sm:p-8">
          <Stepper step={step} onStep={setStep} />

          {step === 1 && (
            <div className="mt-7 space-y-7">
              <div>
                <h2 className="text-xl font-bold">Trip Basics</h2>
                <p className="text-sm text-muted-foreground">
                  Set your budget, duration, and travel details
                </p>
              </div>

              <div>
                <p className="mb-2 text-sm font-semibold">💰 Total Budget (INR)</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-6">
                  {BUDGETS.map((b) => (
                    <Chip
                      key={b}
                      active={budget === b && customBudget === ""}
                      onClick={() => {
                        setBudget(b);
                        setCustomBudget("");
                      }}
                    >
                      {inr(b)}
                      {b === 100000 ? "+" : ""}
                    </Chip>
                  ))}
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <label htmlFor="custom-budget" className="text-sm text-muted-foreground">
                    Custom:
                  </label>
                  <input
                    id="custom-budget"
                    inputMode="numeric"
                    value={customBudget}
                    placeholder="Enter amount in ₹"
                    onChange={(e) => {
                      const raw = e.target.value.replace(/[^0-9]/g, "");
                      setCustomBudget(raw);
                      if (raw) setBudget(Number(raw));
                    }}
                    className="flex-1 rounded-lg border border-input bg-secondary/50 px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:border-primary"
                  />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Selected: {inr(budget)} — used to estimate budget fit (APPROXIMATE)
                </p>
              </div>

              <div>
                <p className="mb-2 text-sm font-semibold">📅 Trip Duration</p>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                  {DURATIONS.map((d) => (
                    <Chip key={d} active={duration === d} onClick={() => setDuration(d)}>
                      {d === 10 ? "10+ Days" : d === 1 ? "1 Day" : `${d} Days`}
                    </Chip>
                  ))}
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="origin" className="mb-2 block text-sm font-semibold">
                    📍 Starting Location
                  </label>
                  <input
                    id="origin"
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    className="w-full rounded-lg border border-input bg-secondary/50 px-3 py-2.5 text-sm outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <p className="mb-2 text-sm font-semibold">🗓️ Travel Month</p>
                  <div className="grid grid-cols-6 gap-1.5">
                    {MONTHS.map((m) => (
                      <Chip
                        key={m}
                        active={month === m}
                        onClick={() => setMonth(m)}
                        className="px-0 py-1.5 text-xs"
                      >
                        {m}
                      </Chip>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Chip active onClick={() => setStep(2)}>
                  Next: Your Interests →
                </Chip>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="mt-7 space-y-7">
              <div>
                <h2 className="text-xl font-bold">Your Interests</h2>
                <p className="text-sm text-muted-foreground">
                  Pick everything that matters — interests carry the highest weight (30%)
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {INTERESTS.map((i) => (
                  <Chip key={i} active={interests.includes(i)} onClick={() => toggleInterest(i)}>
                    {i}
                  </Chip>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {interests.length === 0
                  ? "No interests selected — a neutral baseline will be applied."
                  : `Selected ${interests.length}: ${interests.join(", ")}`}
              </p>
              <div className="flex justify-between">
                <Chip onClick={() => setStep(1)}>← Back</Chip>
                <Chip active onClick={() => setStep(3)}>
                  Next: Travel Style →
                </Chip>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="mt-7 space-y-7">
              <div>
                <h2 className="text-xl font-bold">Travel Style</h2>
                <p className="text-sm text-muted-foreground">
                  Who's travelling and how much company do you want?
                </p>
              </div>
              <div>
                <p className="mb-2 text-sm font-semibold">🧳 Traveler Type</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {TRAVELERS.map((t) => (
                    <Chip key={t} active={traveler === t} onClick={() => setTraveler(t)}>
                      {t}
                    </Chip>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 text-sm font-semibold">👥 Crowd Preference</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {CROWDS.map((c) => (
                    <Chip key={c} active={crowd === c} onClick={() => setCrowd(c)}>
                      {c}
                    </Chip>
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap justify-between gap-3">
                <Chip onClick={() => setStep(2)}>← Back</Chip>
                <Chip active onClick={runEngine} className="px-6">
                  🚀 Score all 33 destinations
                </Chip>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {[
            {
              icon: "⚖️",
              title: "Weighted Scoring",
              body: `Interest ${WEIGHTS.interest}% · Budget ${WEIGHTS.budget}% · Duration ${WEIGHTS.duration}% · Crowd ${WEIGHTS.crowd}% · Season ${WEIGHTS.season}% · Traveler ${WEIGHTS.traveler}%`,
            },
            {
              icon: "🔍",
              title: "Full Explainability",
              body: "See exactly why each destination scored what it did — no black box",
            },
            {
              icon: "📊",
              title: "Dataset-Backed",
              body: "Scores derived from WB_Support_Local dataset — attractions, stays, guides & crafts",
            },
          ].map((c) => (
            <div key={c.title} className="rounded-2xl border border-border bg-card p-5">
              <p className="text-2xl">{c.icon}</p>
              <h3 className="mt-2 font-bold">{c.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{c.body}</p>
            </div>
          ))}
        </div>
      </section>

      {results && (
        <section id="results" className="mx-auto mt-16 max-w-4xl px-5">
          <p className="text-sm font-semibold text-accent">🎯 Your Ranked Matches</p>
          <h2 className="mt-1 text-3xl font-black tracking-tight">
            All {destinations.length} destinations scored
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {inr(budget)} · {duration} day(s) · from {origin || "—"} · {month} ·{" "}
            {traveler.toLowerCase()} · {crowd.toLowerCase()} crowd
            {interests.length ? ` · ${interests.join(", ")}` : ""}
          </p>
          <div className="mt-6 space-y-4">
            {results.map((r, i) => (
              <ResultCard key={r.destination.id} result={r} rankIndex={i} />
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto mt-20 max-w-6xl px-5 pb-20">
        <div className="text-center">
          <p className="text-sm font-semibold text-accent">🗺️ All 33 West Bengal Destinations</p>
          <h2 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">
            Explore Every Destination
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground">
            Browse facts, attractions, best seasons, traveler suitability, and local experiences for
            all destinations in our dataset.
          </p>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <select
            aria-label="Filter by region"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="rounded-lg border border-input bg-secondary/60 px-3 py-2 text-sm outline-none focus:border-primary"
          >
            {["All Regions", ...REGIONS].map((r) => (
              <option key={r} value={r}>
                📍 {r}
              </option>
            ))}
          </select>
          <select
            aria-label="Filter by interest"
            value={interestFilter}
            onChange={(e) => setInterestFilter(e.target.value)}
            className="rounded-lg border border-input bg-secondary/60 px-3 py-2 text-sm outline-none focus:border-primary"
          >
            {["All Interests", ...INTERESTS].map((i) => (
              <option key={i} value={i}>
                🎯 {i}
              </option>
            ))}
          </select>
        </div>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Showing {filtered.length} of {destinations.length} destinations
        </p>

        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((d) => (
            <DestinationCard key={d.id} d={d} />
          ))}
        </div>
      </section>

      <footer className="border-t border-border bg-surface px-5 py-8 text-center text-sm text-muted-foreground">
        <p className="font-semibold text-foreground">TRAVELOO — Don't Just Search. Decide.</p>
        <p className="mt-1">
          Dataset-backed decision engine for West Bengal travel · Scores are approximate estimates.
        </p>
      </footer>
    </main>
  );
}
