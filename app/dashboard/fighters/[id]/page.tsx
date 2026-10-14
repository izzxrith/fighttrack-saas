"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import TrainingPlans, { type TrainingPlan } from "./TrainingPlans";

type TrainingSession = {
  id: string;
  type: string;
  durationMin: number;
  notes: string | null;
  date: string;
};

type FightRecord = {
  id: string;
  opponent: string;
  result: string;
  date: string;
  weightClass: string | null;
  notes: string | null;
};

type FighterDetail = {
  id: string;
  weightClass: string | null;
  stance: string | null;
  user: { email: string };
  sessions: TrainingSession[];
  fightRecords: FightRecord[];
  trainingPlans: TrainingPlan[];
};

const SESSION_TYPES: { value: string; label: string }[] = [
  { value: "SPARRING", label: "Sparring" },
  { value: "BAG_WORK", label: "Bag work" },
  { value: "CONDITIONING", label: "Conditioning" },
  { value: "TECHNIQUE", label: "Technique" },
  { value: "RECOVERY", label: "Recovery" },
  { value: "OTHER", label: "Other" },
];

const RESULTS: { value: string; label: string }[] = [
  { value: "WIN", label: "Win" },
  { value: "LOSS", label: "Loss" },
  { value: "DRAW", label: "Draw" },
  { value: "NO_CONTEST", label: "No contest" },
];

const sessionLabel = (value: string) =>
  SESSION_TYPES.find((t) => t.value === value)?.label ?? value;
const resultLabel = (value: string) =>
  RESULTS.find((r) => r.value === value)?.label ?? value;

const inputClass =
  "w-full rounded border border-rope/40 bg-ink px-3 py-2 text-canvas outline-none focus:border-corner";

const today = () => new Date().toLocaleDateString("en-CA");

