import { redirect } from "next/navigation";
import { DashboardHeader } from "../_components/dashboard-header";
import { OverviewHeaderActions } from "../overview/_components/overview-header-actions";
import { MyApplicationsBoard } from "./_components/my-applications-board";
import { MyApplicationsHero } from "./_components/my-applications-hero";
import { getMyApplicationsPageData } from "./applications-data";
import { getCurrentUser } from "@/lib/dal";
import { Role } from "@/lib/definitions";

type MyApplicationsPageProps = {
  searchParams?: Promise<{
    application?: string;
  }>;
};

export default async function MyApplicationsPage({
  searchParams,
}: MyApplicationsPageProps) {
  const user = await getCurrentUser();
  if (!user || (user.role !== Role.USER && user.role !== Role.STUDENT)) {
    redirect("/overview");
  }

  const query = await searchParams;
  const initialApplicationId =
    typeof query?.application === "string" ? query.application : null;
  const myApplicationsData = await getMyApplicationsPageData({
    initialApplicationId,
  });

  return (
    <div className="min-h-svh bg-neutral-100 p-2 sm:p-4 lg:pl-0 lg:p-5">
      <div className="rounded-xl bg-white sm:rounded-2xl">
        <DashboardHeader
          title="My Applications"
          actions={<OverviewHeaderActions />}
        />

        <div className="space-y-6 px-3 pb-6 sm:px-4 sm:pb-8">
          <MyApplicationsHero {...myApplicationsData.hero} />
          <MyApplicationsBoard {...myApplicationsData.board} />
        </div>
      </div>
    </div>
  );
}
