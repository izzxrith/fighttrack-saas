"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

type TrainingSession = {
  id: string;
  type: string;
  durationMin: number;
  notes: string | null;
  date: string;
};

type FighterDetail = {
  id: string;
  weightClass: string | null;
  stance: string | null;
  user: { email: string };
  sessions: TrainingSession[];
};

const SESSION_TYPES: { value: string; label: string }[] = [
  { value: "SPARRING", label: "Sparring" },
  { value: "BAG_WORK", label: "Bag work" },
  { value: "CONDITIONING", label: "Conditioning" },
  { value: "TECHNIQUE", label: "Technique" },
  { value: "RECOVERY", label: "Recovery" },
  { value: "OTHER", label: "Other" },
];

const labelFor = (value: string) =>
  SESSION_TYPES.find((t) => t.value === value)?.label ?? value;

const inputClass =
  "w-full rounded border border-rope/40 bg-ink px-3 py-2 text-canvas outline-none focus:border-corner";

export default function FighterPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [fighter, setFighter] = useState<FighterDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [type, setType] = useState("SPARRING");
  const [durationMin, setDurationMin] = useState("60");
  const [date, setDate] = useState(() => new Date().toLocaleDateString("en-CA"));
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadFighter = useCallback(async () => {
    try {
      const res = await fetch(`/api/fighters/${id}`);
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (res.status === 404) {
        setNotFound(true);
        return;
      }
      const data = await res.json();
      setFighter(data.fighter);
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    loadFighter();
  }, [loadFighter]);

  async function handleLogSession(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fighterId: id,
          type,
          durationMin: Number(durationMin),
          notes: notes || undefined,
          date: new Date(`${date}T12:00:00`).toISOString(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error ?? "Couldn't save that session. Nothing was changed.");
        return;
      }
      setNotes("");
      await loadFighter();
    } catch {
      setFormError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setSaving(false);
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
          <p className="text-canvas">We couldn't find that fighter.</p>
          <Link href="/dashboard" className="mt-2 inline-block text-sm text-canvas-muted underline">
            Back to your fighters
          </Link>
        </div>
      </main>
    );
  }

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
                <label htmlFor="date" className="mb-1 block text-sm text-canvas-muted">
                  Date
                </label>
                <input
                  id="date"
                  type="date"
                  required
                  value={date}
                  max={new Date().toLocaleDateString("en-CA")}
                  onChange={(e) => setDate(e.target.value)}
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

            {formError && (
              <p role="alert" className="text-sm text-corner">
                {formError}
              </p>
            )}

            <button
              type="submit"
              disabled={saving}
              className="rounded bg-corner px-4 py-2 text-sm font-medium text-canvas disabled:opacity-60"
            >
              {saving ? "Saving session…" : "Log session"}
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
                    <span className="font-medium">{labelFor(s.type)}</span>
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
      </div>
    </main>
  );
}