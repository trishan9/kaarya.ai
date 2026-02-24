import { DashboardHeader } from "../_components/dashboard-header";
import { OverviewHeaderActions } from "../overview/_components/overview-header-actions";
import { ResourcesWorkspace } from "./_components/resources-workspace";
import { getCurrentUser } from "@/lib/dal";
import { listResourceCourses } from "@/lib/actions/resource-actions";
import { listRecruiterWorkspaces } from "@/lib/actions/company-actions";
import { listCollegeWorkspaces } from "@/lib/actions/college-actions";
import {
  extractCollegeWorkspaces,
  extractRecruiterWorkspaces,
  extractWorkspaceRows,
} from "@/lib/workspaces";
import { Role, TResourceCourse } from "@/lib/definitions";

const extractCourses = (response: unknown): TResourceCourse[] => {
  if (
    typeof response === "object" &&
    response !== null &&
    "data" in response &&
    typeof (response as { data?: unknown }).data === "object" &&
    (response as { data?: { courses?: unknown } }).data !== null &&
    Array.isArray((response as { data?: { courses?: unknown[] } }).data?.courses)
  ) {
    return (response as { data?: { courses?: TResourceCourse[] } }).data?.courses ?? [];
  }
  return [];
};

export default async function ResourcesPage() {
  const currentUser = await getCurrentUser();
  const [myResponse, publicResponse, recruiterWorkspacesResponse, collegeWorkspacesResponse] =
    await Promise.all([
      listResourceCourses({
        page: 1,
        size: 50,
        ownership: "mine",
        sortBy: "updated",
      }),
      listResourceCourses({
        page: 1,
        size: 50,
        ownership: "public",
        sortBy: "updated",
      }),
      currentUser?.role === Role.RECRUITER
        ? listRecruiterWorkspaces({ page: 1, size: 50 })
        : Promise.resolve(null),
      currentUser?.role === Role.COLLEGE
        ? listCollegeWorkspaces({ page: 1, size: 50 })
        : Promise.resolve(null),
    ]);

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
        <DashboardHeader title="Resources" actions={<OverviewHeaderActions />} />
        <div className="space-y-6 px-3 pb-6 sm:px-4 sm:pb-8">
          <ResourcesWorkspace
            role={currentUser?.role}
            myCourses={extractCourses(myResponse)}
            publicCourses={extractCourses(publicResponse)}
            recruiterWorkspaces={recruiterWorkspaces}
            collegeWorkspaces={collegeWorkspaces}
          />
        </div>
      </div>
    </div>
  );
}
