"use client";

import { TrendingUp } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function ProfileRating() {
  return (
    <Card className="transition-all hover:shadow-md">
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
            <span className="text-5xl font-bold text-primary">76%</span>

            <Badge variant="secondary" className="mb-2">
              STANDARD
            </Badge>
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed">
            Your profile looks great! Complete more sections to reach a higher
            rating and impress recruiters.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
