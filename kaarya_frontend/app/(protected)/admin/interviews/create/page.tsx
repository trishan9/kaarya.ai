import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DashboardHeader } from "../../../(dashboard)/_components/dashboard-header";
import { CreateInterviewForm } from "../../../(dashboard)/interviews/create/_components/create-interview-form";
import { VoiceInterviewCreatePanel } from "../../../(dashboard)/interviews/create/_components/voice-interview-create-panel";
import { getCurrentUser } from "@/lib/dal";

export default async function AdminCreateInterviewPage() {
  const currentUser = await getCurrentUser();

  return (
    <>
      <DashboardHeader
        title="Create Interview"
        actions={
          <Button asChild variant="outline" className="h-9 rounded-lg text-xs font-semibold">
            <Link href="/admin/interviews">
              <ArrowLeft className="h-4 w-4" />
              Back to Interviews
            </Link>
          </Button>
        }
      />

      <section className="space-y-5 px-3 pb-6 sm:px-4 sm:pb-8">
        <section className="rounded-3xl bg-gradient-to-br from-[#0d6fae] to-[#084f7f] p-4 text-white shadow-[0_10px_35px_rgba(8,79,127,0.35)] sm:p-5 lg:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="border-0 bg-white/15 text-white hover:bg-white/15">
              Admin Workflow
            </Badge>
            <Badge className="border-0 bg-white/15 text-white hover:bg-white/15">
              Voice + Manual
            </Badge>
          </div>
          <h2 className="mt-2 text-xl font-semibold leading-tight sm:text-2xl">
            Create and publish interview assets
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-white/90">
            Build new interviews for system-wide usage. You can use voice-first
            creation or fallback to manual setup.
          </p>
        </section>

        <VoiceInterviewCreatePanel
          candidateName={currentUser?.name ?? "Admin"}
          candidatePhoto={currentUser?.photo ?? null}
          redirectHref="/admin/interviews"
        />

        <details className="rounded-2xl border border-[#e5e9f0] bg-[#fafbfd] p-4 sm:p-5 lg:p-6">
          <summary className="cursor-pointer text-sm font-medium text-foreground sm:text-base">
            Advanced fallback: create interview manually
          </summary>
          <p className="mt-2 text-sm text-muted-foreground">
            Use this only if voice workflow is unavailable.
          </p>
          <div className="mt-4">
            <CreateInterviewForm
              role={currentUser?.role}
              recruiterWorkspaces={[]}
              collegeWorkspaces={[]}
              listHref="/admin/interviews"
              detailHrefPrefix="/admin/interviews"
            />
          </div>
        </details>
      </section>
    </>
  );
}

