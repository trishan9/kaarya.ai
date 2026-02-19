"use client";

import { TrendingUp } from "lucide-react";
import { TUser } from "@/lib/definitions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type ProfileRatingProps = {
  user: TUser;
};

const toPercent = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

export function ProfileRating({ user }: ProfileRatingProps) {
  const profile = user.candidateProfile ?? {};
  const skillsCount = profile.skills?.length ?? 0;
  const educationCount = profile.education?.length ?? 0;
  const experienceCount = profile.experience?.length ?? 0;
  const certificationsCount = profile.certifications?.length ?? 0;

  const completion =
    toPercent(
      (user.name ? 10 : 0) +
        (user.email ? 10 : 0) +
        (user.photo ? 10 : 0) +
        (profile.headline ? 12 : 0) +
        (profile.summary ? 12 : 0) +
        (profile.location ? 8 : 0) +
        (skillsCount > 0 ? 12 : 0) +
        (educationCount > 0 ? 10 : 0) +
        (experienceCount > 0 ? 12 : 0) +
        (certificationsCount > 0 ? 6 : 0) +
        (profile.defaultResumeId ? 8 : 0),
    ) || 0;

  const tierLabel =
    completion >= 85 ? "STRONG" : completion >= 60 ? "GOOD" : "STARTER";
  const summaryText =
    completion >= 85
      ? "Your profile is highly complete and ready for recruiter review."
      : completion >= 60
        ? "Your profile is in good shape. Add remaining sections for stronger matching."
        : "Complete the missing profile sections to improve job recommendations.";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Profile Rating
        </CardTitle>

        <CardDescription>Your profile completion score</CardDescription>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          <div className="flex items-end gap-3">
            <span className="text-5xl font-bold text-primary">{completion}%</span>

            <Badge variant="secondary" className="mb-2">
              {tierLabel}
            </Badge>
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed">
            {summaryText}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
