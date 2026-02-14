import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { DashboardHeader } from "../../_components/dashboard-header";
import { OverviewHeaderActions } from "../../overview/_components/overview-header-actions";
import { CreateInterviewForm } from "./_components/create-interview-form";
import { VoiceInterviewCreatePanel } from "./_components/voice-interview-create-panel";
import { getCurrentUser } from "@/lib/dal";
import { Role } from "@/lib/definitions";
import { Button } from "@/components/ui/button";
import { listCollegeWorkspaces } from "@/lib/actions/college-actions";
import { listRecruiterWorkspaces } from "@/lib/actions/company-actions";
import { Badge } from "@/components/ui/badge";
import {
  extractCollegeWorkspaces,
  extractRecruiterWorkspaces,
  extractWorkspaceRows,
} from "@/lib/workspaces";

export default async function CreateInterviewPage() {
  const currentUser = await getCurrentUser();
  const isCandidateRole =
    currentUser?.role === Role.USER || currentUser?.role === Role.STUDENT;
  const recruiterWorkspacesResponse =
    currentUser?.role === Role.RECRUITER
      ? await listRecruiterWorkspaces({ page: 1, size: 50 })
      : null;
  const collegeWorkspacesResponse =
    currentUser?.role === Role.COLLEGE
      ? await listCollegeWorkspaces({ page: 1, size: 50 })
      : null;

  const recruiterWorkspaces = extractRecruiterWorkspaces(
    extractWorkspaceRows(recruiterWorkspacesResponse),
  ).map((workspace) => ({
    id: workspace.company.id,
    name: workspace.company.name,
  }));
  const collegeWorkspaces = extractCollegeWorkspaces(
    extractWorkspaceRows(collegeWorkspacesResponse),
  ).map((workspace) => ({
    id: workspace.college.id,
    name: workspace.college.name,
  }));

  return (
    <div className="min-h-svh bg-neutral-100 p-2 sm:p-4 lg:pl-0 lg:p-5">
      <div className="rounded-xl bg-white sm:rounded-2xl">
        <DashboardHeader
          title="Create Interview"
          actions={<OverviewHeaderActions />}
          hideSidebarTrigger={isCandidateRole}
          leadingAction={
            isCandidateRole ? (
              <Button
                asChild
                variant="outline"
                size="icon"
                className="h-9 w-9 rounded-md border-border bg-white text-muted-foreground shadow-sm hover:bg-white"
              >
                <Link href="/interviews">
                  <ArrowLeft className="h-4 w-4" />
                  <span className="sr-only">Back</span>
                </Link>
              </Button>
            ) : undefined
          }
        />

        <div className="space-y-4 px-3 pb-6 sm:space-y-5 sm:px-4 sm:pb-8">
          <section className="rounded-3xl bg-gradient-to-br from-[#0d6fae] to-[#084f7f] p-4 text-white shadow-[0_10px_35px_rgba(8,79,127,0.35)] sm:p-5 lg:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="border-0 bg-white/15 text-white hover:bg-white/15">
                AI-Powered Interview Creation
              </Badge>
              <Badge className="border-0 bg-white/15 text-white hover:bg-white/15">
                Voice Workflow
              </Badge>
            </div>
            <h2 className="mt-2 text-xl font-semibold leading-tight sm:text-2xl">
              Build a new mock interview by voice
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-white/90">
              Talk naturally with the AI creator. It collects context, generates
              interview strategy, and saves your interview for candidates instantly.
            </p>
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              <InfoChip label="Workflow" value="VAPI + OpenAI" />
              <InfoChip label="Question Mode" value="Dynamic by context" />
              <InfoChip label="Publishing" value="Public / Private / College" />
            </div>
          </section>

          <VoiceInterviewCreatePanel
            candidateName={currentUser?.name ?? "Interview Owner"}
            candidatePhoto={currentUser?.photo ?? null}
          />

          <details className="rounded-2xl border border-[#e5e9f0] bg-[#fafbfd] p-4 sm:p-5 lg:p-6">
            <summary className="cursor-pointer text-sm font-medium text-foreground sm:text-base">
              Advanced fallback: create interview manually
            </summary>
            <p className="mt-2 text-sm text-muted-foreground">
              Use this only if the voice workflow is unavailable.
            </p>
            <div className="mt-4">
              <CreateInterviewForm
                role={currentUser?.role}
                recruiterWorkspaces={recruiterWorkspaces}
                collegeWorkspaces={collegeWorkspaces}
              />
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}

function InfoChip({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-white/20 bg-white/10 px-3 py-2">
      <p className="text-xs text-white/85">{label}</p>
      <p className="mt-0.5 text-sm font-semibold leading-tight text-white">{value}</p>
    </div>
  );
}
