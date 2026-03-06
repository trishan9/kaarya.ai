import { cn } from "@/lib/utils";

describe("lib/utils cn", () => {
  it("merges conditional and conflicting classes", () => {
    const result = cn(
      "px-2 py-2 text-sm",
      false && "hidden",
      "px-4",
      undefined,
      "font-semibold",
    );

    expect(result).toContain("px-4");
    expect(result).not.toContain("px-2");
    expect(result).toContain("py-2");
    expect(result).toContain("text-sm");
    expect(result).toContain("font-semibold");
  });
});
