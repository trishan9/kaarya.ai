import {
  candidateProfileSchema,
  candidateSkillItemSchema,
  skillProofItemSchema,
  updateProfileSchema,
} from "@/app/(protected)/(dashboard)/settings/_components/profile/_schemas";

describe("profile schemas", () => {
  it("validates skill proof item URL rules", () => {
    const valid = skillProofItemSchema.safeParse({
      id: "p1",
      type: "external_link",
      label: "Portfolio",
      url: "https://example.com",
    });
    expect(valid.success).toBe(true);

    const invalid = skillProofItemSchema.safeParse({
      id: "p1",
      type: "external_link",
      label: "Portfolio",
      url: "not-a-url",
    });
    expect(invalid.success).toBe(false);
  });

  it("applies skill defaults and required fields", () => {
    const parsed = candidateSkillItemSchema.parse({
      id: "s1",
      name: "TypeScript",
      category: "Language",
      proficiency: "advanced",
    });
    expect(parsed.proofs).toEqual([]);
  });

  it("normalizes and deduplicates preferred roles and portfolio links", () => {
    const parsed = candidateProfileSchema.parse({
      preferredRoles: [" Backend ", "backend", "Frontend"],
      portfolioLinks: [
        " https://portfolio.test ",
        "https://portfolio.test",
        "https://another.test",
      ],
    });

    expect(parsed.preferredRoles).toEqual(["Backend", "Frontend"]);
    expect(parsed.portfolioLinks).toEqual([
      "https://portfolio.test",
      "https://another.test",
    ]);
  });

  it("validates education and experience chronological constraints", () => {
    const educationFail = candidateProfileSchema.safeParse({
      education: [
        {
          id: "ed1",
          institution: "Uni",
          degree: "BSc",
          startDate: "2024-01",
          endDate: "2023-12",
        },
      ],
    });
    expect(educationFail.success).toBe(false);

    const experienceFail = candidateProfileSchema.safeParse({
      experience: [
        {
          id: "ex1",
          jobTitle: "Engineer",
          companyName: "Acme",
          currentlyWorking: true,
          endDate: "2025-01",
        },
      ],
    });
    expect(experienceFail.success).toBe(false);
  });

  it("validates certification no-expiry rule", () => {
    const parsed = candidateProfileSchema.safeParse({
      certifications: [
        {
          id: "c1",
          name: "Cert",
          issuer: "Org",
          noExpiry: true,
          expiryDate: "2025-01",
        },
      ],
    });
    expect(parsed.success).toBe(false);
  });

  it("validates salary constraints and required metadata", () => {
    const noCurrency = candidateProfileSchema.safeParse({
      salary: { minAmount: 1000, period: "monthly" },
    });
    expect(noCurrency.success).toBe(false);

    const noPeriod = candidateProfileSchema.safeParse({
      salary: { minAmount: 1000, currency: "USD" },
    });
    expect(noPeriod.success).toBe(false);

    const badRange = candidateProfileSchema.safeParse({
      salary: { minAmount: 2000, maxAmount: 1000, currency: "USD", period: "monthly" },
    });
    expect(badRange.success).toBe(false);

    const valid = candidateProfileSchema.safeParse({
      salary: { minAmount: 1000, maxAmount: 2000, currency: "USD", period: "monthly" },
    });
    expect(valid.success).toBe(true);
  });

  it("validates update profile schema with file and candidate profile", () => {
    const file = new File(["avatar"], "avatar.png", { type: "image/png" });
    const parsed = updateProfileSchema.safeParse({
      name: "John Doe",
      email: "john@example.com",
      photo: file,
      candidateProfile: {
        headline: "Engineer",
        openToWork: true,
      },
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects invalid phone/url/date in candidate profile", () => {
    const parsed = candidateProfileSchema.safeParse({
      phone: "bad-phone",
      linkedinUrl: "bad-url",
      education: [
        {
          id: "ed1",
          institution: "Uni",
          degree: "BSc",
          startDate: "01-2025",
        },
      ],
    });
    expect(parsed.success).toBe(false);
  });
});

