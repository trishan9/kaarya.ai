import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, UserPlus, Settings } from "lucide-react";

interface QuickActionsCardProps {
  userId: string;
}

export function QuickActionsCard({ userId }: QuickActionsCardProps) {
  return (
    <Card className="transition-all hover:shadow-md">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-muted-foreground" />
          <CardTitle>Quick Actions</CardTitle>
        </div>
        <CardDescription>
          Manage this user account or create a new one
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3">
          <Button asChild variant="default" className="gap-2 w-full">
            <Link href={`/admin/users/${userId}/edit`}>
              <Pencil className="h-4 w-4" />
              Edit User Details
            </Link>
          </Button>

          <Button asChild variant="outline" className="gap-2 w-full">
            <Link href="/admin/users/create">
              <UserPlus className="h-4 w-4" />
              Create Another User
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

