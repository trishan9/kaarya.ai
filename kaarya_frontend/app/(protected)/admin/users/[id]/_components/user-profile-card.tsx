import Image from "next/image";
import { TUser } from "@/lib/definitions";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserDetailActions } from "../../_components/user-detail-actions";
import { UserInfoItem } from "./user-info-item";
import {
  Shield,
  Mail,
  Key,
  Calendar,
  Clock,
  Globe,
} from "lucide-react";

interface UserProfileCardProps {
  user: TUser;
}

export function UserProfileCard({ user }: UserProfileCardProps) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Card className="transition-all hover:shadow-md">
      <CardHeader>
        <div className="flex items-start justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="relative size-20 overflow-hidden rounded-full border-2 border-background bg-muted ring-4 ring-muted">
              {user.photo ? (
                <Image
                  src={user.photo}
                  alt={user.name}
                  width={80}
                  height={80}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-2xl font-bold bg-linear-to-br from-primary/20 to-primary/10">
                  {user.name.charAt(0).toUpperCase()}
                  {user.name.split(" ")[1]?.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <div>
              <h2 className="text-2xl font-bold tracking-tight">{user.name}</h2>
              <div className="flex items-center gap-2 mt-2">
                <Badge
                  variant={user.role === "admin" ? "default" : "secondary"}
                  className="capitalize"
                >
                  {user.role}
                </Badge>
                {user.email && (
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {user.email}
                  </span>
                )}
              </div>
            </div>
          </div>

          <UserDetailActions userId={user.id} />
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid gap-3">
          <UserInfoItem
            label="User ID"
            value={<span className="font-mono text-xs">{user.id}</span>}
            icon={<Key className="h-4 w-4" />}
          />

          <UserInfoItem
            label="Role"
            value={
              <Badge
                variant={user.role === "admin" ? "default" : "secondary"}
                className="capitalize"
              >
                {user.role}
              </Badge>
            }
            icon={<Shield className="h-4 w-4" />}
          />

          <UserInfoItem
            label="Provider"
            value={
              <span className="capitalize">
                {user.provider ?? "Email"}
              </span>
            }
            icon={<Globe className="h-4 w-4" />}
          />

          <UserInfoItem
            label="Created"
            value={formatDate(user.createdAt)}
            icon={<Calendar className="h-4 w-4" />}
          />

          <UserInfoItem
            label="Last Updated"
            value={formatDate(user.updatedAt)}
            icon={<Clock className="h-4 w-4" />}
          />
        </div>
      </CardContent>
    </Card>
  );
}

