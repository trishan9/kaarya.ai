import { MapPin, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type ExploreJobsHeroProps = {
  title: string;
  description: string;
  searchPlaceholder: string;
  locationPlaceholder: string;
  actionLabel: string;
};

export function ExploreJobsHero({
  title,
  description,
  searchPlaceholder,
  locationPlaceholder,
  actionLabel,
}: ExploreJobsHeroProps) {
  return (
    <section className="relative overflow-hidden rounded-2xl bg-linear-to-r from-[#00629F]/80 to-[#00629F] px-4 py-8 text-white sm:px-8">
      <div className="pointer-events-none absolute left-0 bottom-0 h-8 w-72 rounded-tr-2xl bg-white/10" />
      <div className="pointer-events-none absolute right-0 top-0 h-12 w-48 rounded-bl-2xl rounded-tr-2xl bg-white/10" />
      <div className="pointer-events-none absolute right-0 top-0 h-22 w-32 rounded-tr-2xl rounded-bl-2xl bg-white/10" />

      <div className="relative z-10 space-y-5">
        <div className="max-w-3xl space-y-2">
          <h2 className="text-2xl font-semibold leading-tight">{title}</h2>
          <p className="max-w-2xl text-sm text-white/90">{description}</p>
        </div>

        <form action="/jobs" className="rounded-xl bg-white p-1.5 shadow-sm">
          <div className="grid gap-1 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_130px]">
            <div className="flex items-center gap-2 rounded-lg px-3">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                name="query"
                placeholder={searchPlaceholder}
                className="h-10 border-0 px-0 text-sm shadow-none focus-visible:ring-0 text-foreground"
              />
            </div>

            <div className="flex items-center gap-2 rounded-lg px-3 md:border-l md:border-[#e7e9ee]">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <Input
                name="location"
                placeholder={locationPlaceholder}
                className="h-10 border-0 px-0 text-sm shadow-none focus-visible:ring-0 text-foreground"
              />
            </div>

            <Button
              type="submit"
              className="h-10 rounded-lg bg-primary cursor-pointer text-sm font-semibold text-white hover:bg-primary/90"
            >
              {actionLabel}
            </Button>
          </div>
        </form>
      </div>
    </section>
  );
}
