import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CONFIG_KEYS } from 'src/constants/config.constants';
import { UserSchemaClass } from 'src/entities/user.schema';
import { PinoLoggerService } from 'src/logger/pino-logger.service';
import { AllConfigType } from 'src/types/config.type';
import { UserRole } from 'src/types/user-role.enum';
import { EmailService } from './email.service';

type JobMatchInput = {
  jobId: string;
  title: string;
  description: string;
  location: string;
  workMode: string;
  employmentType: string;
  salaryRange: string;
  requirements: Record<string, unknown>;
  company: { name: string; logo: string | null } | null;
};

type CandidateProfile = {
  preferredRoles?: string[];
  preferredLocations?: string[];
  preferredWorkModes?: string[];
  skills?: Array<{ name: string; category?: string }>;
  defaultResumeId?: string | null;
  openToWork?: boolean;
};

const MATCH_THRESHOLD = 30;
const BATCH_SIZE = 100;

const SCORE_WEIGHTS = {
  ROLE: 40,
  SKILLS: 30,
  WORK_MODE: 15,
  LOCATION: 15,
} as const;

@Injectable()
export class JobMatchService {
  private readonly frontendDomain?: string;

  constructor(
    @InjectModel(UserSchemaClass.name)
    private readonly userModel: Model<UserSchemaClass>,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService<AllConfigType>,
    private readonly logger: PinoLoggerService,
  ) {
    this.frontendDomain = this.configService.get(
      CONFIG_KEYS.APP.FRONTEND_DOMAIN,
      { infer: true },
    );
  }

  async processNewJobPosting(job: JobMatchInput): Promise<void> {
    try {
      let skip = 0;
      let hasMore = true;

      while (hasMore) {
        const candidates = await this.findCandidateBatch(skip, BATCH_SIZE);
        if (candidates.length === 0) {
          hasMore = false;
          break;
        }

        const notifications: Promise<void>[] = [];

        for (const candidate of candidates) {
          const profile =
            candidate.candidateProfile as unknown as CandidateProfile | null;
          if (!profile) continue;

          const score = this.computeMatchScore(profile, job);
          if (score >= MATCH_THRESHOLD) {
            notifications.push(
              this.notifyCandidate(candidate, job, score),
            );
          }
        }

        await Promise.allSettled(notifications);

        skip += BATCH_SIZE;
        hasMore = candidates.length === BATCH_SIZE;
      }
    } catch (error) {
      this.logger.error(
        `Job matching failed for job ${job.jobId}: ${error instanceof Error ? error.message : error}`,
        undefined,
        JobMatchService.name,
      );
    }
  }

  computeMatchScore(profile: CandidateProfile, job: JobMatchInput): number {
    let score = 0;

    score += this.scoreRoleMatch(profile.preferredRoles, job.title);
    score += this.scoreSkillsMatch(profile.skills, job);
    score += this.scoreWorkModeMatch(profile.preferredWorkModes, job.workMode);
    score += this.scoreLocationMatch(profile.preferredLocations, job.location);

    return Math.min(100, Math.round(score));
  }

  private scoreRoleMatch(
    preferredRoles: string[] | undefined,
    jobTitle: string,
  ): number {
    if (!preferredRoles?.length || !jobTitle) return 0;

    const titleTokens = this.tokenize(jobTitle);
    let bestOverlap = 0;

    for (const role of preferredRoles) {
      const roleTokens = this.tokenize(role);
      if (roleTokens.length === 0) continue;

      if (jobTitle.toLowerCase().includes(role.toLowerCase())) {
        return SCORE_WEIGHTS.ROLE;
      }

      if (role.toLowerCase().includes(jobTitle.toLowerCase())) {
        return SCORE_WEIGHTS.ROLE;
      }

      const overlap = roleTokens.filter((token) =>
        titleTokens.includes(token),
      ).length;
      const ratio = overlap / Math.max(roleTokens.length, 1);
      bestOverlap = Math.max(bestOverlap, ratio);
    }

    return Math.round(bestOverlap * SCORE_WEIGHTS.ROLE);
  }

