import { parsePaginationParams } from "@/lib/pagination";

describe("lib/pagination", () => {
  it("parses valid page and size", () => {
    expect(parsePaginationParams({ page: "2", size: 20 })).toEqual({
      page: 2,
      size: 20,
    });
  });

  it("returns undefined for invalid page and size", () => {
    expect(parsePaginationParams({ page: 0, size: -10 })).toEqual({
      page: undefined,
      size: undefined,
    });
    expect(parsePaginationParams({ page: "abc", size: null })).toEqual({
      page: undefined,
      size: undefined,
    });
  });
});
