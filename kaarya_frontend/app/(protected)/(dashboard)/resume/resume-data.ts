import type { ResumeBuilderFormProps } from "./_components/resume-builder-form";
import type { ResumeBuilderHeroProps } from "./_components/resume-builder-hero";

type ResumeBuilderPageFormData = ResumeBuilderFormProps;

export type ResumeBuilderPageData = {
  hero: ResumeBuilderHeroProps;
  form: ResumeBuilderPageFormData;
};

const RESUME_BUILDER_PAGE_DEFAULT_DATA: ResumeBuilderPageData = {
  hero: {
    title: "Let AI do the work, just bring your story.",
    description:
      "Create, review, and instantly share a polished, AI-graded professional resume in minutes. Get clear insights on how your resume performs and present your best self with confidence.",
    previews: [
      {
        id: "preview-1",
        title: "Software Resume",
        subtitle: "ATS-ready",
      },
      {
        id: "preview-2",
        title: "Product Resume",
        subtitle: "Modern layout",
      },
      {
        id: "preview-3",
        title: "Design Resume",
        subtitle: "One-page",
      },
    ],
  },
  form: {
    uploadLabel: "Upload Your Existing Resume/CV",
    uploadRequired: true,
    uploadHelperText: "Support file:",
    uploadAcceptedFileLabel: "PDF, Word",
    uploadBrowseLabel: "choose here",
    uploadAcceptedMimeTypes: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
    uploadMaxFileSizeMb: 8,
    additionalDetailsLabel: "Additional Details",
    additionalDetailsPlaceholder:
      "Enter your detailed prompt here to help us shape your resume more precisely. Include extra details about your background, accomplishments, and strengths, or explain how you want your resume to be aligned with a specific role, industry, or career path. The more context you provide, the more tailored and impactful your resume will be.",
    rolesLabel: "Targeted Roles",
    rolesRequired: true,
    addRoleLabel: "Add role",
    removeRoleLabel: "Remove role",
    initialTargetedRoles: ["Frontend Developer Intern", "React Native Developer"],
    generateButtonLabel: "Generate with AI",
    generatedSummaryTitle: "Resume Generation Request Prepared",
    generatedSummaryDescription:
      "Your inputs are validated and ready. Connect this payload to your resume-generation API endpoint.",
  },
};

export async function getResumeBuilderPageData(): Promise<ResumeBuilderPageData> {
  return RESUME_BUILDER_PAGE_DEFAULT_DATA;
}
