import { createJobPostingSchema } from "@/app/(protected)/(dashboard)/jobs/new/_schemas";

describe("create job posting schema", () => {
  it("accepts valid payload", () => {
    const parsed = createJobPostingSchema.safeParse({
      title: "Senior Backend Engineer",
      description:
        "<p>Design, build, and maintain backend systems and APIs for high-scale workloads.</p>",
      workMode: "remote",
      deadline: "2030-01-01T00:00:00.000Z",
      skills: ["Node.js", "NestJS"],
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects invalid description and date", () => {
    const parsed = createJobPostingSchema.safeParse({
      title: "A",
      description: "<p>short</p>",
      workMode: "hybrid",
      deadline: "not-a-date",
    });

    expect(parsed.success).toBe(false);
  });
});
