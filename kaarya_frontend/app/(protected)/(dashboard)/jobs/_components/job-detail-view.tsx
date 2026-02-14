import Link from "next/link";
import type { JobDetailPageData } from "../job-detail-data";
import { Button } from "@/components/ui/button";
import { JobApplicationSheet } from "./job-application-sheet";
import { JobCompanyOverviewCard } from "./job-company-overview-card";
import { JobDescriptionPanel } from "./job-description-panel";
import { JobDetailHero } from "./job-detail-hero";
import { JobHighlightsPanel } from "./job-highlights-panel";
import { JobRecruiterManagementPanel } from "./job-recruiter-management-panel";
import { JobSimilarJobsSection } from "./job-similar-jobs-section";

export type JobDetailViewProps = {
  data: JobDetailPageData;
};

export function JobDetailView({ data }: JobDetailViewProps) {
  const isRecruiter = data.isRecruiterView;

  return (
    <div className="space-y-4">
      <JobDetailHero
        id={data.id}
        title={data.title}
        company={data.company}
        locationLabel={data.locationLabel}
        hiringStatusLabel={data.hiringStatusLabel}
        hiringStatusTone={data.hiringStatusTone}
        postedAtLabel={data.postedAtLabel}
        applicantCountLabel={data.applicantCountLabel}
        viewsCountLabel={data.viewsCountLabel}
        logoText={data.logoText}
        logoUrl={data.logoUrl}
        logoClassName={data.logoClassName}
        showBookmark={!isRecruiter}
        isBookmarked={data.isSaved}
        applyAction={
          isRecruiter ? (
            <Button asChild className="h-10 min-w-[180px] rounded-xl">
              <Link href="#recruiter-management">Manage Applicants</Link>
            </Button>
          ) : data.applyLabel === "View My Application" ? (
            <Button asChild className="h-10 min-w-[180px] rounded-xl bg-white text-sm font-semibold text-primary hover:bg-white/90">
              <Link href={data.applyHref ?? "/applications"}>{data.applyLabel}</Link>
            </Button>
          ) : data.applyLabel === "Applications Closed" ? (
            <Button
              type="button"
              disabled
              className="h-10 min-w-[180px] rounded-xl bg-white text-sm font-semibold text-primary"
            >
              {data.applyLabel}
            </Button>
          ) : (
            <JobApplicationSheet
              job={{
                id: data.id,
                title: data.title,
                company: data.company,
                locationLabel: data.locationLabel,
                postedAtLabel: data.postedAtLabel,
                logoText: data.logoText,
                logoUrl: data.logoUrl,
                logoClassName: data.logoClassName,
              }}
              triggerLabel={data.applyLabel}
              sheetTitle="Form Application"
              uploadLabel="Upload Resume/Curriculum Vitae"
              uploadHelperText="Support file: PDF"
              uploadBrowseLabel="choose here"
              coverLetterLabel="Cover Letter"
              coverLetterPlaceholder="Write your cover letter here..."
              portfolioLabel="Link Portfolio"
              portfolioPlaceholder="https://www.example.com"
              addPortfolioLabel="Add portfolio link"
              submitLabel="Submit Application"
              successTitle="Your application has been successfully submitted!"
              successDescription={`Thank you for applying to ${data.company} as ${data.title}. The company received your application and will review it shortly.`}
              doneLabel="Done"
            />
          )
        }
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-4">
          <JobDescriptionPanel
            descriptionTitle="Job Descriptions"
            description={data.description}
            qualificationsTitle="Qualifications"
            qualifications={data.qualifications}
          />
          {isRecruiter ? (
            <JobRecruiterManagementPanel
              jobId={data.id}
              workspaceId={data.workspaceId}
              currentStatus={data.jobStatus}
              applicants={data.applicants}
            />
          ) : null}
          <JobSimilarJobsSection
            title="Similar Jobs"
            seeAllLabel="See All"
            seeAllHref="/jobs"
            jobs={data.similarJobs}
          />
        </div>

        <div className="space-y-4">
          <JobHighlightsPanel
            levelLabel="Level"
            level={data.level}
            experienceLabel="Experience"
            experience={data.experience}
            jobTypeLabel="Job Type"
            jobType={data.jobType}
            workTypeLabel="Work Type"
            workType={data.workType}
            salaryRangeLabel="Salary Range"
            salaryRange={data.salaryRange}
          />
          <JobCompanyOverviewCard
            title="About Company"
            companyName={data.companyProfile.name}
            companyLocation={data.companyProfile.location}
            companyIndustry={data.companyProfile.industry}
            companySize={data.companyProfile.companySize}
            companyDescription={data.companyProfile.description}
            profileActionLabel="View Profile"
            profileHref={data.companyProfile.profileHref}
            logoText={data.logoText}
            logoUrl={data.companyProfile.logoUrl ?? data.logoUrl}
            logoClassName={data.logoClassName}
          />
        </div>
      </div>
    </div>
  );
}
