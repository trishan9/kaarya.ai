import { Role, type TUser } from "@/lib/definitions";
import { computeProfileRating } from "@/lib/compute-profile-rating";

const baseUser = (overrides?: Partial<TUser>): TUser => ({
  id: "u1",
  name: "Test User",
  role: Role.STUDENT,
  ...overrides,
});

describe("lib/compute-profile-rating", () => {
  it("returns fallback result for missing user", () => {
    const result = computeProfileRating(null);

    expect(result.completion).toBe(0);
    expect(result.tierLabel).toBe("STARTER");
    expect(result.categories).toEqual([]);
  });

  it("uses backend profileRating when available", () => {
    const result = computeProfileRating(
      baseUser({
        profileRating: {
          overall: 82,
          tier: "expert",
        },
      }),
    );

    expect(result.completion).toBe(82);
    expect(result.rawScore).toBe(82);
    expect(result.tierLabel).toBe("ELITE");
    expect(result.tierColor).toContain("emerald");
  });

  it("maps summary and suggestion text across backend rating ranges", () => {
    const strong = computeProfileRating(
      baseUser({
        profileRating: { overall: 75, tier: "strong" },
      }),
    );
    expect(strong.summaryText).toContain("Strong profile");
    expect(strong.suggestionBody).toContain("Add certifications");

    const good = computeProfileRating(
      baseUser({
        profileRating: { overall: 55, tier: "intermediate" },
      }),
    );
    expect(good.summaryText).toContain("Good progress");
    expect(good.suggestionBody).toContain("Add experience");

    const developing = computeProfileRating(
      baseUser({
        profileRating: { overall: 30, tier: "developing" },
      }),
    );
    expect(developing.summaryText).toContain("30% complete");
    expect(developing.suggestionBody).toContain("Add education");
  });

  it("falls back to starter meta for unknown backend tier", () => {
    const result = computeProfileRating(
      baseUser({
        profileRating: {
          overall: 10,
          tier: "unknown-tier" as any,
        },
      }),
    );

    expect(result.tierLabel).toBe("STARTER");
    expect(result.tierColor).toContain("zinc");
  });

  it("computes a high completion profile from candidate data", () => {
    const result = computeProfileRating(
      baseUser({
        email: "user@example.com",
        photo: "https://cdn.test/avatar.png",
        candidateProfile: {
          headline: "Backend Engineer",
          phone: "+1-202-555-0100",
          location: "NYC",
          summary: "Experienced backend engineer focused on reliability.",
          portfolioUrl: "https://portfolio.test",
          linkedinUrl: "https://linkedin.com/in/test",
          githubUrl: "https://github.com/test",
          preferredRoles: ["Backend Engineer"],
          preferredWorkModes: ["remote"],
          defaultResumeId: "resume-1",
          portfolioLinks: ["https://example.com/project"],
          salary: {
            currency: "USD",
            minAmount: 100000,
          },
          skills: [
            {
              id: "s1",
              name: "Node.js",
              category: "backend",
              proficiency: "expert",
            },
            {
              id: "s2",
              name: "NestJS",
              category: "backend",
              proficiency: "advanced",
            },
            {
              id: "s3",
              name: "TypeScript",
              category: "language",
              proficiency: "expert",
            },
            {
              id: "s4",
              name: "MongoDB",
              category: "database",
              proficiency: "advanced",
            },
            {
              id: "s5",
              name: "Redis",
              category: "cache",
              proficiency: "intermediate",
            },
          ],
          experience: [
            {
              id: "e1",
              jobTitle: "Software Engineer",
              companyName: "Acme",
              description:
                "Built and scaled distributed APIs, improved observability, and reduced p95 latency by over thirty percent.",
            },
          ],
          education: [
            {
              id: "ed1",
              institution: "State University",
              degree: "BSc",
              fieldOfStudy: "Computer Science",
            },
          ],
          certifications: [
            {
              id: "c1",
              name: "Cloud Cert",
              issuer: "CloudOrg",
              credentialUrl: "https://certs.test/cloud",
            },
          ],
        },
      }),
    );

    expect(result.completion).toBeGreaterThanOrEqual(90);
    expect(result.tierLabel).toBe("ELITE");
    expect(result.categories).toHaveLength(4);
  });

  it("produces a starter tier when profile has minimal data", () => {
    const result = computeProfileRating(
      baseUser({
        name: "A",
        candidateProfile: {
          skills: ["Communication" as any],
        },
      }),
    );

    expect(result.completion).toBeLessThan(25);
    expect(result.tierLabel).toBe("STARTER");
    expect(result.summaryText.toLowerCase()).toContain("complete your profile");
  });

  it("computes developing/good/strong tiers without backend profileRating", () => {
    const developing = computeProfileRating(
      baseUser({
        name: "User",
        email: "developing@example.com",
        candidateProfile: {
          preferredRoles: ["Backend Engineer"],
          preferredWorkModes: ["remote"],
          skills: ["Communication" as any],
          experience: [
            {
              id: "e1",
              jobTitle: "Intern",
              companyName: "Acme",
            },
          ],
          education: [
            {
              id: "ed1",
              institution: "State",
              degree: "BSc",
            },
          ],
        },
      }),
    );
    expect(developing.completion).toBeGreaterThanOrEqual(25);
    expect(developing.completion).toBeLessThan(50);
    expect(developing.tierLabel).toBe("DEVELOPING");

    const good = computeProfileRating(
      baseUser({
        email: "good@example.com",
        candidateProfile: {
          preferredRoles: ["Backend Engineer"],
          preferredWorkModes: ["remote"],
          skills: ["Communication" as any],
          experience: [
            {
              id: "e1",
              jobTitle: "Engineer",
              companyName: "Acme",
              description:
                "Worked on backend APIs with observability, monitoring, and reliability improvements over multiple releases.",
            },
          ],
          education: [
            {
              id: "ed1",
              institution: "State",
              degree: "BSc",
            },
          ],
          certifications: [
            {
              id: "c1",
              name: "Cert",
              issuer: "Org",
              credentialUrl: "https://cert.test",
            },
          ],
          defaultResumeId: "r1",
          linkedinUrl: "https://linkedin.com/in/good",
        },
      }),
    );
    expect(good.completion).toBeGreaterThanOrEqual(50);
    expect(good.completion).toBeLessThan(70);
    expect(good.tierLabel).toBe("GOOD");

    const strong = computeProfileRating(
      baseUser({
        email: "strong@example.com",
        candidateProfile: {
          preferredRoles: ["Backend Engineer"],
          preferredWorkModes: ["remote"],
          skills: [
            {
              id: "s1",
              name: "Node.js",
              category: "backend",
              proficiency: "expert",
            },
            {
              id: "s2",
              name: "TypeScript",
              category: "language",
              proficiency: "advanced",
            },
            "Communication" as any,
          ],
          experience: [
            {
              id: "e1",
              jobTitle: "Engineer",
              companyName: "Acme",
              description:
                "Led backend delivery and incident response, improving reliability and throughput with measurable outcomes.",
            },
          ],
          education: [
            {
              id: "ed1",
              institution: "State",
              degree: "BSc",
              fieldOfStudy: "CS",
            },
          ],
          certifications: [
            {
              id: "c1",
              name: "Cert",
              issuer: "Org",
              credentialUrl: "https://cert.test",
            },
          ],
          defaultResumeId: "r1",
          linkedinUrl: "https://linkedin.com/in/strong",
          githubUrl: "https://github.com/strong",
          portfolioUrl: "https://portfolio.strong",
          portfolioLinks: ["https://strong.dev/work"],
          salary: {
            minAmount: 90000,
            currency: "USD",
          },
        },
      }),
    );
    expect(strong.completion).toBeGreaterThanOrEqual(70);
    expect(strong.completion).toBeLessThan(90);
    expect(strong.tierLabel).toBe("STRONG");
  });
});
