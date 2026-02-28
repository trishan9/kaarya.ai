import { Role } from "@/lib/definitions";
import { getSidebarNavGroups } from "@/app/(protected)/(dashboard)/_config/sidebar-items";

describe("sidebar nav config", () => {
  it("returns candidate groups by default", () => {
    const groups = getSidebarNavGroups();
    expect(groups).toHaveLength(2);
    expect(groups[0]?.label).toBe("Main");
    expect(groups[0]?.items.some((item) => item.href === "/jobs")).toBe(true);
  });

  it("returns recruiter groups", () => {
    const groups = getSidebarNavGroups(Role.RECRUITER);
    expect(groups).toHaveLength(2);
    expect(groups[0]?.label).toBe("Workspace");
    expect(groups[0]?.items.some((item) => item.href === "/company-settings")).toBe(true);
  });

  it("returns college groups", () => {
    const groups = getSidebarNavGroups(Role.COLLEGE);
    expect(groups).toHaveLength(2);
    expect(groups[0]?.items.some((item) => item.href === "/college-settings")).toBe(true);
  });

  it("returns admin groups", () => {
    const groups = getSidebarNavGroups(Role.ADMIN);
    expect(groups).toHaveLength(1);
    expect(groups[0]?.label).toBe("Admin");
    expect(groups[0]?.items.some((item) => item.href === "/admin/users")).toBe(true);
  });
});

