import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type JobCompanyOverviewCardProps = {
  title: string;
  companyName: string;
  companyLocation: string;
  companyIndustry: string;
  companySize: string;
  companyDescription: string;
  profileActionLabel: string;
  profileHref: string;
  logoText: string;
  logoClassName?: string;
};

export function JobCompanyOverviewCard({
  title,
  companyName,
  companyLocation,
  companyIndustry,
  companySize,
  companyDescription,
  profileActionLabel,
  profileHref,
  logoText,
  logoClassName,
}: JobCompanyOverviewCardProps) {
  return (
    <Card className="gap-4 rounded-2xl border border-[#ececf0] bg-white p-4 shadow-sm sm:p-5">
      <h3 className="text-2xl font-semibold text-foreground">{title}</h3>

      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-lg font-bold text-white",
            logoClassName,
          )}
        >
          {logoText}
        </div>
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold text-foreground">
            {companyName}
          </p>
          <p className="truncate text-sm text-muted-foreground">{companyLocation}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 text-xs">
        <span className="rounded-md bg-neutral-100 px-2.5 py-1 font-medium text-foreground">
          {companyIndustry}
        </span>
        <span className="rounded-md bg-neutral-100 px-2.5 py-1 font-medium text-foreground">
          {companySize}
        </span>
      </div>

      <p className="text-sm leading-6 text-muted-foreground">{companyDescription}</p>

      <Button
        asChild
        variant="outline"
        className="h-10 rounded-xl border-[#d8dde4] bg-[#e9f2fb] text-sm font-semibold text-primary hover:bg-[#deecfa]"
      >
        <Link href={profileHref}>{profileActionLabel}</Link>
      </Button>
    </Card>
  );
}
import Link from "next/link";
