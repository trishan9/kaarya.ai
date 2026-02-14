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
    <section className="relative overflow-hidden rounded-xl border border-[#ececf0] bg-neutral-50 px-4 py-6 sm:px-6 sm:py-7">
      <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl space-y-1.5">
          <h2 className="text-lg font-semibold text-foreground sm:text-xl">
            {title}
          </h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>

        <div className="hidden shrink-0 lg:flex lg:gap-2">
          {previews.map((preview, index) => (
            <div
              key={preview.id}
              className="flex w-24 flex-col rounded-lg border border-[#e5e7eb] bg-white px-2.5 py-2 shadow-sm"
              style={{
                transform: `translateY(${index % 2 === 0 ? "0" : "6px"})`,
              }}
            >
              <div className="mb-1.5 h-1 w-12 rounded-sm bg-primary/80" />
              <div className="space-y-1">
                <div className="h-1 w-full rounded-sm bg-neutral-200" />
                <div className="h-1 w-4/5 rounded-sm bg-neutral-200" />
                <div className="h-1 w-2/3 rounded-sm bg-neutral-200" />
              </div>
              <div className="mt-2 h-1 w-8 rounded-sm bg-primary/50" />
              <p className="mt-1.5 truncate text-[10px] font-medium text-foreground">
                {preview.title}
              </p>
              <p className="truncate text-[9px] text-muted-foreground">
                {preview.subtitle}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
