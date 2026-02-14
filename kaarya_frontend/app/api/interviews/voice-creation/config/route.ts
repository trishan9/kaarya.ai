import { NextResponse } from "next/server";
import { getVoiceInterviewCreationConfig } from "@/lib/actions/interview-actions";

export async function POST() {
  try {
    const response = await getVoiceInterviewCreationConfig();
    const status = response?.success ? 200 : 400;
    return NextResponse.json(response, { status });
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to load voice interview creation config",
      },
      { status: 500 },
    );
  }
}
