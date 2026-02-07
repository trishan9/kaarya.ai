import { Metadata } from "next";
import { redirect } from "next/navigation";
import { Settings2 } from "lucide-react";
import { getCurrentUser } from "@/lib/dal";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DashboardHeader } from "../_components/dashboard-header";
import { SettingsTabs } from "./_components/settings-tabs";

export const metadata: Metadata = {
  title: "Settings | Kaarya.ai",
  description: "Manage profile details and connected sign-in methods",
};

export default async function SettingsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in");
  }

  return (
    <div className="min-h-svh">
      <DashboardHeader title="Settings" />

      <div className="space-y-6 px-4 pb-8 sm:px-6">
        {/* <Card className="border-border/70 bg-white">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Settings2 className="h-5 w-5" />
              Account Settings
            </CardTitle>
            <CardDescription>
              Manage your profile, security controls, and linked sign-in apps in
              dedicated tabs.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm text-muted-foreground">
              Use the tabs below to move between settings sections.
            </p>
          </CardContent>
        </Card> */}

        <SettingsTabs user={user} />
      </div>
    </div>
  );
}
