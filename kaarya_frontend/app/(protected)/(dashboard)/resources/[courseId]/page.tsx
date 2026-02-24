import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DashboardHeader } from "../../_components/dashboard-header";
import { OverviewHeaderActions } from "../../overview/_components/overview-header-actions";
import { getResourceCourseById } from "@/lib/actions/resource-actions";
import type { TResourceCourse } from "@/lib/definitions";
import { CourseDetailClientView } from "./_components/course-detail-client-view";

type ResourceCoursePageProps = {
  params: Promise<{ courseId: string }>;
};

const extractCourse = (response: unknown): TResourceCourse | null => {
  if (!response || typeof response !== "object") return null;
  const root = response as { success?: boolean; data?: unknown };
  if (root.success === false) return null;

  const rootData = root.data;
  if (rootData && typeof rootData === "object" && "id" in rootData) {
    return rootData as TResourceCourse;
  }

  if (rootData && typeof rootData === "object" && "data" in rootData) {
    const nestedData = (rootData as { data?: unknown }).data;
    if (nestedData && typeof nestedData === "object" && "id" in nestedData) {
      return nestedData as TResourceCourse;
    }
  }

  return null;
};

export default async function ResourceCoursePage({ params }: ResourceCoursePageProps) {
  const { courseId } = await params;
  const response = await getResourceCourseById(courseId);
  const course = extractCourse(response);

  return (
    <div className="min-h-svh bg-neutral-100 p-2 sm:p-4 lg:pl-0 lg:p-5">
      <div className="rounded-xl bg-white sm:rounded-2xl">
        <DashboardHeader
          title="Generated Course"
          actions={<OverviewHeaderActions />}
          leadingAction={
            <Button
              asChild
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-md border-border bg-white text-muted-foreground shadow-sm hover:bg-white"
            >
              <Link href="/resources">
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Back</span>
              </Link>
            </Button>
          }
          hideSidebarTrigger
        />

        <div className="space-y-5 px-3 pb-6 sm:px-4 sm:pb-8">
          {!course ? (
            <Card className="rounded-2xl border border-dashed border-[#d4dce8] bg-white p-6 text-sm text-muted-foreground">
              Unable to load this course. It may have been removed or you may not have access.
            </Card>
          ) : (
            <CourseDetailClientView course={course} />
          )}
        </div>
      </div>
    </div>
  );
}