export default function FighterPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [fighter, setFighter] = useState<FighterDetail | null>(null);
  const [viewerRole, setViewerRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  // session form
  const [type, setType] = useState("SPARRING");
  const [durationMin, setDurationMin] = useState("60");
  const [sessionDate, setSessionDate] = useState(today);
  const [notes, setNotes] = useState("");
  const [savingSession, setSavingSession] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);

  // fight form
  const [opponent, setOpponent] = useState("");
  const [result, setResult] = useState("WIN");
  const [fightDate, setFightDate] = useState(today);
  const [fightWeightClass, setFightWeightClass] = useState("");
  const [fightNotes, setFightNotes] = useState("");
  const [savingFight, setSavingFight] = useState(false);
  const [fightError, setFightError] = useState<string | null>(null);

  // Fetches on first load and again whenever reloadKey changes. State is only
  // set inside the promise callbacks, never synchronously in the effect body.
  useEffect(() => {
    let ignore = false;

    fetch(`/api/fighters/${id}`)
      .then(async (res) => {
        if (ignore) return;
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        if (res.status === 404) {
          setNotFound(true);
          return;
        }
        const data = await res.json();
        if (ignore) return;
        setFighter(data.fighter);
        setViewerRole(data.viewerRole);
      })
      .catch(() => {
        if (!ignore) setNotFound(true);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [id, router, reloadKey]);

  // Call this after saving anything to refresh the page data.
  const reload = useCallback(async () => {
    setReloadKey((k) => k + 1);
  }, []);

  async function handleLogSession(e: React.FormEvent) {
    e.preventDefault();
    setSessionError(null);
    setSavingSession(true);
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fighterId: id,
          type,
          durationMin: Number(durationMin),
          notes: notes || undefined,
          date: new Date(`${sessionDate}T12:00:00`).toISOString(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSessionError(data.error ?? "Couldn't save that session. Nothing was changed.");
        return;
      }
      setNotes("");
      await reload();
    } catch {
      setSessionError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setSavingSession(false);
    }
  }

  async function handleLogFight(e: React.FormEvent) {
    e.preventDefault();
    setFightError(null);
    setSavingFight(true);
    try {
      const res = await fetch("/api/fight-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fighterId: id,
          opponent,
          result,
          date: new Date(`${fightDate}T12:00:00`).toISOString(),
          weightClass: fightWeightClass || undefined,
          notes: fightNotes || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFightError(data.error ?? "Couldn't save that fight. Nothing was changed.");
        return;
      }
      setOpponent("");
      setFightWeightClass("");
      setFightNotes("");
      await reload();
    } catch {
      setFightError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setSavingFight(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen px-6 py-10 md:px-12">
        <div className="mx-auto max-w-2xl space-y-4">
          <div className="h-8 w-64 animate-pulse rounded bg-hide" />
          <div className="h-40 animate-pulse rounded bg-hide" />
        </div>
      </main>
    );
  }

  if (notFound || !fighter) {
    return (
      <main className="min-h-screen px-6 py-10 md:px-12">
        <div className="mx-auto max-w-2xl">
          <p className="text-canvas">We couldn&apos;t find that fighter.</p>
          <Link href="/dashboard" className="mt-2 inline-block text-sm text-canvas-muted underline">
            Back to your fighters
          </Link>
        </div>
      </main>
    );
  }

  const wins = fighter.fightRecords.filter((r) => r.result === "WIN").length;
  const losses = fighter.fightRecords.filter((r) => r.result === "LOSS").length;
  const draws = fighter.fightRecords.filter((r) => r.result === "DRAW").length;

  return (
    <main className="min-h-screen px-6 py-10 md:px-12">
      <div className="mx-auto max-w-2xl">
        <Link href="/dashboard" className="text-sm text-canvas-muted hover:text-canvas">
          Back to fighters
        </Link>

        <h1 className="mt-4 font-display text-3xl font-bold">{fighter.user.email}</h1>
        <p className="mt-1 text-canvas-muted">
          {fighter.weightClass ?? "No weight class set"}
          {fighter.stance ? ` · ${fighter.stance}` : ""}
        </p>
        <p className="mt-3 font-display text-2xl font-semibold tabular-nums">
          {wins}-{losses}-{draws}
          <span className="ml-2 text-sm font-normal text-canvas-muted">W-L-D</span>
        </p>

        {/* Training plans */}
        <TrainingPlans
          fighterId={fighter.id}
          plans={fighter.trainingPlans}
          isCoach={viewerRole === "COACH"}
          onSaved={reload}
        />

        {/* Sessions */}
        <section className="mt-8 rounded border border-rope/30 bg-hide p-5">
          <h2 className="font-display text-lg font-semibold">Log a session</h2>

          <form onSubmit={handleLogSession} className="mt-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label htmlFor="type" className="mb-1 block text-sm text-canvas-muted">
                  Type
                </label>
                <select
                  id="type"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className={inputClass}
                >
                  {SESSION_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="duration" className="mb-1 block text-sm text-canvas-muted">
                  Minutes
                </label>
                <input
                  id="duration"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={600}
                  required
                  value={durationMin}
                  onChange={(e) => setDurationMin(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="sessionDate" className="mb-1 block text-sm text-canvas-muted">
                  Date
                </label>
                <input
                  id="sessionDate"
                  type="date"
                  required
                  value={sessionDate}
                  max={today()}
                  onChange={(e) => setSessionDate(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label htmlFor="notes" className="mb-1 block text-sm text-canvas-muted">
                Notes (optional)
              </label>
              <textarea
                id="notes"
                rows={3}
                maxLength={2000}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Six rounds, good pace, left hook needs work"
                className={inputClass}
              />
            </div>

            {sessionError && (
              <p role="alert" className="text-sm text-corner">
                {sessionError}
              </p>
            )}

            <button
              type="submit"
              disabled={savingSession}
              className="rounded bg-corner px-4 py-2 text-sm font-medium text-canvas disabled:opacity-60"
            >
              {savingSession ? "Saving session…" : "Log session"}
            </button>
          </form>
        </section>

        <section className="mt-10">
          <h2 className="font-display text-lg font-semibold">Session history</h2>

          {fighter.sessions.length === 0 ? (
            <p className="mt-3 text-canvas-muted">
              No sessions logged yet. Log the first one above.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {fighter.sessions.map((s) => (
                <li key={s.id} className="rounded border border-rope/20 bg-hide px-4 py-3">
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="font-medium">{sessionLabel(s.type)}</span>
                    <span className="text-sm tabular-nums text-canvas-muted">
                      {s.durationMin} min
                    </span>
                  </div>
                  {s.notes && (
                    <p className="mt-1 whitespace-pre-wrap text-sm text-canvas-muted">{s.notes}</p>
                  )}
                  <p className="mt-1 text-xs text-rope">
                    {new Date(s.date).toLocaleDateString()}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Fights */}
        <section className="mt-12 rounded border border-rope/30 bg-hide p-5">
          <h2 className="font-display text-lg font-semibold">Log a fight</h2>

          <form onSubmit={handleLogFight} className="mt-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="opponent" className="mb-1 block text-sm text-canvas-muted">
                  Opponent
                </label>
                <input
                  id="opponent"
                  required
                  maxLength={120}
                  value={opponent}
                  onChange={(e) => setOpponent(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="result" className="mb-1 block text-sm text-canvas-muted">
                  Result
                </label>
                <select
                  id="result"
                  value={result}
                  onChange={(e) => setResult(e.target.value)}
                  className={inputClass}
                >
                  {RESULTS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="fightDate" className="mb-1 block text-sm text-canvas-muted">
                  Date
                </label>
                <input
                  id="fightDate"
                  type="date"
                  required
                  value={fightDate}
                  max={today()}
                  onChange={(e) => setFightDate(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="fightWeightClass" className="mb-1 block text-sm text-canvas-muted">
                  Weight class (optional)
                </label>
                <input
                  id="fightWeightClass"
                  maxLength={30}
                  value={fightWeightClass}
                  onChange={(e) => setFightWeightClass(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label htmlFor="fightNotes" className="mb-1 block text-sm text-canvas-muted">
                Notes (optional)
              </label>
              <textarea
                id="fightNotes"
                rows={2}
                maxLength={2000}
                value={fightNotes}
                onChange={(e) => setFightNotes(e.target.value)}
                placeholder="Won by decision, 3 rounds"
                className={inputClass}
              />
            </div>

            {fightError && (
              <p role="alert" className="text-sm text-corner">
                {fightError}
              </p>
            )}

            <button
              type="submit"
              disabled={savingFight}
              className="rounded bg-corner px-4 py-2 text-sm font-medium text-canvas disabled:opacity-60"
            >
              {savingFight ? "Saving fight…" : "Log fight"}
            </button>
          </form>
        </section>

        <section className="mt-10">
          <h2 className="font-display text-lg font-semibold">Fight record</h2>

          {fighter.fightRecords.length === 0 ? (
            <p className="mt-3 text-canvas-muted">
              No fights logged yet. Log the first one above.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {fighter.fightRecords.map((r) => (
                <li key={r.id} className="rounded border border-rope/20 bg-hide px-4 py-3">
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="font-medium">vs {r.opponent}</span>
                    <span className="text-sm font-medium">{resultLabel(r.result)}</span>
                  </div>
                  {r.weightClass && (
                    <p className="mt-1 text-sm text-canvas-muted">{r.weightClass}</p>
                  )}
                  {r.notes && (
                    <p className="mt-1 whitespace-pre-wrap text-sm text-canvas-muted">{r.notes}</p>
                  )}
                  <p className="mt-1 text-xs text-rope">
                    {new Date(r.date).toLocaleDateString()}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}