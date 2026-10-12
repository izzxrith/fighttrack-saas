"use client";

import { useState } from "react";

export type TrainingPlan = {
  id: string;
  title: string;
  description: string | null;
  createdAt: string;
};

const inputClass =
  "w-full rounded border border-rope/40 bg-ink px-3 py-2 text-canvas outline-none focus:border-corner";

type Props = {
  fighterId: string;
  plans: TrainingPlan[];
  isCoach: boolean;
  onSaved: () => Promise<void>;
};

export default function TrainingPlans({ fighterId, plans, isCoach, onSaved }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/training-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fighterId,
          title,
          description: description || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Couldn't save that plan. Nothing was changed.");
        return;
      }
      setTitle("");
      setDescription("");
      await onSaved();
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mt-8">
      <h2 className="font-display text-lg font-semibold">Training plans</h2>

      {isCoach && (
        <form
          onSubmit={handleSubmit}
          className="mt-3 space-y-4 rounded border border-rope/30 bg-hide p-5"
        >
          <div>
            <label htmlFor="planTitle" className="mb-1 block text-sm text-canvas-muted">
              Plan title
            </label>
            <input
              id="planTitle"
              required
              maxLength={120}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Fight camp, week 1"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="planDescription" className="mb-1 block text-sm text-canvas-muted">
              Details (optional)
            </label>
            <textarea
              id="planDescription"
              rows={4}
              maxLength={2000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={"Mon: roadwork 5km\nTue: sparring, 6 rounds\nWed: technique and bag work"}
              className={inputClass}
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-corner">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="rounded bg-corner px-4 py-2 text-sm font-medium text-canvas disabled:opacity-60"
          >
            {saving ? "Assigning plan…" : "Assign plan"}
          </button>
        </form>
      )}

      {plans.length === 0 ? (
        <p className="mt-3 text-canvas-muted">
          {isCoach
            ? "No plans yet. Write the first one above."
            : "Your coach hasn't assigned a plan yet."}
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          {plans.map((p) => (
            <li key={p.id} className="rounded border border-rope/20 bg-hide px-4 py-3">
              <p className="font-medium">{p.title}</p>
              {p.description && (
                <p className="mt-1 whitespace-pre-wrap text-sm text-canvas-muted">
                  {p.description}
                </p>
              )}
              <p className="mt-1 text-xs text-rope">
                Assigned {new Date(p.createdAt).toLocaleDateString()}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}