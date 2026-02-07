"use client";

import { useState } from "react";
import { Link2, Settings, ShieldCheck, UserRound } from "lucide-react";
import { TUser } from "@/lib/definitions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileForm } from "../../profile/_components/profile-form";
import { ProfileOverview } from "../../profile/_components/profile-overview";
import { LinkedAccountsSettings } from "./linked-accounts-settings";
import { PreferencesSettings } from "./preferences-settings";
import { SecuritySettings } from "./security-settings";

type SettingsTabsProps = {
  user: TUser;
};

export function SettingsTabs({ user }: SettingsTabsProps) {
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
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="order-2 space-y-6 xl:order-1">
            <ProfileForm user={user} />
          </div>
          <div className="order-1 space-y-6 xl:order-2">
            <ProfileOverview user={user} />
          </div>
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
