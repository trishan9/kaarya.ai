type ResumeBuilderHeroPreview = {
  id: string;
  title: string;
  subtitle: string;
};

export type ResumeBuilderHeroProps = {
  title: string;
  description: string;
  previews: ResumeBuilderHeroPreview[];
};

export function ResumeBuilderHero({
  title,
  description,
  previews,
}: ResumeBuilderHeroProps) {
  return (
    <section className="relative overflow-hidden rounded-2xl bg-linear-to-r from-[#00629F]/80 to-[#00629F] px-4 py-8 text-white sm:px-8">
      <div className="pointer-events-none absolute left-0 bottom-0 h-8 w-72 rounded-tr-2xl bg-white/10" />
      <div className="pointer-events-none absolute right-0 top-0 h-12 w-48 rounded-bl-2xl rounded-tr-2xl bg-white/10" />
      <div className="pointer-events-none absolute right-0 top-0 h-22 w-32 rounded-tr-2xl rounded-bl-2xl bg-white/10" />

      <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl space-y-2">
          <h2 className="text-2xl font-semibold leading-tight">{title}</h2>
          <p className="max-w-3xl text-sm text-white/90">{description}</p>
        </div>

        <div className="hidden lg:flex lg:items-end lg:gap-3">
          {previews.map((preview, index) => (
            <div
              key={preview.id}
              className="w-28 rounded-xl border border-white/20 bg-white p-2 text-[#1f2937] shadow-lg"
              style={{
                transform: `translateY(${index % 2 === 0 ? "0px" : "8px"})`,
              }}
            >
              <div className="mb-2 h-1.5 w-16 rounded bg-[#0b67c2]" />
              <div className="space-y-1">
                <div className="h-1.5 w-full rounded bg-[#dce6f4]" />
                <div className="h-1.5 w-4/5 rounded bg-[#dce6f4]" />
                <div className="h-1.5 w-2/3 rounded bg-[#dce6f4]" />
              </div>
              <div className="mt-3 h-1.5 w-10 rounded bg-[#0b67c2]/70" />
              <p className="mt-2 truncate text-[9px] font-semibold">
                {preview.title}
              </p>
              <p className="truncate text-[8px] text-muted-foreground">
                {preview.subtitle}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
