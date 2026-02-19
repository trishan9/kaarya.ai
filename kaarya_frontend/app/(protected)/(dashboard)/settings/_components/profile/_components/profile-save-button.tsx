"use client";

import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";

type ProfileSaveButtonProps = {
  isSubmitting: boolean;
  label?: string;
};

export function ProfileSaveButton({
  isSubmitting,
  label = "Save Changes",
}: ProfileSaveButtonProps) {
  return (
    <div className="flex items-center justify-end gap-3 border-t pt-4">
      <Button
        type="submit"
        disabled={isSubmitting}
        className="min-w-[148px] gap-2"
        size="lg"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Save className="h-4 w-4" />
            {label}
          </>
        )}
      </Button>
    </div>
  );
}
