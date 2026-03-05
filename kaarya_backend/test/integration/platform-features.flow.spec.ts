import { HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ApiError } from 'src/common/errors/api-error';
import {
  COLLEGE_MESSAGES,
  LEADERBOARD_MESSAGES,
  RESOURCE_MESSAGES,
} from 'src/constants/messages.constants';
import { CollegeService } from 'src/services/college.service';
import { CompanyService } from 'src/services/company.service';
import { CloudinaryService } from 'src/services/cloudinary.service';
import { GeminiService } from 'src/services/gemini.service';
import { LeaderboardService } from 'src/services/leaderboard.service';
import { ResourceCourseService } from 'src/services/resource-course.service';
import { ResumeBuilderService } from 'src/services/resume-builder.service';
import { ResumePdfService } from 'src/services/resume-pdf.service';
import { StreamService } from 'src/services/stream.service';
import { UserService } from 'src/services/user.service';
import { ResourceCourseDifficulty } from 'src/types/resource-course-difficulty.enum';
import { ResourceCourseGenerationMode } from 'src/types/resource-course-generation-mode.enum';
import { ResourceCourseVisibility } from 'src/types/resource-course-visibility.enum';
import { UserRole } from 'src/types/user-role.enum';
import {
  clearDatabase,
  startInMemoryMongo,
  stopInMemoryMongo,
  TestMongo,
} from '../helpers/mongo';

