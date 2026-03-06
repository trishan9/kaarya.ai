"use server";

import { api } from "@/lib/api/axios-instance";
import { API_URLS } from "@/lib/api/endpoints";
import { TBillingSummary } from "@/lib/definitions";

type TActionResponse<TData> = {
  success: boolean;
  message?: string;
  data?: TData;
};

export async function getBillingSummary(): Promise<TActionResponse<TBillingSummary>> {
  try {
    const response = await api.get(API_URLS.PAYMENT.BILLING_SUMMARY);
    return response.data as TActionResponse<TBillingSummary>;
  } catch (error: Error | any) {
    return {
      success: false,
      message:
        error?.response?.data?.message ??
        error?.message ??
        "Failed to fetch billing summary.",
    };
  }
}

export async function verifyStripeCheckoutSession(sessionId: string): Promise<
  TActionResponse<{
    plan: "pro";
    unlocked: boolean;
    sessionId: string;
    invoiceNumber: string | null;
    amountNpr: number;
    currency: "NPR";
  }>
> {
  try {
    const response = await api.post(API_URLS.PAYMENT.STRIPE_VERIFY_SESSION, {
      sessionId,
    });
    return response.data;
  } catch (error: Error | any) {
    return {
      success: false,
      message:
        error?.response?.data?.message ??
        error?.message ??
        "Failed to verify Stripe payment.",
    };
  }
}
