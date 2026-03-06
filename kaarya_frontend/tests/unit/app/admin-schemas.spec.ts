import {
  adminCreateUserSchema,
  adminUpdateUserSchema,
} from "@/app/(protected)/admin/_schemas";

describe("admin schemas", () => {
  it("validates create schema happy path", () => {
    const file = new File(["avatar"], "avatar.png", { type: "image/png" });
    const parsed = adminCreateUserSchema.safeParse({
      name: "Admin User",
      email: "admin@example.com",
      password: "Password12",
      confirmPassword: "Password12",
      role: "admin",
      provider: "email",
      photo: file,
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects create schema password mismatch", () => {
    const parsed = adminCreateUserSchema.safeParse({
      name: "Admin User",
      email: "admin@example.com",
      password: "Password12",
      confirmPassword: "Password11",
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues.some((issue) => issue.path[0] === "confirmPassword")).toBe(
        true,
      );
    }
  });

  it("allows update schema without passwords", () => {
    const parsed = adminUpdateUserSchema.safeParse({
      name: "",
      email: "",
      role: "user",
      provider: "email",
      photo: null,
    });
    expect(parsed.success).toBe(true);
  });

  it("requires confirm password when partial password update is provided", () => {
    const parsed = adminUpdateUserSchema.safeParse({
      password: "Password12",
      confirmPassword: "",
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues.some((issue) => issue.message.includes("Password confirmation"))).toBe(
        true,
      );
    }
  });

  it("rejects update schema password mismatch", () => {
    const parsed = adminUpdateUserSchema.safeParse({
      password: "Password12",
      confirmPassword: "Password11",
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues.some((issue) => issue.message.includes("passwords match"))).toBe(
        true,
      );
    }
  });
});

