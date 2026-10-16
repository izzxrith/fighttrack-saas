"use client";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="flex min-h-screen items-center px-6 md:px-12">
      <div className="max-w-md">
        <h1 className="text-2xl font-semibold">Something went wrong on our side.</h1>
        <p className="mt-2 text-canvas-muted">
          Nothing you did caused this, and nothing was lost. Try again in a moment.
        </p>
        <button
          onClick={reset}
          className="mt-6 rounded bg-corner px-5 py-2.5 text-sm font-medium text-canvas hover:brightness-110"
        >
          Try again
        </button>
      </div>
    </main>
  );
}