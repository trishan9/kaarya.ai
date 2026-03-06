import { buildHuddleCallId } from "@/app/(protected)/(dashboard)/inbox/_components/stream-huddle-utils";

describe("stream huddle utils", () => {
  it("returns null for missing channel ids", () => {
    expect(buildHuddleCallId()).toBeNull();
    expect(buildHuddleCallId("   ")).toBeNull();
  });

  it("normalizes channel ids for call ids", () => {
    expect(buildHuddleCallId("channel-123")).toBe("inbox-channel-123");
    expect(buildHuddleCallId("team/room:alpha")).toBe("inbox-team-room-alpha");
  });
});