  private scoreSkillsMatch(
    skills: Array<{ name: string }> | undefined,
    job: JobMatchInput,
  ): number {
    if (!skills?.length) return 0;

    const skillNames = skills.map((s) => s.name.toLowerCase());

    const requiredSkills = this.extractRequiredSkills(job.requirements);
    const descriptionLower = job.description.toLowerCase();

    if (requiredSkills.length > 0) {
      const matched = requiredSkills.filter((req) =>
        skillNames.some(
          (skill) => skill.includes(req) || req.includes(skill),
        ),
      );
      const ratio = matched.length / requiredSkills.length;
      return Math.round(ratio * SCORE_WEIGHTS.SKILLS);
    }

    let descriptionMatches = 0;
    for (const skillName of skillNames) {
      if (descriptionLower.includes(skillName)) {
        descriptionMatches++;
      }
    }

    if (skillNames.length === 0) return 0;
    const ratio = Math.min(1, descriptionMatches / Math.min(skillNames.length, 5));
    return Math.round(ratio * SCORE_WEIGHTS.SKILLS * 0.7);
  }

  private scoreWorkModeMatch(
    preferredWorkModes: string[] | undefined,
    jobWorkMode: string,
  ): number {
    if (!preferredWorkModes?.length || !jobWorkMode) return 0;

    const normalizedJobMode = jobWorkMode.toLowerCase();
    const matches = preferredWorkModes.some(
      (mode) => mode.toLowerCase() === normalizedJobMode,
    );

    return matches ? SCORE_WEIGHTS.WORK_MODE : 0;
  }

  private scoreLocationMatch(
    preferredLocations: string[] | undefined,
    jobLocation: string,
  ): number {
    if (!preferredLocations?.length || !jobLocation) return 0;

    const locationLower = jobLocation.toLowerCase();

    if (locationLower === 'remote') return SCORE_WEIGHTS.LOCATION;

    for (const preferred of preferredLocations) {
      const prefLower = preferred.toLowerCase();
      if (
        locationLower.includes(prefLower) ||
        prefLower.includes(locationLower)
      ) {
        return SCORE_WEIGHTS.LOCATION;
      }

      const prefTokens = this.tokenize(preferred);
      const locTokens = this.tokenize(jobLocation);
      const overlap = prefTokens.filter((t) => locTokens.includes(t)).length;
      if (overlap > 0 && overlap >= Math.min(prefTokens.length, locTokens.length) * 0.5) {
        return Math.round(SCORE_WEIGHTS.LOCATION * 0.7);
      }
    }

    return 0;
  }

  private extractRequiredSkills(
    requirements: Record<string, unknown>,
  ): string[] {
    if (!requirements) return [];

    const skills: string[] = [];

    const rawSkills = requirements.skills ?? requirements.requiredSkills;
    if (Array.isArray(rawSkills)) {
      for (const item of rawSkills) {
        if (typeof item === 'string' && item.trim()) {
          skills.push(item.trim().toLowerCase());
        }
      }
    }

    return skills;
  }

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .split(/[\s\-_/,;:.()+]+/)
      .filter((t) => t.length > 1);
  }

  private async findCandidateBatch(skip: number, limit: number) {
    return await this.userModel
      .find({
        role: { $in: [UserRole.USER, UserRole.STUDENT] },
        'candidateProfile.openToWork': true,
        'candidateProfile.defaultResumeId': { $ne: null },
        email: { $ne: null },
        deletedAt: null,
      })
      .select('email name candidateProfile')
      .skip(skip)
      .limit(limit)
      .lean()
      .exec();
  }

  private async notifyCandidate(
    candidate: { email?: string | null; name?: string | null },
    job: JobMatchInput,
    score: number,
  ): Promise<void> {
    if (!candidate.email) return;

    const jobUrl = this.frontendDomain
      ? `${this.frontendDomain}/jobs/${job.jobId}`
      : `#`;

    try {
      await this.emailService.sendJobMatchNotification(candidate.email, {
        userName: candidate.name,
        jobTitle: job.title,
        companyName: job.company?.name ?? 'a company',
        companyLogo: job.company?.logo,
        location: job.location,
        workMode: job.workMode,
        salaryRange: job.salaryRange,
        employmentType: job.employmentType,
        matchScore: score,
        jobUrl,
      });
    } catch (error) {
      this.logger.error(
        `Failed to send match email to ${candidate.email}: ${error instanceof Error ? error.message : error}`,
        undefined,
        JobMatchService.name,
      );
    }
  }
}
