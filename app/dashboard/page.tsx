"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Fighter = {
  id: string;
  weightClass: string | null;
  stance: string | null;
  user: { email: string };
};

export default function DashboardPage() {
  const router = useRouter();
  const [fighters, setFighters] = useState<Fighter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/fighters")
      .then(async (res) => {
        if (res.status === 401) {
          router.push("/login");
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data) setFighters(data.fighters);
      })
      .catch(() => setError("Couldn't load your fighters. Try refreshing the page."))
      .finally(() => setLoading(false));
  }, [router]);

  async function handleSignOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <main className="min-h-screen px-6 py-10 md:px-12">
      <div className="mx-auto max-w-3xl">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold">Your fighters</h1>
            <p className="mt-1 text-canvas-muted">Everyone training under your gym.</p>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard/add-fighter"
              className="rounded bg-corner px-4 py-2 text-sm font-medium text-canvas hover:brightness-110"
            >
              Add a fighter
            </Link>
            <button
              onClick={handleSignOut}
              className="text-sm text-canvas-muted hover:text-canvas"
            >
              Sign out
            </button>
          </div>
        </header>

        {loading && (
          <ul className="mt-8 space-y-3" aria-label="Loading fighters">
            {[0, 1, 2].map((i) => (
              <li key={i} className="h-16 animate-pulse rounded border border-rope/20 bg-hide" />
            ))}
          </ul>
        )}

        {error && (
          <p role="alert" className="mt-8 text-corner">
            {error}
          </p>
        )}

        {!loading && !error && fighters.length === 0 && (
          <div className="mt-8 rounded border border-dashed border-rope/40 p-6">
            <p className="text-canvas">No fighters yet.</p>
            <p className="mt-1 text-canvas-muted">
              Add your first fighter to start logging sessions.
            </p>
          </div>
        )}

          <ul className="mt-6 space-y-3">
          {fighters.map((f) => (
            <li key={f.id}>
              <Link
                href={`/dashboard/fighters/${f.id}`}
                className="block rounded border border-rope/30 bg-hide px-4 py-3 hover:border-rope/60"
              >
                <p className="text-canvas">{f.user.email}</p>
                <p className="mt-0.5 text-sm text-canvas-muted">
                  {f.weightClass ?? "No weight class set"}
                  {f.stance ? ` · ${f.stance}` : ""}
                </p>
              </Link>
            </li>
            ))}
        </ul>
      </div>
    </main>
  );
}