"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type StripeCheckoutButtonProps = {
  disabled?: boolean;
};

type TCreateStripeSessionResponse = {
  success: boolean;
  message?: string;
  data?: {
    sessionId: string;
    checkoutUrl: string;
    currency: "NPR";
    amountNpr: number;
    plan: "pro";
  };
};

export function StripeCheckoutButton({ disabled }: StripeCheckoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startCheckout = async () => {
    if (disabled) return;
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/payments/stripe/checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          successPath: "/payment/checkout",
          cancelPath: "/payment/checkout",
        }),
      });
      const payload = (await response.json().catch(() => null)) as
        | TCreateStripeSessionResponse
        | null;

      if (!response.ok || !payload?.success || !payload.data?.checkoutUrl) {
        setError(payload?.message ?? "Unable to create Stripe checkout session.");
        setIsLoading(false);
        return;
      }

      window.location.href = payload.data.checkoutUrl;
    } catch {
      setError("Unable to start Stripe checkout. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <Button
        size="lg"
        onClick={startCheckout}
        disabled={isLoading || disabled}
        className="w-full"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Redirecting to Stripe...
          </>
        ) : (
          "Pay with Stripe"
        )}
      </Button>
      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}{" "}
          <Link className="underline" href="/payment/checkout">
            Open Billing
          </Link>
        </div>
      ) : null}
    </div>
  );
}
