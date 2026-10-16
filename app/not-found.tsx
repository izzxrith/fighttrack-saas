import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center px-6 md:px-12">
      <div className="max-w-md">
        <p className="font-display text-6xl font-bold text-corner">404</p>
        <h1 className="mt-2 text-2xl font-semibold">We couldn&apos;t find that page.</h1>
        <p className="mt-2 text-canvas-muted">
          The link may be old, or the page may have moved.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded bg-corner px-5 py-2.5 text-sm font-medium text-canvas hover:brightness-110"
        >
          Back to FightTrack
        </Link>
      </div>
    </main>
  );
}