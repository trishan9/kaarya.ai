import {
  confirmPasswordResetSchema,
  requestPasswordResetSchema,
  resetPasswordFormSchema,
  signinSchema,
  signupSchema,
  verifyPasswordResetOtpSchema,
} from "@/app/(auth)/_schemas";

describe("auth schemas", () => {
  it("validates signin schema", () => {
    const parsed = signinSchema.safeParse({
      email: "student@example.com",
      password: "StrongPass#123",
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects weak passwords for signin", () => {
    const parsed = signinSchema.safeParse({
      email: "student@example.com",
      password: "weakpassword",
    });
    expect(parsed.success).toBe(false);
  });

  it("validates recruiter and college role refinements", () => {
    const recruiterMissingCompany = signupSchema.safeParse({
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      role: "recruiter",
      password: "StrongPass#123",
      confirmPassword: "StrongPass#123",
    });
    expect(recruiterMissingCompany.success).toBe(false);

    const collegeMissingName = signupSchema.safeParse({
      firstName: "College",
      lastName: "Owner",
      email: "college@example.com",
      role: "college",
      password: "StrongPass#123",
      confirmPassword: "StrongPass#123",
    });
    expect(collegeMissingName.success).toBe(false);

    const recruiterValid = signupSchema.safeParse({
      firstName: "Recruiter",
      lastName: "Owner",
      email: "recruiter@example.com",
      role: "recruiter",
      password: "StrongPass#123",
      confirmPassword: "StrongPass#123",
      companyName: "Acme Hiring",
    });
    expect(recruiterValid.success).toBe(true);
  });

  it("rejects mismatched passwords", () => {
    const parsed = signupSchema.safeParse({
      firstName: "Ava",
      lastName: "Lane",
      email: "ava@example.com",
      role: "user",
      password: "StrongPass#123",
      confirmPassword: "StrongPass#124",
    });
    expect(parsed.success).toBe(false);
  });

  it("validates password reset schemas", () => {
    expect(
      requestPasswordResetSchema.safeParse({ email: "user@example.com" }).success,
    ).toBe(true);
    expect(
      verifyPasswordResetOtpSchema.safeParse({
        email: "user@example.com",
        otp: "123456",
      }).success,
    ).toBe(true);

    expect(
      confirmPasswordResetSchema.safeParse({
        token: "reset-token",
        password: "StrongPass#123",
        confirmPassword: "StrongPass#123",
      }).success,
    ).toBe(true);
    expect(
      resetPasswordFormSchema.safeParse({
        password: "StrongPass#123",
        confirmPassword: "StrongPass#124",
      }).success,
    ).toBe(false);
  });
});
