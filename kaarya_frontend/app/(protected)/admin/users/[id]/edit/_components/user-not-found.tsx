import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserX, ArrowLeft } from "lucide-react";

export function UserNotFound() {
  return (
    <section className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-wide text-muted-foreground">
            Kaarya Admin Panel
          </p>
          <h1 className="text-3xl font-bold tracking-tight">Edit User</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Update user account information
          </p>
        </div>

        <Button asChild variant="outline" className="gap-2">
          <Link href="/admin/users">
            <ArrowLeft className="h-4 w-4" />
            Back to Users
          </Link>
        </Button>
      </div>

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

