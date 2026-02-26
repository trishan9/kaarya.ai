"use client";

import { useState } from "react";
import { Link2, Settings, ShieldCheck, UserRound } from "lucide-react";
import { TUser } from "@/lib/definitions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileForm } from "./profile/_components/profile-form";
import { ProfileOverview } from "./profile/_components/profile-overview";
import { ProfileRating } from "./profile/_components/profile-rating";
import { LinkedAccountsSettings } from "./linked-accounts-settings";
import { PreferencesSettings } from "./preferences-settings";
import { SecuritySettings } from "./security-settings";
import { TSettingsResumeOption } from "./profile/_components/resume-information-form";

type SettingsTabsProps = {
  user: TUser;
  resumeOptions: TSettingsResumeOption[];
};

export function SettingsTabs({ user, resumeOptions }: SettingsTabsProps) {
  const [activeTab, setActiveTab] = useState("profile");

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid h-auto w-full grid-cols-2 gap-1 bg-muted p-1 lg:grid-cols-4">
        <TabsTrigger value="profile" className="gap-2">
          <UserRound className="h-4 w-4" />
          <span>Profile</span>
        </TabsTrigger>

        <TabsTrigger value="security" className="gap-2">
          <ShieldCheck className="h-4 w-4" />
          <span>Security</span>
        </TabsTrigger>

        <TabsTrigger value="linked-apps" className="gap-2">
          <Link2 className="h-4 w-4" />
          <span>Linked Apps</span>
        </TabsTrigger>

        <TabsTrigger value="preferences" className="gap-2">
          <Settings className="h-4 w-4" />
          <span>Preferences</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="profile" className="mt-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-8">
            <ProfileOverview user={user} />
          </div>
          <div className="space-y-6 lg:col-span-4">
            <ProfileRating user={user} />
          </div>
        </div>

        <div className="mt-6">
          <ProfileForm user={user} resumeOptions={resumeOptions} />
        </div>
      </TabsContent>

      <TabsContent value="security" className="mt-6">
        <SecuritySettings user={user} />
      </TabsContent>

      <TabsContent value="linked-apps" className="mt-6">
        <LinkedAccountsSettings user={user} />
      </TabsContent>

      <TabsContent value="preferences" className="mt-6">
        <PreferencesSettings />
      </TabsContent>
    </Tabs>
  );
}
