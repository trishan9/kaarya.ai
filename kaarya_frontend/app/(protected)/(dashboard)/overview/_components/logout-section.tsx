import { Loader2 } from "lucide-react";
import { useLogOut } from "@/app/(auth)/_hooks/use-log-out";
import { Button } from "@/components/ui/button";

export function LogoutSection() {
  const { onLogOut, isLoggingOut } = useLogOut();

  return (
    <Button variant="destructive" onClick={onLogOut} disabled={isLoggingOut}>
      <Loader2 className={isLoggingOut ? "animate-spin mr-2" : "hidden"} />
      Log Out
    </Button>
  );
}
