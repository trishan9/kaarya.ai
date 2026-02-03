import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserDetailHeader } from "./user-detail-header";
import { UserX } from "lucide-react";

export function UserNotFound() {
  return (
    <section className="space-y-8">
      <UserDetailHeader />

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="rounded-full bg-muted p-4 mb-4">
            <UserX className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">User Not Found</h3>
          <p className="text-sm text-muted-foreground text-center mb-6 max-w-md">
            The user you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
          <Button asChild variant="outline">
            <Link href="/admin/users">Back to Users</Link>
          </Button>
        </CardContent>
      </Card>
    </section>
  );
}

