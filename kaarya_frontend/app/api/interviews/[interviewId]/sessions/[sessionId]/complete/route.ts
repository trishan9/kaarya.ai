import { NextResponse } from "next/server";
import { completeInterviewSession } from "@/lib/actions/interview-actions";

type RouteParams = {
  params: Promise<{
    interviewId: string;
    sessionId: string;
  }>;
};

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { interviewId, sessionId } = await params;
    const body = await request.json().catch(() => ({}));
    const response = await completeInterviewSession(interviewId, sessionId, body);
    const status = response?.success ? 200 : 400;
    return NextResponse.json(response, { status });
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to complete interview session",
      },
      { status: 500 },
    );
  }
}

