"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = { fighterId: string; email: string };

export default function RemoveFighter({ fighterId, email }: Props) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRemove() {
    setError(null);
    setRemoving(true);
    try {
      const res = await fetch(`/api/fighters/${fighterId}`, { method: "DELETE" });
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Couldn't remove that fighter. Nothing was changed.");
        return;
      }
      router.push("/dashboard");
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setRemoving(false);
    }
  }

  return (
    <section className="mt-16 border-t border-rope/20 pt-6">
      <h2 className="font-display text-lg font-semibold">Remove fighter</h2>

      {!confirming ? (
        <>
          <p className="mt-2 text-sm text-canvas-muted">
            Removes this fighter from your gym and deletes their login.
          </p>
          <button
            onClick={() => setConfirming(true)}
            className="mt-3 rounded border border-corner px-4 py-2 text-sm text-corner hover:bg-corner hover:text-canvas"
          >
            Remove fighter
          </button>
        </>
      ) : (
        <div className="mt-3 rounded border border-corner/60 bg-hide p-4">
          <p className="break-words text-canvas">Remove {email} from your gym?</p>
          <p className="mt-1 text-sm text-canvas-muted">
            Their sessions, fights, and training plans are deleted too, and their login stops
            working. This can&apos;t be undone.
          </p>

          {error && (
            <p role="alert" className="mt-3 text-sm text-corner">
              {error}
            </p>
          )}

          <div className="mt-4 flex gap-3">
            <button
              onClick={handleRemove}
              disabled={removing}
              className="rounded bg-corner px-4 py-2 text-sm font-medium text-canvas disabled:opacity-60"
            >
              {removing ? "Removing…" : "Remove fighter"}
            </button>
            <button
              onClick={() => setConfirming(false)}
              disabled={removing}
              className="px-2 py-2 text-sm text-canvas-muted hover:text-canvas"
            >
              Keep fighter
            </button>
          </div>
        </div>
      )}
    </section>
  );
}