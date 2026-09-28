import Link from "next/link";

const todaysLog = [
  { fighter: "Karim", work: "Sparring, 6 rounds", minutes: 58 },
  { fighter: "Tan", work: "Heavy bag", minutes: 40 },
  { fighter: "Reza", work: "Roadwork", minutes: 45 },
];

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between px-6 py-5 md:px-12">
        <span className="font-display text-2xl font-bold tracking-wide">FightTrack</span>
        <Link href="/login" className="text-sm text-canvas-muted hover:text-canvas">
          Sign in
        </Link>
      </header>

      <main className="flex-1 grid gap-12 px-6 py-10 md:grid-cols-2 md:items-center md:px-12 md:py-16">
        <section className="max-w-xl">
          <h1 className="font-display text-5xl font-bold leading-[1.05] md:text-7xl">
            Run your fight camp from one place.
          </h1>
          <p className="mt-6 text-lg text-canvas-muted">
            Log sessions, keep every fighter's record, and hand out training plans.
            Each gym's data stays private to that gym.
          </p>
          <Link
            href="/signup"
            className="mt-8 inline-block rounded bg-corner px-6 py-3 font-medium text-canvas hover:brightness-110"
          >
            Create your gym
          </Link>
        </section>

        <section aria-label="Sample training log" className="rounded border border-rope/30 bg-hide p-6">
          <h2 className="font-display text-xl font-semibold">Today's log</h2>
          <table className="mt-4 w-full text-left text-sm">
            <thead className="text-rope">
              <tr>
                <th className="pb-2 font-medium">Fighter</th>
                <th className="pb-2 font-medium">Work</th>
                <th className="pb-2 text-right font-medium">Min</th>
              </tr>
            </thead>
            <tbody>
              {todaysLog.map((row) => (
                <tr key={row.fighter} className="border-t border-rope/20">
                  <td className="py-3">{row.fighter}</td>
                  <td className="py-3 text-canvas-muted">{row.work}</td>
                  <td className="py-3 text-right tabular-nums">{row.minutes}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-4 text-xs text-rope">Sample data</p>
        </section>
      </main>
    </div>
  );
}