import { NextResponse } from "next/server";
import { startInterviewSession } from "@/lib/actions/interview-actions";

type RouteParams = {
  params: Promise<{
    interviewId: string;
  }>;
};

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { interviewId } = await params;
    const body = await request.json().catch(() => ({}));
    const response = await startInterviewSession(interviewId, body);
    const status = response?.success ? 200 : 400;
    return NextResponse.json(response, { status });
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to start interview session",
      },
      { status: 500 },
    );
  }
}

