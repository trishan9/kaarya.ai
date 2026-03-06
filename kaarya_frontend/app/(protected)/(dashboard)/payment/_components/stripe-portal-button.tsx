"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type StripePortalButtonProps = {
  returnPath?: string;
};

type TStripePortalSessionResponse = {
  success: boolean;
  message?: string;
  data?: {
    portalUrl: string;
  };
};

export function StripePortalButton({ returnPath = "/payment/checkout" }: StripePortalButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openPortal = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/payments/stripe/portal-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ returnPath }),
      });
      const payload = (await response.json().catch(() => null)) as
        | TStripePortalSessionResponse
        | null;

      if (!response.ok || !payload?.success || !payload.data?.portalUrl) {
        setError(payload?.message ?? "Unable to open Stripe billing portal.");
        setIsLoading(false);
        return;
      }

      window.location.href = payload.data.portalUrl;
    } catch {
      setError("Unable to open Stripe portal. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <Button variant="outline" onClick={openPortal} disabled={isLoading} className="w-full">
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Opening Stripe Portal...
          </>
        ) : (
          "Manage Billing in Stripe"
        )}
      </Button>
      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}
    </div>
  );
}
