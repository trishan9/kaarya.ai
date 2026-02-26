import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, UserX } from "lucide-react";
import { DashboardHeader } from "../../../../(dashboard)/_components/dashboard-header";

export function UserNotFound() {
  return (
    <>
      <DashboardHeader
        title="User Details"
        actions={
          <Button asChild variant="outline" className="h-9 rounded-lg text-xs font-semibold">
            <Link href="/admin/users">
              <ArrowLeft className="h-4 w-4" />
              Back to Users
            </Link>
          </Button>
        }
      />

      <section className="px-3 pb-6 sm:px-4 sm:pb-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="mb-4 rounded-full bg-muted p-4">
              <UserX className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">User Not Found</h3>
            <p className="mb-6 max-w-md text-center text-sm text-muted-foreground">
              The user you&apos;re looking for doesn&apos;t exist or has been removed.
            </p>
            <Button asChild variant="outline">
              <Link href="/admin/users">Back to Users</Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </>
  );
}

