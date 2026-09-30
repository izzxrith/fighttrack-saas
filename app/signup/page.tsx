"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();
  const [gymName, setGymName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gymName, email, password }),
      });
      const data = await res.json();
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
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <Link href="/" className="font-display text-2xl font-bold tracking-wide">
          FightTrack
        </Link>
        <h1 className="mt-6 text-2xl font-semibold">Create your gym</h1>
        <p className="mt-1 text-canvas-muted">Set up your coach account.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label htmlFor="gymName" className="block text-sm text-canvas-muted mb-1">
              Gym name
            </label>
            <input
              id="gymName"
              required
              value={gymName}
              onChange={(e) => setGymName(e.target.value)}
              placeholder="Iron Corner Boxing"
              className="w-full rounded border border-rope/40 bg-hide px-3 py-2 text-canvas outline-none focus:border-corner"
            />
            <p className="mt-1 text-xs text-canvas-muted">This is the name your fighters will see.</p>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm text-canvas-muted mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded border border-rope/40 bg-hide px-3 py-2 text-canvas outline-none focus:border-corner"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm text-canvas-muted mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={10}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded border border-rope/40 bg-hide px-3 py-2 text-canvas outline-none focus:border-corner"
            />
            <p className="mt-1 text-xs text-canvas-muted">At least 10 characters.</p>
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
            {loading ? "Creating your gym…" : "Create your gym"}
          </button>
        </form>

        <p className="mt-6 text-sm text-canvas-muted">
          Already have a gym?{" "}
          <Link href="/login" className="text-canvas underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}