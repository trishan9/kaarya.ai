"use client";

import { BellRing, SlidersHorizontal } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function PreferencesSettings() {
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <Card className="transition-all hover:shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SlidersHorizontal className="h-5 w-5" />
            Preferences
          </CardTitle>
          <CardDescription>
            Configure personal product preferences and dashboard defaults.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3">
          <div className="rounded-lg border p-4">
            <p className="text-sm font-medium">Language & Region</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Preference controls are being prepared.
            </p>
          </div>

          <div className="rounded-lg border p-4">
            <p className="text-sm font-medium">Default Dashboard View</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Save your preferred landing section after sign-in.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="transition-all hover:shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellRing className="h-5 w-5" />
            Notification Settings
          </CardTitle>
          <CardDescription>
            Notification channel controls will be available here.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="rounded-lg border bg-muted/20 p-4 text-sm text-muted-foreground">
            You will be able to choose email and in-app notification preferences from this tab.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
