import Link from "next/link";
import { getCurrentUser } from "@/lib/dal";
import { LogoutSection } from "./_components/logout-section";
import { Button } from "@/components/ui/button";

export default async function OverviewPage() {
  const user = await getCurrentUser();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Overview Page</h1>

      <p className="mb-4">
        Hello, {user?.name} ({user?.role})
      </p>

      <div className="flex gap-4">
        <Link href="/profile">
          <Button variant="outline">Go to Profile</Button>
        </Link>

        <LogoutSection />
      </div>
    </div>
  );
}
