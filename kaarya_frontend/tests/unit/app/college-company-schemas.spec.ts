import {
  inviteStudentSchema,
  joinCollegeByCodeSchema,
  updateCollegeProfileSchema,
} from "@/app/(protected)/(dashboard)/college-settings/_schemas";
import {
  createCompanyWorkspaceSchema,
  inviteRecruiterSchema,
  joinWorkspaceByCodeSchema,
  updateCompanyProfileSchema,
} from "@/app/(protected)/(dashboard)/company-settings/_schemas";

describe("college and company schemas", () => {
  it("validates join-by-code payloads", () => {
    expect(
      joinCollegeByCodeSchema.safeParse({
        inviteCode: "KC-1234",
        year: 2,
      }).success,
    ).toBe(true);
    expect(
      joinWorkspaceByCodeSchema.safeParse({
        inviteCode: "KR-1234",
      }).success,
    ).toBe(true);
  });

  it("validates invite schemas", () => {
    expect(
      inviteStudentSchema.safeParse({
        email: "student@example.com",
      }).success,
    ).toBe(true);
    expect(
      inviteRecruiterSchema.safeParse({
        email: "recruiter@example.com",
      }).success,
    ).toBe(true);
    expect(
      inviteRecruiterSchema.safeParse({
        email: "bad-email",
      }).success,
    ).toBe(false);
  });

  it("validates company workspace create schema", () => {
    expect(
      createCompanyWorkspaceSchema.safeParse({
        name: "Acme",
      }).success,
    ).toBe(true);
    expect(
      createCompanyWorkspaceSchema.safeParse({
        name: "A",
      }).success,
    ).toBe(false);
  });

  it("validates logo file constraints for update schemas", () => {
    const validLogo = new File(["png"], "logo.png", { type: "image/png" });
    const invalidLogo = "invalid";

    expect(
      updateCompanyProfileSchema.safeParse({
        name: "Acme Inc",
        logo: validLogo,
      }).success,
    ).toBe(true);
    expect(
      updateCompanyProfileSchema.safeParse({
        name: "Acme Inc",
        logo: invalidLogo as any,
      }).success,
    ).toBe(false);

    expect(
      updateCollegeProfileSchema.safeParse({
        name: "Tech College",
        logo: validLogo,
      }).success,
    ).toBe(true);
    expect(
      updateCollegeProfileSchema.safeParse({
        name: "Tech College",
        logo: invalidLogo as any,
      }).success,
    ).toBe(false);
  });
});
