import { ReactNode } from "react";
import { Card } from "@/components/ui/card";

interface UserInfoItemProps {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
}

export function UserInfoItem({ label, value, icon }: UserInfoItemProps) {
  return (
    <Card className="border-border/50 bg-muted/30 transition-all hover:bg-muted/50">
      <div className="flex items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-3 min-w-0">
          {icon && (
            <div className="shrink-0 text-muted-foreground">{icon}</div>
          )}
          <span className="text-sm font-medium text-muted-foreground">
            {label}
          </span>
        </div>
        <div className="text-right min-w-0 flex-1">
          <span className="text-sm font-semibold wrap-break-word">{value}</span>
        </div>
      </div>
    </Card>
  );
}

