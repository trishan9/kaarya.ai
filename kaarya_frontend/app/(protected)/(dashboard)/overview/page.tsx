import { getCurrentUser } from "@/lib/dal";
import { LogoutSection } from "./_components/logout-section";

export default async function OverviewPage() {
  const user = await getCurrentUser();

  return (
    <div>
      <p>Overview Page</p>

      <p>
        Hello, {user?.name} ({user?.role})
      </p>

      <LogoutSection />
    </div>
  );
}
