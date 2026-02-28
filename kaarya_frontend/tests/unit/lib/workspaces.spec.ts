import {
  extractCollegeWorkspaces,
  extractRecruiterWorkspaces,
  extractWorkspaceRows,
  resolveCollegeWorkspace,
  resolveRecruiterWorkspace,
} from "@/lib/workspaces";

describe("lib/workspaces", () => {
  it("extracts workspace rows safely", () => {
    expect(extractWorkspaceRows(null)).toEqual([]);
    expect(extractWorkspaceRows({ data: { workspaces: "invalid" } })).toEqual([]);

    const rows = [{ company: { id: "c1" } }, { college: { id: "cl1" } }];
    expect(extractWorkspaceRows({ data: { workspaces: rows } })).toBe(rows);
  });

  it("filters recruiter and college workspaces", () => {
    const rows = [
      { company: { id: "company-1" } },
      { company: { id: null } },
      { college: { id: "college-1" } },
      {},
    ];

    expect(extractRecruiterWorkspaces(rows)).toEqual([
      { company: { id: "company-1" } },
    ]);
    expect(extractCollegeWorkspaces(rows)).toEqual([
      { college: { id: "college-1" } },
    ]);
  });

  it("resolves recruiter workspace by requested and fallback ids", () => {
    const workspaces = [
      { company: { id: "a", name: "A", logo: null }, membershipId: "m1" },
      { company: { id: "b", name: "B", logo: null }, membershipId: "m2" },
    ] as any[];

    expect(
      resolveRecruiterWorkspace({
        workspaces,
        requestedId: "b",
      }),
    ).toEqual(workspaces[1]);

    expect(
      resolveRecruiterWorkspace({
        workspaces,
        requestedId: "x",
        fallbackIds: ["", null, "a"],
      }),
    ).toEqual(workspaces[0]);

    expect(
      resolveRecruiterWorkspace({
        workspaces,
        requestedId: "x",
        fallbackIds: ["", null, undefined],
      }),
    ).toEqual(workspaces[0]);
  });

  it("resolves college workspace by requested and fallback ids", () => {
    const workspaces = [
      { college: { id: "c1", name: "C1", logo: null }, membershipId: "m1" },
      { college: { id: "c2", name: "C2", logo: null }, membershipId: "m2" },
    ] as any[];

    expect(
      resolveCollegeWorkspace({
        workspaces,
        requestedId: "c2",
      }),
    ).toEqual(workspaces[1]);

    expect(
      resolveCollegeWorkspace({
        workspaces,
        requestedId: undefined,
        fallbackIds: ["x", "c1"],
      }),
    ).toEqual(workspaces[0]);

    expect(
      resolveCollegeWorkspace({
        workspaces,
        requestedId: "missing",
        fallbackIds: [undefined, ""],
      }),
    ).toEqual(workspaces[0]);
  });
});
