"use client";

import { useState } from "react";
import { Link2, Settings, ShieldCheck, UserRound } from "lucide-react";
import { Role, TUser } from "@/lib/definitions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileForm } from "./profile/_components/profile-form";
import { ProfileOverview } from "./profile/_components/profile-overview";
import { ProfileRating } from "./profile/_components/profile-rating";
import { BasicProfileForm } from "./profile/_components/basic-profile-form";
import { LinkedAccountsSettings } from "./linked-accounts-settings";
import { PreferencesSettings } from "./preferences-settings";
import { SecuritySettings } from "./security-settings";
import { TSettingsResumeOption } from "./profile/_components/resume-information-form";

const CANDIDATE_ROLES: ReadonlySet<string> = new Set([
  Role.USER,
  Role.STUDENT,
  Role.FACULTY,
]);

type SettingsTabsProps = {
  user: TUser;
  resumeOptions: TSettingsResumeOption[];
};

export function SettingsTabs({ user, resumeOptions }: SettingsTabsProps) {
  const [activeTab, setActiveTab] = useState("profile");

  const isCandidate = CANDIDATE_ROLES.has(user.role ?? "");

  const triggerClass =
    "gap-1.5 cursor-pointer rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm";

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="inline-flex h-10 w-full items-center justify-start gap-0 rounded-lg border bg-background p-0">
        <TabsTrigger value="profile" className={triggerClass}>
          <UserRound className="h-4 w-4" />
          Profile
        </TabsTrigger>

        <TabsTrigger value="security" className={triggerClass}>
          <ShieldCheck className="h-4 w-4" />
          Security
        </TabsTrigger>

        <TabsTrigger value="linked-apps" className={triggerClass}>
          <Link2 className="h-4 w-4" />
          Linked Apps
        </TabsTrigger>

        <TabsTrigger value="preferences" className={triggerClass}>
          <Settings className="h-4 w-4" />
          Preferences
        </TabsTrigger>
      </TabsList>

      <TabsContent value="profile" className="mt-5 space-y-5">
        {isCandidate ? (
          <>
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
              <div className="lg:col-span-3">
                <ProfileOverview user={user} />
              </div>
              <div className="lg:col-span-2">
                <ProfileRating user={user} />
              </div>
            </div>

            <ProfileForm user={user} resumeOptions={resumeOptions} />
          </>
        ) : (
          <>
            <ProfileOverview user={user} />
            <BasicProfileForm user={user} />
          </>
        )}
      </TabsContent>

      <TabsContent value="security" className="mt-5">
        <SecuritySettings user={user} />
      </TabsContent>

      <TabsContent value="linked-apps" className="mt-5">
        <LinkedAccountsSettings user={user} />
      </TabsContent>

      <TabsContent value="preferences" className="mt-5">
        <PreferencesSettings />
      </TabsContent>
    </Tabs>
  );
}
