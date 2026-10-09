"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const inputClass =
  "w-full rounded border border-rope/40 bg-hide px-3 py-2 text-canvas outline-none focus:border-corner";

export default function AddFighterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [weightClass, setWeightClass] = useState("");
  const [stance, setStance] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/fighters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          weightClass: weightClass || undefined,
          stance: stance || undefined,
        }),
      });
      const data = await res.json();
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (!res.ok) {
        setError(data.error ?? "Something went wrong on our side and nothing was saved.");
        return;
      }
      router.push("/dashboard");
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen px-6 py-10 md:px-12">
      <div className="mx-auto max-w-sm">
        <Link href="/dashboard" className="text-sm text-canvas-muted hover:text-canvas">
          Back to fighters
        </Link>
        <h1 className="mt-4 font-display text-2xl font-bold">Add a fighter</h1>
        <p className="mt-1 text-canvas-muted">
          They'll sign in with this email and password.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm text-canvas-muted">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="off"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm text-canvas-muted">
              Temporary password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={10}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
            />
            <p className="mt-1 text-xs text-canvas-muted">At least 10 characters.</p>
          </div>

          <div>
            <label htmlFor="weightClass" className="mb-1 block text-sm text-canvas-muted">
              Weight class (optional)
            </label>
            <input
              id="weightClass"
              maxLength={30}
              value={weightClass}
              onChange={(e) => setWeightClass(e.target.value)}
              placeholder="Welterweight"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="stance" className="mb-1 block text-sm text-canvas-muted">
              Stance (optional)
            </label>
            <select
              id="stance"
              value={stance}
              onChange={(e) => setStance(e.target.value)}
              className={inputClass}
            >
              <option value="">Not set</option>
              <option value="Orthodox">Orthodox</option>
              <option value="Southpaw">Southpaw</option>
              <option value="Switch">Switch</option>
            </select>
          </div>

          {error && (
            <p role="alert" className="text-sm text-corner">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-corner py-2 font-medium text-canvas disabled:opacity-60"
          >
            {loading ? "Adding fighter…" : "Add fighter"}
          </button>
        </form>
      </div>
    </main>
  );
}