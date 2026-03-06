import type { PaginationMeta } from "@/lib/pagination";
import {
  buildHref,
  formatDateLabel,
  getShowingRange,
  readStringParam,
} from "@/app/(protected)/admin/_lib/admin-page-utils";

describe("admin page utils", () => {
  it("reads normalized string params", () => {
    expect(readStringParam(" value ")).toBe("value");
    expect(readStringParam("   ")).toBeUndefined();
    expect(readStringParam(["a", "b"])).toBeUndefined();
    expect(readStringParam(undefined)).toBeUndefined();
  });

  it("formats date labels with fallback", () => {
    expect(formatDateLabel(undefined)).toBe("-");
    expect(formatDateLabel("invalid-date")).toBe("-");
    expect(formatDateLabel("2026-02-28T00:00:00.000Z")).toMatch(/2026/);
  });

  it("builds href with filtered params", () => {
    const href = buildHref("/admin/users", {
      page: 2,
      search: "john",
      empty: "",
      blank: "   ",
      ignored: undefined,
    });

    expect(href).toBe("/admin/users?page=2&search=john");
    expect(buildHref("/admin/users", { ignored: undefined })).toBe("/admin/users");
  });

  it("computes showing range from pagination meta", () => {
    const empty = getShowingRange(undefined);
    expect(empty).toEqual({ from: 0, to: 0 });

    const meta: PaginationMeta = {
      page: 3,
      size: 10,
      totalItems: 25,
      totalPages: 3,
      hasNextPage: false,
      hasPrevPage: true,
      nextPage: null,
      prevPage: 2,
      search: null,
    };
    expect(getShowingRange(meta)).toEqual({ from: 21, to: 25 });
  });
});
