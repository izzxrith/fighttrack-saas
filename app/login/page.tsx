"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
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
        <h1 className="mt-6 text-2xl font-semibold">Sign in</h1>
        <p className="mt-1 text-canvas-muted">Welcome back to your gym.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
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
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded border border-rope/40 bg-hide px-3 py-2 text-canvas outline-none focus:border-corner"
            />
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
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-sm text-canvas-muted">
          Don't have a gym yet?{" "}
          <Link href="/signup" className="text-canvas underline">
            Create one
          </Link>
        </p>
      </div>
    </main>
  );
}