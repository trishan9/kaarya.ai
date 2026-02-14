"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { deleteInterview } from "@/lib/actions/interview-actions";

type DeleteInterviewButtonProps = {
  interviewId: string;
};

const toErrorMessage = (value: unknown, fallback: string) => {
  if (!value) return fallback;
  if (typeof value === "string") return value;
  if (value instanceof Error) return value.message || fallback;

  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    if (typeof record.message === "string") return record.message;
    if (Array.isArray(record.message)) {
      return record.message.map((item) => String(item)).join(", ");
    }
    if (record.message) return toErrorMessage(record.message, fallback);
    if (typeof record.error === "string") return record.error;
    if (record.error) return toErrorMessage(record.error, fallback);
  }

  return fallback;
};

export function DeleteInterviewButton({ interviewId }: DeleteInterviewButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    const confirmed = window.confirm(
      "Delete this interview permanently? This action cannot be undone.",
    );
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      const response = await deleteInterview(interviewId);
      if (!response?.success) {
        toast.error(
          toErrorMessage(response?.message ?? response, "Failed to delete interview."),
        );
        return;
      }

      toast.success("Interview deleted successfully.");
      router.push("/interviews");
      router.refresh();
    } catch (error) {
      toast.error(toErrorMessage(error, "Failed to delete interview."));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Button
      type="button"
      variant="destructive"
      onClick={handleDelete}
      disabled={isDeleting}
      className="h-9 w-full rounded-lg sm:w-auto"
    >
      {isDeleting ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Deleting...
        </>
      ) : (
        <>
          <Trash2 className="h-4 w-4" />
          Delete Interview
        </>
      )}
    </Button>
  );
}
