import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getMyResumes } from "@/lib/actions/job-actions";
import { getCurrentUser } from "@/lib/dal";
import { Role } from "@/lib/definitions";
import { DashboardHeader } from "../_components/dashboard-header";
import { SettingsTabs } from "./_components/settings-tabs";

export const metadata: Metadata = {
  title: "Settings | Kaarya.ai",
  description: "Manage profile details and connected sign-in methods",
};

const toTrimmedString = (value: unknown) => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

type SettingsPageProps = {
  searchParams?: Promise<{
    tab?: string;
  }>;
};

const resolveInitialTab = (value?: string) => {
  if (value === "security") return "security";
  if (value === "linked-apps") return "linked-apps";
  if (value === "preferences") return "preferences";
  return "profile";
};

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const query = await searchParams;
  const tab = resolveInitialTab(query?.tab);
  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in");
  }

  const isCandidate =
    user.role === Role.USER || user.role === Role.STUDENT || user.role === Role.FACULTY;

  const resumeResponse = isCandidate
    ? await getMyResumes({
        page: 1,
        size: 100,
      })
    : null;

  const rawResumes = Array.isArray(resumeResponse?.data?.resumes)
    ? resumeResponse.data.resumes
    : [];

  const resumeOptions = rawResumes
    .map((resume: Record<string, unknown>) => {
      const id =
        toTrimmedString(resume.id) ?? toTrimmedString(resume._id) ?? null;
      if (!id) return null;

      const fileName = toTrimmedString(resume.fileName) ?? "resume.pdf";
      const previewUrl =
        toTrimmedString(resume.previewUrl) ?? toTrimmedString(resume.fileUrl) ?? undefined;
      const downloadUrl =
        toTrimmedString(resume.downloadUrl) ?? toTrimmedString(resume.fileUrl) ?? undefined;
      const uploadedAt = toTrimmedString(resume.createdAt);

      return {
        id,
        fileName,
        previewUrl,
        downloadUrl,
        uploadedAt,
      };
    })
    .filter(
      (
        item:
          | {
              id: string;
              fileName: string;
              previewUrl?: string;
              downloadUrl?: string;
              uploadedAt: string | null;
            }
          | null,
      ): item is {
        id: string;
        fileName: string;
        previewUrl?: string;
        downloadUrl?: string;
        uploadedAt: string | null;
      } => Boolean(item),
    );

  return (
    <div className="dashboard-stage">
      <div className="dashboard-surface">
        <DashboardHeader title="Settings" />

        <div className="space-y-6 px-3 pb-6 sm:px-4 sm:pb-8">
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

          <SettingsTabs
            user={user}
            resumeOptions={resumeOptions}
            initialTab={tab}
          />
        </div>
      </div>
    </div>
  );
}
