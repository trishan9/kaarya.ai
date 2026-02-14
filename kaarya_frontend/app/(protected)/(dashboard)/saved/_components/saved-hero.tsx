export type SavedHeroStat = {
  id: string;
  label: string;
  value: string;
};

export type SavedHeroProps = {
  title: string;
  description: string;
  lastUpdatedLabel: string;
  stats: SavedHeroStat[];
};

export function SavedHero({
  title,
  description,
  lastUpdatedLabel,
  stats,
}: SavedHeroProps) {
  return (
    <section className="relative overflow-hidden rounded-2xl bg-linear-to-r from-[#00629F]/80 to-[#00629F] px-4 py-8 text-white sm:px-8">
      <div className="pointer-events-none absolute left-0 bottom-0 h-8 w-72 rounded-tr-2xl bg-white/10" />
      <div className="pointer-events-none absolute right-0 top-0 h-12 w-48 rounded-bl-2xl rounded-tr-2xl bg-white/10" />
      <div className="pointer-events-none absolute right-0 top-0 h-22 w-32 rounded-tr-2xl rounded-bl-2xl bg-white/10" />

      <div className="relative z-10 space-y-5">
        <div className="max-w-3xl space-y-2">
          <h2 className="text-2xl font-semibold leading-tight">{title}</h2>
          <p className="max-w-2xl text-sm text-white/90">{description}</p>
          <p className="text-xs text-white/80">{lastUpdatedLabel}</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.id}
              className="rounded-xl border border-white/20 bg-white/10 px-3 py-2.5 backdrop-blur-sm"
            >
              <div className="text-xs text-white/80">{stat.label}</div>
              <div className="text-xl font-semibold leading-tight">{stat.value}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
