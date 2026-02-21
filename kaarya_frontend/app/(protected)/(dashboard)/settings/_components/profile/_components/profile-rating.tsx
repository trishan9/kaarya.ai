"use client";

import { Check, Circle } from "lucide-react";
import { TUser } from "@/lib/definitions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { computeProfileRating } from "@/lib/compute-profile-rating";

type ProfileRatingProps = {
  user: TUser;
};

export function ProfileRating({ user }: ProfileRatingProps) {
  const rating = computeProfileRating(user);

  const progressColor =
    rating.completion >= 80
      ? "bg-emerald-500"
      : rating.completion >= 60
        ? "bg-violet-500"
        : rating.completion >= 40
          ? "bg-blue-500"
          : rating.completion >= 20
            ? "bg-amber-500"
            : "bg-zinc-400";

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle>Profile Rating</CardTitle>
        <CardDescription>Completeness for recruiters</CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex items-baseline gap-2">
          <span className={`text-3xl font-bold tabular-nums ${rating.tierColor}`}>
            {rating.completion}%
          </span>
          <Badge className={`border-0 text-[10px] ${rating.tierBadgeClass}`}>
            {rating.tierLabel}
          </Badge>
        </div>

        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${progressColor}`}
            style={{ width: `${rating.completion}%` }}
          />
        </div>

        {rating.categories.length > 0 && (
          <div className="space-y-1">
            {rating.categories.map((cat) => {
              const isComplete = cat.score >= cat.maxScore;
              const pct =
                cat.maxScore > 0
                  ? Math.round((cat.score / cat.maxScore) * 100)
                  : 0;
              return (
                <div key={cat.label} className="flex items-center gap-2">
                  {isComplete ? (
                    <Check className="h-3 w-3 text-emerald-500 shrink-0" />
                  ) : (
                    <Circle className="h-3 w-3 text-muted-foreground/30 shrink-0" />
                  )}
                  <span className="text-[11px] flex-1 truncate">
                    {cat.label}
                  </span>
                  <div className="w-14 h-1 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isComplete ? "bg-emerald-500" : progressColor
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-[10px] tabular-nums text-muted-foreground w-7 text-right">
                    {pct}%
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
