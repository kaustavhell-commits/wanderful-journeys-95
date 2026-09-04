import type { Crowd, Destination, Traveler } from "@/data/destinations";

export type Prefs = {
  budget: number;
  duration: number;
  origin: string;
  month: string;
  interests: string[];
  crowd: "Any" | Crowd;
  traveler: Traveler;
};

export type Factor = {
  label: string;
  weight: number;
  score: number;
  reason: string;
};

export type Scored = {
  destination: Destination;
  total: number;
  factors: Factor[];
};

export const WEIGHTS = {
  interest: 30,
  budget: 20,
  duration: 15,
  crowd: 15,
  season: 10,
  traveler: 10,
};

function estimateCost(d: Destination, duration: number) {
  const nights = Math.max(1, duration);
  const travel = Math.round(d.distanceFromKolkata * 4) + 400;
  return d.stay * nights + travel + 600 * nights;
}

export function scoreDestination(d: Destination, p: Prefs): Scored {
  const factors: Factor[] = [];

  // Interest match
  const matched = p.interests.filter((i) => d.tags.includes(i));
  const interestScore = p.interests.length === 0 ? 0.6 : matched.length / p.interests.length;
  factors.push({
    label: "Interest match",
    weight: WEIGHTS.interest,
    score: interestScore,
    reason:
      p.interests.length === 0
        ? "No interests selected — neutral baseline applied"
        : `Matches ${matched.length}/${p.interests.length} interests${matched.length ? `: ${matched.join(", ")}` : ""}`,
  });

  // Budget fit
  const cost = estimateCost(d, p.duration);
  const ratio = cost / Math.max(1, p.budget);
  const budgetScore = ratio <= 0.6 ? 1 : ratio <= 1 ? 0.9 : ratio <= 1.3 ? 0.55 : ratio <= 1.8 ? 0.25 : 0.05;
  factors.push({
    label: "Budget fit",
    weight: WEIGHTS.budget,
    score: budgetScore,
    reason: `Estimated trip cost ≈ ₹${cost.toLocaleString("en-IN")} against your ₹${p.budget.toLocaleString("en-IN")} budget (APPROXIMATE)`,
  });

  // Duration fit
  let durationScore: number;
  let durationReason: string;
  if (p.duration >= d.durMin && p.duration <= d.durMax) {
    durationScore = 1;
    durationReason = `Your ${p.duration}-day trip sits inside the ideal ${d.durMin}–${d.durMax}d window`;
  } else if (p.duration < d.durMin) {
    const gap = d.durMin - p.duration;
    durationScore = gap === 1 ? 0.6 : 0.25;
    durationReason = `Needs at least ${d.durMin}d — your trip is ${gap}d short`;
  } else {
    const gap = p.duration - d.durMax;
    durationScore = gap <= 2 ? 0.7 : 0.4;
    durationReason = `Best explored in ${d.durMin}–${d.durMax}d — you have ${gap}d spare`;
  }
  factors.push({
    label: "Duration fit",
    weight: WEIGHTS.duration,
    score: durationScore,
    reason: durationReason,
  });

  // Crowd preference
  const crowdScore =
    p.crowd === "Any" ? 0.75 : p.crowd === d.crowd ? 1 : neighbourCrowd(p.crowd, d.crowd) ? 0.55 : 0.2;
  factors.push({
    label: "Crowd preference",
    weight: WEIGHTS.crowd,
    score: crowdScore,
    reason:
      p.crowd === "Any"
        ? `No crowd preference — ${d.crowd.toLowerCase()} crowd noted`
        : `You prefer ${p.crowd.toLowerCase()} crowd; this is a ${d.crowd.toLowerCase()}-crowd destination`,
  });

  // Season fit
  const seasonScore = d.seasons.includes(p.month) ? 1 : adjacentMonth(d.seasons, p.month) ? 0.5 : 0.15;
  factors.push({
    label: "Season fit",
    weight: WEIGHTS.season,
    score: seasonScore,
    reason: d.seasons.includes(p.month)
      ? `${p.month} is peak season here (${d.seasons.join(", ")})`
      : `${p.month} is outside the best season (${d.seasons.join(", ")})`,
  });

  // Traveler type
  const travelerScore = d.bestFor === p.traveler ? 1 : compatibleTraveler(p.traveler, d.bestFor) ? 0.65 : 0.35;
  factors.push({
    label: "Traveler type",
    weight: WEIGHTS.traveler,
    score: travelerScore,
    reason: `Best suited for ${d.bestFor.toLowerCase()} travel; you selected ${p.traveler.toLowerCase()}`,
  });

  const total = Math.round(factors.reduce((sum, f) => sum + f.weight * f.score, 0));
  return { destination: d, total, factors };
}

function neighbourCrowd(a: Crowd, b: Crowd) {
  const order: Crowd[] = ["Low", "Medium", "High"];
  return Math.abs(order.indexOf(a) - order.indexOf(b)) === 1;
}

function compatibleTraveler(a: Traveler, b: Traveler) {
  const pairs: Record<Traveler, Traveler[]> = {
    Solo: ["Couple"],
    Couple: ["Solo", "Family"],
    Family: ["Couple"],
    Friends: ["Solo"],
  };
  return pairs[a].includes(b);
}

function adjacentMonth(seasons: string[], month: string) {
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const i = months.indexOf(month);
  if (i < 0) return false;
  const prev = months[(i + 11) % 12] as string;
  const next = months[(i + 1) % 12] as string;
  return seasons.includes(prev) || seasons.includes(next);
}

export function rank(list: Destination[], prefs: Prefs): Scored[] {
  return list.map((d) => scoreDestination(d, prefs)).sort((a, b) => b.total - a.total);
}

export function verdict(total: number) {
  if (total >= 80) return { label: "Excellent match", tone: "high" as const };
  if (total >= 65) return { label: "Strong match", tone: "good" as const };
  if (total >= 50) return { label: "Partial match", tone: "mid" as const };
  return { label: "Weak match", tone: "low" as const };
}
