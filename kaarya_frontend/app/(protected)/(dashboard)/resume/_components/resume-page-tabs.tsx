"use client";

import { FileScan, PenLine } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AtsScannerTab } from "./ats-scanner-tab";
import { ResumeBuilderTab } from "./resume-builder-tab";

export function ResumePageTabs() {
  return (
    <Tabs defaultValue="builder" className="w-full">
      <TabsList className="inline-flex h-9 w-full max-w-xs rounded-lg border border-[#ececf0] bg-white p-1 shadow-sm">
        <TabsTrigger
          value="builder"
          className="h-7 gap-2 rounded-md px-4 text-xs font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm sm:text-sm"
        >
          <PenLine className="h-3.5 w-3.5" />
          AI Builder
        </TabsTrigger>
        <TabsTrigger
          value="scanner"
          className="h-7 gap-2 rounded-md px-4 text-xs font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm sm:text-sm"
        >
          <FileScan className="h-3.5 w-3.5" />
          ATS Scanner
        </TabsTrigger>
      </TabsList>
      <TabsContent value="builder" className="mt-6">
        <ResumeBuilderTab />
      </TabsContent>
      <TabsContent value="scanner" className="mt-6">
        <AtsScannerTab />
      </TabsContent>
    </Tabs>
  );
}
