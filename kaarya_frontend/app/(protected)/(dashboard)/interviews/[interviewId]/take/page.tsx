import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Clock3, Layers, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DashboardHeader } from "../../../_components/dashboard-header";
import { OverviewHeaderActions } from "../../../overview/_components/overview-header-actions";
import { getInterviewById } from "@/lib/actions/interview-actions";
import { getCurrentUser } from "@/lib/dal";
import { Role, type TInterview } from "@/lib/definitions";
import { InterviewCallPanel } from "../_components/interview-call-panel";

type TakeInterviewPageProps = {
  params: Promise<{
    interviewId: string;
  }>;
  searchParams?: Promise<{
    returnTo?: string;
  }>;
};

const typeLabelByValue: Record<string, string> = {
  technical: "Technical",
  behavioral: "Behavioral",
  mixed: "Mixed",
  system_design: "System Design",
  custom: "Custom",
};

const visibilityLabelByValue: Record<string, string> = {
  public: "Public",
  private: "Private",
  college_only: "College Only",
};

const extractInterview = (response: any) =>
  (response?.data as TInterview | undefined) ?? null;

const resolveReturnTo = (value?: string | null) => {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return null;
  return trimmed;
};

export default async function TakeInterviewPage({
  params,
  searchParams,
}: TakeInterviewPageProps) {
  const { interviewId } = await params;
  const query = await searchParams;
  const returnTo = resolveReturnTo(query?.returnTo);
  const [interviewResponse, currentUser] = await Promise.all([
    getInterviewById(interviewId),
    getCurrentUser(),
  ]);
  if (!interviewResponse?.success) {
    notFound();
  }

  const interview = extractInterview(interviewResponse);
  if (!interview) {
    notFound();
  }

  const canTakeInterview =
    currentUser?.role === Role.USER || currentUser?.role === Role.STUDENT;
  if (!canTakeInterview) {
    redirect(`/interviews/${interview.id}`);
  }

  return (
    <div className="min-h-svh bg-neutral-100 p-2 sm:p-4 lg:pl-0 lg:p-5">
      <div className="rounded-xl bg-white sm:rounded-2xl">
        <DashboardHeader title="Take Interview" actions={<OverviewHeaderActions />} />

        <div className="space-y-4 px-3 pb-6 sm:space-y-5 sm:px-4 sm:pb-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Button asChild variant="outline" className="h-9 w-full rounded-lg sm:w-auto">
              <Link href={returnTo ?? `/interviews/${interview.id}`}>
                <ArrowLeft className="h-4 w-4" />
                {returnTo ? "Back" : "Back to Interview"}
              </Link>
            </Button>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">
                {typeLabelByValue[interview.interviewType] ?? "Mixed"}
              </Badge>
              <Badge variant="outline">
                {visibilityLabelByValue[interview.visibility] ?? interview.visibility}
              </Badge>
            </div>
          </div>

          <section className="rounded-3xl bg-gradient-to-br from-[#0d6fae] to-[#084f7f] p-4 text-white shadow-[0_10px_35px_rgba(8,79,127,0.35)] sm:p-5 lg:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="border-0 bg-white/15 text-white hover:bg-white/15">
                    {typeLabelByValue[interview.interviewType] ?? "Mixed"}
                  </Badge>
                  <Badge className="border-0 bg-white/15 text-white hover:bg-white/15">
                    AI-Powered Interview
                  </Badge>
                </div>
                <h2 className="mt-2 text-xl font-semibold leading-tight sm:text-2xl">
                  {interview.title}
                </h2>
                <p className="mt-1 text-sm text-white/90">
                  by {interview.company?.name || interview.college?.name || "Kaarya"}
                </p>
              </div>
            </div>

            <p className="mt-3 text-sm text-white/90">
              {interview.description ||
                "Keep your responses structured and confident. The AI interviewer will evaluate communication, clarity, and technical depth."}
            </p>

            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              <InfoChip
                icon={<Clock3 className="h-3.5 w-3.5" />}
                label="Duration"
                value={`${interview.durationMinutes} min`}
              />
              <InfoChip
                icon={<Layers className="h-3.5 w-3.5" />}
                label="Questions"
                value={`${interview.questionCount}`}
              />
              <InfoChip
                icon={<Sparkles className="h-3.5 w-3.5" />}
                label="Level"
                value={interview.level || "Entry-Level"}
              />
            </div>
          </section>

          <InterviewCallPanel
            interviewId={interview.id}
            interviewTitle={interview.title}
            interviewerLabel="Kaarya AI Interviewer"
            candidateName={currentUser?.name ?? "Candidate"}
            candidatePhoto={currentUser?.photo ?? null}
            returnTo={returnTo}
            questionBank={
              Array.isArray(interview.questions)
                ? interview.questions.map((question) => question.question)
                : []
            }
          />
        </div>
      </div>
    </div>
  );
}

function InfoChip({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-white/20 bg-white/10 px-3 py-2">
      <div className="flex items-center gap-1.5 text-xs text-white/85">
        {icon}
        {label}
      </div>
      <p className="mt-0.5 text-sm font-semibold leading-tight text-white">{value}</p>
    </div>
  );
}