describe('Platform features flow (integration)', () => {
  let module: TestingModule | undefined;
  let mongo: TestMongo | undefined;
  let userService: UserService;
  let collegeService: CollegeService;
  let companyService: CompanyService;
  let resumeBuilderService: ResumeBuilderService;
  let resourceCourseService: ResourceCourseService;
  let leaderboardService: LeaderboardService;
  let streamService: StreamService;
  let originalStreamEnv: {
    chatApiKey?: string;
    chatSecret?: string;
    videoApiKey?: string;
    videoSecret?: string;
  };

  const toAuthUser = (
    user: { id: string; email: string | null },
    role: UserRole,
  ) => ({
    id: user.id,
    role,
    email: user.email ?? undefined,
  });

  const expectApiError = async (
    promise: Promise<unknown>,
    status: HttpStatus,
    message?: string,
  ) => {
    try {
      await promise;
      throw new Error('Expected ApiError');
    } catch (error) {
      const apiError = error as ApiError;
      expect(apiError.getStatus()).toBe(status);
      if (message) {
        expect(apiError.getResponse()).toMatchObject({ message });
      }
    }
  };

  beforeAll(async () => {
    mongo = await startInMemoryMongo();
    originalStreamEnv = {
      chatApiKey: process.env.STREAM_CHAT_API_KEY,
      chatSecret: process.env.STREAM_CHAT_SECRET,
      videoApiKey: process.env.STREAM_VIDEO_API_KEY,
      videoSecret: process.env.STREAM_VIDEO_SECRET,
    };
    process.env.STREAM_CHAT_API_KEY = '';
    process.env.STREAM_CHAT_SECRET = '';
    process.env.STREAM_VIDEO_API_KEY = '';
    process.env.STREAM_VIDEO_SECRET = '';

    const { AppModule } = await import('src/app.module');

    module = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(GeminiService)
      .useValue({
        generateProfessionalSummary: jest
          .fn()
          .mockResolvedValue('Integration mock summary'),
        generateExperienceBullets: jest
          .fn()
          .mockResolvedValue(['Integration bullet one', 'Integration bullet two']),
        generateResumeSuggestions: jest.fn().mockResolvedValue({
          targetRole: 'Backend Engineer',
          jobTitle: 'Backend Developer',
          professionalSummary: 'Integration mock suggestion',
          skills: ['Node.js', 'NestJS'],
        }),
        atsScanResume: jest.fn().mockResolvedValue({
          documentType: 'resume',
          classificationReason: 'Integration mock ATS.',
          overallScore: 82,
          ATS: { score: 82, tips: [] },
          toneAndStyle: { score: 80, tips: [] },
          content: { score: 83, tips: [] },
          structure: { score: 81, tips: [] },
          skills: { score: 84, tips: [] },
        }),
        generateInterviewPrepCourse: jest.fn().mockResolvedValue({
          learningOutcomes: ['Integration learning outcome'],
          aiModel: 'integration-mock-model',
          chapters: [
            {
              title: 'Integration Chapter',
              overview: 'Integration chapter overview',
              estimatedMinutes: 15,
              material: ['Integration chapter material'],
              sections: [],
              learningObjectives: ['Integration objective'],
              coreConcepts: [],
              interviewQuestions: [
                {
                  question: 'Integration question?',
                  whyAsked: 'Integration reason',
                  answerFramework: 'Integration framework',
                  sampleAnswer: 'Integration answer',
                },
              ],
              practicePrompts: ['Integration prompt'],
              youtubeVideos: [],
            },
          ],
        }),
      })
      .overrideProvider(ResumePdfService)
      .useValue({
        generatePdf: jest.fn().mockResolvedValue(Buffer.from('%PDF-1.4 integration')),
      })
      .overrideProvider(CloudinaryService)
      .useValue({
        isCloudinaryConfigured: jest.fn().mockReturnValue(true),
        uploadDocument: jest.fn().mockResolvedValue({
          publicId: 'integration/mock/pdf',
          url: 'https://cloudinary.test/integration/mock.pdf',
          originalFilename: 'integration-mock.pdf',
          bytes: 1280,
          created_at: new Date().toISOString(),
        }),
      })
      .compile();

    userService = module.get(UserService);
    collegeService = module.get(CollegeService);
    companyService = module.get(CompanyService);
    resumeBuilderService = module.get(ResumeBuilderService);
    resourceCourseService = module.get(ResourceCourseService);
    leaderboardService = module.get(LeaderboardService);
    streamService = module.get(StreamService);
  });

  afterEach(async () => {
    await clearDatabase();
  });

  afterAll(async () => {
    if (module) {
      await module.close();
    }
    if (mongo) {
      await stopInMemoryMongo(mongo);
    }
    process.env.STREAM_CHAT_API_KEY = originalStreamEnv.chatApiKey;
    process.env.STREAM_CHAT_SECRET = originalStreamEnv.chatSecret;
    process.env.STREAM_VIDEO_API_KEY = originalStreamEnv.videoApiKey;
    process.env.STREAM_VIDEO_SECRET = originalStreamEnv.videoSecret;
  });

  it('should complete resume builder + resource course service composition flow', async () => {
    const student = await userService.createUser({
      name: 'Integration Student Feature',
      email: 'integration.student.feature@example.com',
      role: UserRole.STUDENT,
    });
    const recruiter = await userService.createUser({
      name: 'Integration Recruiter Feature',
      email: 'integration.recruiter.feature@example.com',
      role: UserRole.RECRUITER,
    });
    const collegeUser = await userService.createUser({
      name: 'Integration College Feature',
      email: 'integration.college.feature@example.com',
      role: UserRole.COLLEGE,
    });

    const studentAuth = toAuthUser(student, UserRole.STUDENT);
    const recruiterAuth = toAuthUser(recruiter, UserRole.RECRUITER);
    const collegeAuth = toAuthUser(collegeUser, UserRole.COLLEGE);

    const company = await companyService.createCompany(recruiterAuth, {
      name: 'Integration Recruiter Company',
      industry: 'Technology',
    });
    if (!company) {
      throw new Error('Expected company workspace');
    }

    const college = await collegeService.createCollege(collegeAuth, {
      name: 'Integration College Workspace',
      institutionType: 'Engineering College',
    });
    if (!college) {
      throw new Error('Expected college workspace');
    }

    await collegeService.joinCollegeByInviteCode(studentAuth, {
      inviteCode: college.inviteCode as string,
      program: 'BSc CSIT',
      year: 3,
    });

    const resumeBuilder = await resumeBuilderService.create(studentAuth, {
      title: 'Integration Resume Draft',
      targetRole: 'Backend Engineer',
      templateId: 'professional',
      content: {
        personalInfo: {
          firstName: 'Integration',
          lastName: 'Student',
        },
        skills: ['Node.js', 'NestJS'],
      },
    });

    const resumeBuilderId = resumeBuilder.id;
    expect(resumeBuilderId).toBeTruthy();

    const listed = await resumeBuilderService.list(studentAuth, {
      page: 1,
      size: 10,
    });
    expect(listed.items.length).toBeGreaterThanOrEqual(1);

    const byId = await resumeBuilderService.getById(studentAuth, resumeBuilderId);
    expect(byId).toEqual(
      expect.objectContaining({
        id: resumeBuilderId,
      }),
    );

    const updated = await resumeBuilderService.update(studentAuth, resumeBuilderId, {
      title: 'Integration Resume Updated',
      content: {
        professionalSummary: 'Designed and shipped reliable backend APIs.',
      },
    });
    expect(updated).toEqual(
      expect.objectContaining({
        id: resumeBuilderId,
        title: 'Integration Resume Updated',
      }),
    );

    const pdf = await resumeBuilderService.generatePdf(studentAuth, resumeBuilderId);
    expect(pdf.pdfUrl).toContain('cloudinary');

    const savedResume = await resumeBuilderService.saveAsResume(
      studentAuth,
      resumeBuilderId,
    );
    expect(savedResume).toEqual(
      expect.objectContaining({
        resumeId: expect.any(String),
        pdfUrl: expect.any(String),
      }),
    );

    const summary = await resumeBuilderService.generateAiSummary(studentAuth, {
      targetRole: 'Backend Engineer',
      skills: ['Node.js'],
    });
    expect(summary.summary).toBe('Integration mock summary');

    const bullets = await resumeBuilderService.generateExperienceBullets(studentAuth, {
      description: 'Built scalable API endpoints and improved response latency.',
      position: 'Backend Engineer',
      company: 'Integration Company',
    });
    expect(Array.isArray(bullets.bullets)).toBe(true);

    const suggestions = await resumeBuilderService.generateAiSuggestions(studentAuth, {
      focus: 'summary',
      targetRole: 'Backend Engineer',
    });
    expect(suggestions.professionalSummary).toBe('Integration mock suggestion');

    await expectApiError(
      resumeBuilderService.atsScan(studentAuth, {} as never, {}),
      HttpStatus.BAD_REQUEST,
      'Resume PDF file is required.',
    );

    const candidateCourse = await resourceCourseService.createResourceCourse(
      studentAuth,
      {
        title: 'Candidate Interview Prep',
        category: 'Interview Preparation',
        generationMode: ResourceCourseGenerationMode.INTERVIEW_PREP,
        difficulty: ResourceCourseDifficulty.INTERMEDIATE,
        targetRoles: ['Backend Engineer'],
        chapterCount: 2,
        chapterTitles: [],
        includeVideoRecommendations: false,
        customVideoUrls: [],
        visibility: ResourceCourseVisibility.PRIVATE,
      },
    );

    const recruiterCourse = await resourceCourseService.createResourceCourse(
      recruiterAuth,
      {
        title: 'Recruiter Workspace Course',
        category: 'Hiring Strategy',
        generationMode: ResourceCourseGenerationMode.LEARN,
        difficulty: ResourceCourseDifficulty.BEGINNER,
        targetRoles: ['Recruiter'],
        chapterCount: 1,
        chapterTitles: [],
        includeVideoRecommendations: false,
        customVideoUrls: [],
        visibility: ResourceCourseVisibility.PRIVATE,
        companyId: company.id as string,
      },
    );

    const collegeCourse = await resourceCourseService.createResourceCourse(
      collegeAuth,
      {
        title: 'College Placement Prep',
        category: 'Campus Placement',
        generationMode: ResourceCourseGenerationMode.LEARN,
        difficulty: ResourceCourseDifficulty.BEGINNER,
        targetRoles: ['Student'],
        chapterCount: 1,
        chapterTitles: [],
        includeVideoRecommendations: false,
        customVideoUrls: [],
        visibility: ResourceCourseVisibility.PRIVATE,
      },
    );
    const candidateCourseId = String(
      (candidateCourse as { id?: string } | null | undefined)?.id ?? '',
    );
    const recruiterCourseId = String(
      (recruiterCourse as { id?: string } | null | undefined)?.id ?? '',
    );
    const collegeCourseId = String(
      (collegeCourse as { id?: string } | null | undefined)?.id ?? '',
    );
    expect(candidateCourseId).toBeTruthy();
    expect(recruiterCourseId).toBeTruthy();
    expect(collegeCourseId).toBeTruthy();

    const listMine = await resourceCourseService.listResourceCourses(studentAuth, {
      page: 1,
      size: 20,
      ownership: 'mine',
      sortBy: 'newest',
    });
    expect(listMine.meta.totalItems).toBeGreaterThanOrEqual(1);

    const candidateCourseById = await resourceCourseService.getResourceCourseById(
      studentAuth,
      candidateCourseId,
    );
    expect(candidateCourseById).toEqual(
      expect.objectContaining({
        id: candidateCourseId,
      }),
    );

    const updatedCourse = await resourceCourseService.updateResourceCourse(
      studentAuth,
      candidateCourseId,
      {
        visibility: ResourceCourseVisibility.PUBLIC,
        regenerateContent: true,
        includeVideoRecommendations: false,
      },
    );
    expect(updatedCourse).toEqual(
      expect.objectContaining({
        id: candidateCourseId,
        visibility: ResourceCourseVisibility.PUBLIC,
      }),
    );

    const deletedCourse = await resourceCourseService.deleteResourceCourse(
      studentAuth,
      candidateCourseId,
    );
    expect(String((deletedCourse as { id?: string }).id)).toBe(candidateCourseId);

    await expectApiError(
      resourceCourseService.getResourceCourseById(studentAuth, candidateCourseId),
      HttpStatus.NOT_FOUND,
      RESOURCE_MESSAGES.NOT_FOUND,
    );

    await expectApiError(
      resourceCourseService.createResourceCourse(studentAuth, {
        title: 'Forbidden Context',
        category: 'Interview',
        generationMode: ResourceCourseGenerationMode.LEARN,
        difficulty: ResourceCourseDifficulty.BEGINNER,
        targetRoles: ['Student'],
        chapterCount: 1,
        chapterTitles: [],
        includeVideoRecommendations: false,
        customVideoUrls: [],
        visibility: ResourceCourseVisibility.PRIVATE,
        companyId: company.id as string,
      }),
      HttpStatus.FORBIDDEN,
      RESOURCE_MESSAGES.FORBIDDEN_CREATE,
    );

    const deletedResumeBuilder = await resumeBuilderService.delete(
      studentAuth,
      resumeBuilderId,
    );
    expect(deletedResumeBuilder).toBe(true);
  });

  it('should cover leaderboard and stream service interactions', async () => {
    const student = await userService.createUser({
      name: 'Leaderboard Student',
      email: 'leaderboard.student.integration@example.com',
      role: UserRole.STUDENT,
    });
    const recruiter = await userService.createUser({
      name: 'Leaderboard Recruiter',
      email: 'leaderboard.recruiter.integration@example.com',
      role: UserRole.RECRUITER,
    });
    const collegeUser = await userService.createUser({
      name: 'Leaderboard College',
      email: 'leaderboard.college.integration@example.com',
      role: UserRole.COLLEGE,
    });

    const studentAuth = toAuthUser(student, UserRole.STUDENT);
    const recruiterAuth = toAuthUser(recruiter, UserRole.RECRUITER);
    const collegeAuth = toAuthUser(collegeUser, UserRole.COLLEGE);

    const college = await collegeService.createCollege(collegeAuth, {
      name: 'Leaderboard College Workspace',
    });
    if (!college) {
      throw new Error('Expected leaderboard college workspace');
    }

    await collegeService.joinCollegeByInviteCode(studentAuth, {
      inviteCode: college.inviteCode as string,
      program: 'BSc CSIT',
      year: 2,
    });

    const globalLeaderboard = await leaderboardService.getLeaderboard(studentAuth, {
      scope: 'global',
      page: 1,
      size: 20,
    });
    expect(globalLeaderboard.scope).toBe('global');

    const collegeLeaderboard = await leaderboardService.getLeaderboard(studentAuth, {
      scope: 'college',
      collegeId: college.id as string,
      page: 1,
      size: 20,
    });
    expect(collegeLeaderboard.scope).toBe('college');
    expect(collegeLeaderboard.workspace?.id).toBe(college.id);

    const collegeManagerView = await leaderboardService.getLeaderboard(collegeAuth, {
      scope: 'college',
      page: 1,
      size: 20,
    });
    expect(collegeManagerView.scope).toBe('college');

    await expectApiError(
      leaderboardService.getLeaderboard(recruiterAuth, {
        scope: 'college',
        collegeId: college.id as string,
        page: 1,
        size: 20,
      }),
      HttpStatus.FORBIDDEN,
      LEADERBOARD_MESSAGES.FORBIDDEN,
    );

    await expectApiError(
      leaderboardService.getLeaderboard(recruiterAuth, {
        scope: 'college',
        page: 1,
        size: 20,
      }),
      HttpStatus.FORBIDDEN,
      LEADERBOARD_MESSAGES.FORBIDDEN,
    );

    expect(streamService.isChatConfigured()).toBe(false);
    expect(streamService.isVideoConfigured()).toBe(false);

    await expectApiError(
      (async () => streamService.createChatToken(student.id))(),
      HttpStatus.SERVICE_UNAVAILABLE,
    );

    await expectApiError(
      (async () => streamService.createVideoToken(student.id))(),
      HttpStatus.SERVICE_UNAVAILABLE,
    );

    await expect(streamService.ensureChannelsForUser(studentAuth)).resolves.toBeUndefined();
    await expect(
      streamService.ensureChannelWithUser(studentAuth, recruiter.id),
    ).resolves.toBeUndefined();

    await expectApiError(
      leaderboardService.getLeaderboard(studentAuth, {
        scope: 'college',
        page: 1,
        size: 20,
      }),
      HttpStatus.BAD_REQUEST,
      'collegeId is required for college leaderboard scope.',
    );

    await expectApiError(
      collegeService.joinCollegeByInviteCode(recruiterAuth, {
        inviteCode: college.inviteCode as string,
      }),
      HttpStatus.FORBIDDEN,
      COLLEGE_MESSAGES.STUDENT_ROLE_REQUIRED,
    );
  });
});
