import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { API_URLS } from "@/lib/api/endpoints";

const backendBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "");

export async function POST(request: Request) {
  try {
    if (!backendBaseUrl) {
      return NextResponse.json(
        {
          success: false,
          message: "NEXT_PUBLIC_API_BASE_URL is missing.",
        },
        { status: 500 },
      );
    }

    const accessToken = (await cookies()).get("access_token")?.value;
    if (!accessToken) {
      return NextResponse.json(
        {
          success: false,
          message: "Please sign in to manage Stripe billing.",
        },
        { status: 401 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const response = await fetch(
      `${backendBaseUrl}${API_URLS.PAYMENT.STRIPE_PORTAL_SESSION}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        cache: "no-store",
      },
    );

    const payload = await response.json().catch(() => null);
    return NextResponse.json(
      payload ?? {
        success: false,
        message: "Invalid Stripe portal session response.",
      },
      { status: response.status },
    );
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to create Stripe portal session.",
      },
      { status: 500 },
    );
  }
}
