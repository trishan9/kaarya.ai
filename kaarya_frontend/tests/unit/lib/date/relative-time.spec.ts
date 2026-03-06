import { formatRelativeTime } from "@/lib/date/relative-time";

describe("lib/date/relative-time", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-28T10:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns fallback for missing or invalid values", () => {
    expect(formatRelativeTime(undefined)).toBe("just now");
    expect(formatRelativeTime("not-a-date", { fallback: "now" })).toBe("now");
  });

  it("returns compact style by default", () => {
    expect(formatRelativeTime("2026-02-28T09:30:00.000Z")).toBe("30m ago");
    expect(formatRelativeTime("2026-02-27T10:00:00.000Z")).toBe("1d ago");
  });

  it("returns long style when requested", () => {
    expect(
      formatRelativeTime("2026-02-28T08:00:00.000Z", {
        style: "long",
      }),
    ).toBe("2 hours ago");
  });

  it("uses fallback for near-zero distances", () => {
    expect(formatRelativeTime("2026-02-28T10:00:00.000Z")).toBe("just now");
  });
});
