import { NextResponse } from "next/server";

const backendBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ?? "";

const resolveWebhookSecret = (request: Request) => {
  const xVapiSecret = request.headers.get("x-vapi-secret");
  const xVapiPrivateKey = request.headers.get("x-vapi-private-key");
  const xApiKey = request.headers.get("x-api-key");
  const xWebhookSecret = request.headers.get("x-webhook-secret");
  const authorization = request.headers.get("authorization");
  const bearerSecret =
    authorization?.toLowerCase().startsWith("bearer ") === true
      ? authorization.slice(7).trim()
      : null;

  return (
    xVapiSecret ||
    xVapiPrivateKey ||
    xApiKey ||
    xWebhookSecret ||
    bearerSecret ||
    process.env.VAPI_WEBHOOK_SECRET ||
    process.env.VAPI_PRIVATE_KEY ||
    null
  );
};

export async function GET() {
  return NextResponse.json(
    {
      success: true,
      data: "VAPI generate webhook is running.",
    },
    { status: 200 },
  );
}

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

    const body = await request.json().catch(() => ({}));
    const secret = resolveWebhookSecret(request);
    const response = await fetch(`${backendBaseUrl}/interviews/vapi/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(secret ? { "x-vapi-secret": secret } : {}),
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const payload = await response.json().catch(() => null);
    return NextResponse.json(
      payload ?? {
        success: false,
        message: "Failed to parse backend response",
      },
      { status: response.status },
    );
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to process VAPI generate webhook request.",
      },
      { status: 500 },
    );
  }
}
