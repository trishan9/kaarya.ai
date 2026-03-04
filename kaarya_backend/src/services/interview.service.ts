import { HttpStatus, Injectable } from '@nestjs/common';
import { isValidObjectId, Types } from 'mongoose';
import { ApiError } from 'src/common/errors/api-error';
import { buildPaginationMeta } from 'src/common/utils/pagination';
import { sanitizeDocument } from 'src/common/utils/sanitize-document';
import { INTERVIEW_MESSAGES } from 'src/constants/messages.constants';
import {
  TCompleteInterviewSessionDTO,
  TCreateInterviewDTO,
  TInterviewListQueryDTO,
  TInterviewSessionQueryDTO,
  TStartInterviewSessionDTO,
  TUpdateInterviewDTO,
  TVapiGenerateInterviewDTO,
} from 'src/dtos/interviews/interview.dto';
import { ACAIEvaluationRepository } from 'src/repositories/ai-evaluation.repository';
import { ACBookmarkRepository } from 'src/repositories/bookmark.repository';
import { ACCollegeRepository } from 'src/repositories/college.repository';
import { ACCompanyRepository } from 'src/repositories/company.repository';
import { ACInterviewRepository } from 'src/repositories/interview.repository';
import { ACInterviewSessionRepository } from 'src/repositories/interview-session.repository';
import { TAuthenticatedUser } from 'src/types/authenticated-user.type';
import { BookmarkEntityType } from 'src/types/bookmark-entity-type.enum';
import { InterviewMode } from 'src/types/interview-mode.enum';
import { InterviewSessionStatus } from 'src/types/interview-session-status.enum';
import { InterviewSource } from 'src/types/interview-source.enum';
import { InterviewStatus } from 'src/types/interview-status.enum';
import { InterviewType } from 'src/types/interview-type.enum';
import { InterviewVisibility } from 'src/types/interview-visibility.enum';
import { UserRole } from 'src/types/user-role.enum';
import { UserPlan } from 'src/types/user-plan.enum';
import { CollegeService } from './college.service';
import { InterviewAIService } from './interview-ai.service';
import { RecruiterProfileService } from './recruiter-profile.service';
import { StudentService } from './student.service';
import { UserService } from './user.service';
import { GamificationService } from './gamification.service';

const FREE_MONTHLY_INTERVIEW_LIMIT = 5;

@Injectable()
export class InterviewService {
  constructor(
    private readonly interviewRepository: ACInterviewRepository,
    private readonly bookmarkRepository: ACBookmarkRepository,
    private readonly interviewSessionRepository: ACInterviewSessionRepository,
    private readonly aiEvaluationRepository: ACAIEvaluationRepository,
    private readonly companyRepository: ACCompanyRepository,
    private readonly collegeRepository: ACCollegeRepository,
    private readonly collegeService: CollegeService,
    private readonly recruiterProfileService: RecruiterProfileService,
    private readonly studentService: StudentService,
    private readonly userService: UserService,
    private readonly interviewAIService: InterviewAIService,
    private readonly gamificationService: GamificationService,
  ) {}

  async createInterview(
    currentUser: TAuthenticatedUser,
    payload: TCreateInterviewDTO,
  ) {
    const creationContext = await this.resolveCreationContext(currentUser, payload);

    let questionTexts = Array.isArray(payload.questions)
      ? payload.questions
          .map((question) => question.trim())
          .filter(Boolean)
          .slice(0, payload.questionCount)
      : [];

    const shouldGenerateQuestions = payload.generateQuestions === true;
    if (shouldGenerateQuestions) {
      questionTexts = await this.interviewAIService.generateInterviewQuestions({
        title: payload.title,
        role: payload.role,
        interviewType: payload.interviewType,
        level: payload.level,
        techStack: payload.techStack,
        questionCount: payload.questionCount,
        instructions: payload.instructions,
      });
    }

    if (shouldGenerateQuestions && !questionTexts.length) {
      throw new ApiError({
        statusCode: HttpStatus.BAD_REQUEST,
        message: INTERVIEW_MESSAGES.QUESTIONS_REQUIRED,
      });
    }
    const resolvedQuestionCount = questionTexts.length
      ? questionTexts.length
      : payload.questionCount;

    const createdInterview = await this.interviewRepository.create({
      title: payload.title,
      description: payload.description ?? null,
      interviewType: payload.interviewType,
      role: payload.role,
      level: payload.level ?? null,
      techStack: payload.techStack,
      questionCount: resolvedQuestionCount,
      durationMinutes: payload.durationMinutes,
      questions: questionTexts.map((question, index) => ({
        question,
        order: index + 1,
      })),
      visibility: creationContext.visibility,
      status: creationContext.status,
      source: creationContext.source,
      companyId: creationContext.companyId
        ? new Types.ObjectId(creationContext.companyId)
        : null,
      collegeId: creationContext.collegeId
        ? new Types.ObjectId(creationContext.collegeId)
        : null,
      createdBy: new Types.ObjectId(currentUser.id),
      tags: payload.tags,
      instructions: payload.instructions ?? null,
      generationMeta: {
        generatedAt: new Date().toISOString(),
        generatedWithAI: shouldGenerateQuestions && questionTexts.length > 0,
        requestedQuestionCount: resolvedQuestionCount,
      },
      aiGenerated: shouldGenerateQuestions && questionTexts.length > 0,
    });

    return await this.buildInterviewResponse(createdInterview, currentUser.id);
  }

  async getVoiceCreationConfig(currentUser: TAuthenticatedUser) {
    const workflowId =
      process.env.VAPI_INTERVIEW_CREATE_WORKFLOW_ID ??
      process.env.VAPI_WORKFLOW_ID ??
      null;
    const webToken = process.env.VAPI_WEB_TOKEN ?? null;

    if (!webToken) {
      throw new ApiError({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: INTERVIEW_MESSAGES.VAPI_WEB_TOKEN_MISSING,
      });
    }

    if (!workflowId) {
      throw new ApiError({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: INTERVIEW_MESSAGES.VAPI_WORKFLOW_MISSING,
      });
    }

    const user = await this.userService.getUserByIdRaw(currentUser.id);
    const apiBasePrefix = process.env.API_PREFIX ?? 'api';
    const backendDomain = process.env.BACKEND_DOMAIN?.replace(/\/+$/, '') ?? '';
    const webhookAuthHeaderName =
      process.env.VAPI_WEBHOOK_HEADER_NAME?.trim() || 'x-vapi-secret';
    const webhookUrl = backendDomain
      ? `${backendDomain}/${apiBasePrefix}/v1/interviews/vapi/generate`
      : null;

    return {
      vapi: {
        webToken,
        workflowId,
        variableValues: {
          username: user.name ?? 'Candidate',
          useremail: user.email ?? '',
          userid: user.id,
          userId: user.id,
          candidateId: user.id,
          webhookUrl,
          webhookAuthHeaderName,
        },
      },
    };
  }

  async createInterviewFromVapiWebhook(payload: TVapiGenerateInterviewDTO) {
    const creatorUserId =
      payload.userId ??
      payload.userid ??
      payload.candidateId ??
      payload.createdBy ??
      null;
    if (!creatorUserId) {
      throw new ApiError({
        statusCode: HttpStatus.BAD_REQUEST,
        message: INTERVIEW_MESSAGES.VAPI_USER_REQUIRED,
      });
    }

    const creator = await this.userService.getUserByIdRaw(creatorUserId);
    const role = payload.role?.trim();
    if (!role) {
      throw new ApiError({
        statusCode: HttpStatus.BAD_REQUEST,
        message: INTERVIEW_MESSAGES.VAPI_ROLE_REQUIRED,
      });
    }

    const techStackInput =
      (payload.techStack?.length ? payload.techStack : payload.techstack ?? [])
        .map((item) => item.trim())
        .filter(Boolean);
    const questionCountRaw = payload.questionCount ?? payload.amount ?? 8;
    const questionCount = Math.min(20, Math.max(1, Math.round(questionCountRaw)));
    const durationMinutes = Math.min(
      120,
      Math.max(5, Math.round(payload.durationMinutes ?? 25)),
    );
    const interviewType = this.normalizeInterviewType(
      payload.interviewType ?? payload.type,
    );
    const title =
      payload.title?.trim() ||
      `${role} ${this.getInterviewTypeLabel(interviewType)} Mock Interview`;
    const instructions = payload.instructions?.trim() ?? undefined;
    const customQuestions = (payload.questions ?? [])
      .map((item) => item.trim())
      .filter(Boolean);
    const generateQuestions =
      typeof payload.generateQuestions === 'boolean'
        ? payload.generateQuestions
        : false;

    return await this.createInterview(
      {
        id: creator.id,
        role: creator.role as UserRole,
        email: creator.email ?? undefined,
      },
      {
        title,
        description:
          payload.description?.trim() ||
          `AI voice-created mock interview for ${role}.`,
        interviewType,
        role,
        level: payload.level?.trim() || undefined,
        techStack: Array.from(new Set(techStackInput)),
        questionCount,
        durationMinutes,
        visibility: this.normalizeVisibility(payload.visibility),
        status: this.normalizeStatus(payload.status),
        companyId: payload.companyId ?? undefined,
        collegeId: payload.collegeId ?? undefined,
        tags: (payload.tags ?? []).map((tag) => tag.trim()).filter(Boolean),
        instructions,
        generateQuestions,
        questions: customQuestions,
      },
    );
  }

  assertVapiWebhookSecret(secret: string | null | undefined) {
    const configuredSecret =
      process.env.VAPI_WEBHOOK_SECRET ?? process.env.VAPI_PRIVATE_KEY ?? null;
    if (!configuredSecret) {
      throw new ApiError({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: INTERVIEW_MESSAGES.VAPI_WEBHOOK_SECRET_MISSING,
      });
    }

    if (!secret || secret.trim() !== configuredSecret.trim()) {
      throw new ApiError({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: INTERVIEW_MESSAGES.VAPI_WEBHOOK_UNAUTHORIZED,
      });
    }
  }

  extractVapiWebhookSecret(
    headers: Record<string, string | string[] | undefined> = {},
  ) {
    const getHeaderValue = (headerName: string) => {
      const rawValue = headers[headerName];
      if (Array.isArray(rawValue)) {
        return rawValue[0]?.trim();
      }
      return rawValue?.trim();
    };

    const configuredHeaderName = (
      process.env.VAPI_WEBHOOK_HEADER_NAME ?? ''
    ).trim();

    const headerCandidates = [
      configuredHeaderName,
      'x-vapi-secret',
      'x-vapi-private-key',
      'x-api-key',
      'x-webhook-secret',
    ]
      .map((headerName) => headerName.trim().toLowerCase())
      .filter(Boolean);

    for (const headerName of headerCandidates) {
      const secret = getHeaderValue(headerName);
      if (secret) {
        return secret;
      }
    }

    const authorization = getHeaderValue('authorization');
    if (authorization?.toLowerCase().startsWith('bearer ')) {
      const bearerSecret = authorization.slice(7).trim();
      if (bearerSecret) {
        return bearerSecret;
      }
    }

    return undefined;
  }

  async listInterviews(
    currentUser: TAuthenticatedUser,
    query: TInterviewListQueryDTO,
  ) {
    const takenInterviewIds =
      query.ownership === 'taken_by_me' || query.ownership === 'not_taken'
        ? await this.interviewSessionRepository.findInterviewIdsByUser(
            currentUser.id,
          )
        : [];

    if (query.ownership === 'taken_by_me' && takenInterviewIds.length === 0) {
      return {
        interviews: [],
        meta: buildPaginationMeta({
          page: query.page,
          size: query.size,
          totalItems: 0,
          search: query.search,
        }),
      };
    }

    const filter = await this.buildInterviewListFilter(currentUser, query, {
      takenInterviewIds,
    });
    const sort = this.resolveInterviewSort(query.sortBy);
    const { interviews, total } = await this.interviewRepository.findAll({
      page: query.page,
      size: query.size,
      filter,
      sort,
    });

    const interviewIds = interviews.map((interview) => interview.id);
    const [
      latestSessionsByInterviewId,
      latestEvaluationsByInterviewId,
      savedInterviewIds,
    ] =
      await Promise.all([
        this.interviewSessionRepository.findLatestByUserAndInterviewIds({
          userId: currentUser.id,
          interviewIds,
        }),
        this.aiEvaluationRepository.findLatestByUserAndInterviewIds({
          userId: currentUser.id,
          interviewIds,
        }),
        this.buildSavedInterviewIdSet(currentUser, interviewIds),
      ]);
    const companyMap = await this.buildCompanyMap(
      interviews
        .map((interview) =>
          interview.companyId ? interview.companyId.toString() : null,
        )
        .filter(Boolean) as string[],
    );
    const collegeMap = await this.buildCollegeMap(
      interviews
        .map((interview) =>
          interview.collegeId ? interview.collegeId.toString() : null,
        )
        .filter(Boolean) as string[],
    );

    return {
      interviews: (
        await Promise.all(
          interviews.map((interview) =>
            this.buildInterviewResponse(interview, currentUser.id, {
              companyMap,
              collegeMap,
              latestSessionsByInterviewId,
              latestEvaluationsByInterviewId,
              savedInterviewIds,
            }),
          ),
        )
      ).filter(Boolean),
      meta: buildPaginationMeta({
        page: query.page,
        size: query.size,
        totalItems: total,
        search: query.search,
      }),
    };
  }

  async getInterviewById(currentUser: TAuthenticatedUser, interviewId: string) {
    const interview = await this.getInterviewByIdRaw(interviewId);
    await this.assertCanAccessInterview(currentUser, interview);

    const [latestSession, latestEvaluation, savedInterviewIds] =
      await Promise.all([
        this.interviewSessionRepository.findLatestByUserAndInterviewIds({
          userId: currentUser.id,
          interviewIds: [interview.id],
        }),
        this.aiEvaluationRepository.findLatestByUserAndInterviewIds({
          userId: currentUser.id,
          interviewIds: [interview.id],
        }),
        this.buildSavedInterviewIdSet(currentUser, [interview.id]),
      ]);

    const companyMap = await this.buildCompanyMap(
      interview.companyId ? [interview.companyId.toString()] : [],
    );
    const collegeMap = await this.buildCollegeMap(
      interview.collegeId ? [interview.collegeId.toString()] : [],
    );

    return await this.buildInterviewResponse(interview, currentUser.id, {
      companyMap,
      collegeMap,
      latestSessionsByInterviewId: latestSession,
      latestEvaluationsByInterviewId: latestEvaluation,
      savedInterviewIds,
      includeQuestions: true,
      includeCreator: true,
    });
  }

  async updateInterview(
    currentUser: TAuthenticatedUser,
    interviewId: string,
    payload: TUpdateInterviewDTO,
  ) {
    const interview = await this.getInterviewByIdRaw(interviewId);
    await this.assertCanManageInterview(currentUser, interview);

    let questions = payload.questions;
    if (payload.generateQuestions === true) {
      questions = await this.interviewAIService.generateInterviewQuestions({
        title: payload.title ?? interview.title,
        role: payload.role ?? interview.role,
        interviewType: payload.interviewType ?? interview.interviewType,
        level: payload.level ?? interview.level ?? null,
        techStack: payload.techStack ?? interview.techStack ?? [],
        questionCount: payload.questionCount ?? interview.questionCount,
        instructions: payload.instructions ?? interview.instructions ?? null,
      });
    }

    const updatePayload: Record<string, unknown> = { ...payload };
    delete updatePayload.generateQuestions;

    if (questions) {
      updatePayload.questions = questions.map((question, index) => ({
        question,
        order: index + 1,
      }));
      updatePayload.questionCount = questions.length;
      updatePayload.aiGenerated = true;
      updatePayload.generationMeta = {
        ...(interview.generationMeta ?? {}),
        regeneratedAt: new Date().toISOString(),
      };
    }

    const updatedInterview = await this.interviewRepository.updateById(
      interview.id,
      updatePayload,
    );
    if (!updatedInterview) {
      throw new ApiError({
        statusCode: HttpStatus.NOT_FOUND,
        message: INTERVIEW_MESSAGES.NOT_FOUND,
      });
    }

    return await this.buildInterviewResponse(updatedInterview, currentUser.id, {
      includeQuestions: true,
      includeCreator: true,
    });
  }

  async deleteInterview(currentUser: TAuthenticatedUser, interviewId: string) {
    const interview = await this.getInterviewByIdRaw(interviewId);
    await this.assertCanManageInterview(currentUser, interview);

    const deletedInterview = await this.interviewRepository.deleteById(
      interview.id,
    );
    if (!deletedInterview) {
      throw new ApiError({
        statusCode: HttpStatus.NOT_FOUND,
        message: INTERVIEW_MESSAGES.NOT_FOUND,
      });
    }

    return sanitizeDocument(deletedInterview);
  }

  async startInterviewSession(
    currentUser: TAuthenticatedUser,
    interviewId: string,
    payload: TStartInterviewSessionDTO,
  ) {
    const canTakeInterview =
      currentUser.role === UserRole.USER || currentUser.role === UserRole.STUDENT;
    if (!canTakeInterview) {
      throw new ApiError({
        statusCode: HttpStatus.FORBIDDEN,
        message: INTERVIEW_MESSAGES.SESSION_ROLE_FORBIDDEN,
      });
    }

    const currentUserDoc = await this.userService.getUserByIdRaw(currentUser.id);
    if (currentUserDoc.plan !== UserPlan.PRO) {
      const now = new Date();
      const monthStart = new Date(
        now.getFullYear(),
        now.getMonth(),
        1,
        0,
        0,
        0,
        0,
      );
      const monthEnd = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0,
        23,
        59,
        59,
        999,
      );

      const monthlySessionCount =
        await this.interviewSessionRepository.countByUserAndCreatedBetween({
          userId: currentUser.id,
          start: monthStart,
          end: monthEnd,
        });

      if (monthlySessionCount >= FREE_MONTHLY_INTERVIEW_LIMIT) {
        throw new ApiError({
          statusCode: HttpStatus.FORBIDDEN,
          message: INTERVIEW_MESSAGES.FREE_PLAN_LIMIT_REACHED,
        });
      }
    }

    const interview = await this.getInterviewByIdRaw(interviewId);
    await this.assertCanAccessInterview(currentUser, interview);
    const sessionQuestions = await this.resolveSessionQuestions({
      title: interview.title,
      role: interview.role,
      interviewType: interview.interviewType,
      level: interview.level ?? null,
      techStack: interview.techStack ?? [],
      questionCount: interview.questionCount ?? 8,
      instructions: interview.instructions ?? null,
      questions: (interview.questions ?? []).map((question) => ({
        question: question.question,
      })),
    });

    const createdSession = await this.interviewSessionRepository.create({
      interviewId: new Types.ObjectId(interview.id),
      userId: new Types.ObjectId(currentUser.id),
      mode: payload.mode ?? InterviewMode.WEB,
      status: InterviewSessionStatus.IN_PROGRESS,
      metadata: {
        ...(payload.metadata ?? {}),
        questionOrder: sessionQuestions.map((question) => question.question),
      },
      startedAt: new Date(),
    });

    await this.gamificationService.awardInterviewStarted({
      userId: currentUser.id,
      interviewId: interview.id,
      sessionId: createdSession.id,
    });

    return {
      session: sanitizeDocument(createdSession),
      interview: await this.buildInterviewResponse(interview, currentUser.id, {
        includeQuestions: true,
      }),
      vapi: {
        webToken: process.env.VAPI_WEB_TOKEN ?? null,
        workflowId: null,
        assistant: this.buildVapiAssistantPayload({
          role: interview.role,
          interviewType: interview.interviewType,
          level: interview.level ?? null,
          techStack: interview.techStack ?? [],
          instructions: interview.instructions ?? null,
          questionCount: interview.questionCount ?? sessionQuestions.length,
          durationMinutes: interview.durationMinutes ?? null,
          questions: sessionQuestions,
        }),
        variableValues: {
          interviewId: interview.id,
          sessionId: createdSession.id,
          candidateId: currentUser.id,
          questions: sessionQuestions
            .map((question) => question.question)
            .join('\n'),
        },
      },
    };
  }

  async completeInterviewSession(
    currentUser: TAuthenticatedUser,
    interviewId: string,
    sessionId: string,
    payload: TCompleteInterviewSessionDTO,
  ) {
    const interview = await this.getInterviewByIdRaw(interviewId);
    const session = await this.getSessionByIdRaw(sessionId);

    if (session.interviewId.toString() !== interview.id) {
      throw new ApiError({
        statusCode: HttpStatus.BAD_REQUEST,
        message: INTERVIEW_MESSAGES.SESSION_MISMATCH,
      });
    }

    const isSessionOwner = session.userId.toString() === currentUser.id;
    if (!isSessionOwner && currentUser.role !== UserRole.ADMIN) {
      throw new ApiError({
        statusCode: HttpStatus.FORBIDDEN,
        message: INTERVIEW_MESSAGES.SESSION_FORBIDDEN,
      });
    }

    const normalizedStatus = payload.status ?? InterviewSessionStatus.COMPLETED;
    const endedAt =
      normalizedStatus === InterviewSessionStatus.IN_PROGRESS ? null : new Date();
    const updatedSession = await this.interviewSessionRepository.updateById(
      session.id,
      {
        status: normalizedStatus,
        transcript: payload.transcript.map((message) => ({
          role: message.role,
          content: message.content,
          timestamp: message.timestamp ?? null,
        })),
        recordingUrl: payload.recordingUrl ?? null,
        vapiCallId: payload.vapiCallId ?? null,
        durationSeconds: payload.durationSeconds ?? null,
        ...(endedAt ? { endedAt } : {}),
      },
    );

    if (!updatedSession) {
      throw new ApiError({
        statusCode: HttpStatus.NOT_FOUND,
        message: INTERVIEW_MESSAGES.SESSION_NOT_FOUND,
      });
    }

    const shouldEvaluate =
      payload.generateEvaluation === true &&
      normalizedStatus === InterviewSessionStatus.COMPLETED &&
      payload.transcript.length > 0;
    const evaluation = shouldEvaluate
      ? await this.interviewAIService.evaluateInterview({
          interviewTitle: interview.title,
          role: interview.role,
          interviewType: interview.interviewType,
          level: interview.level ?? null,
          transcript: payload.transcript.map((message) => ({
            role: message.role,
            content: message.content,
          })),
        })
      : null;

    const savedEvaluation = evaluation
      ? await this.aiEvaluationRepository.upsertBySessionId(updatedSession.id, {
          interviewId: new Types.ObjectId(interview.id),
          sessionId: new Types.ObjectId(updatedSession.id),
          userId: new Types.ObjectId(session.userId.toString()),
          totalScore: evaluation.totalScore,
          categoryScores: evaluation.categoryScores,
          strengths: evaluation.strengths,
          areasForImprovement: evaluation.areasForImprovement,
          finalAssessment: evaluation.finalAssessment,
          model: evaluation.model,
        })
      : null;

    const completedNow =
      session.status !== InterviewSessionStatus.COMPLETED &&
      normalizedStatus === InterviewSessionStatus.COMPLETED;

    if (completedNow) {
      await this.interviewRepository.incrementAttemptsAndTouch(interview.id, 1);
      await this.gamificationService.awardInterviewCompleted({
        userId: session.userId.toString(),
        interviewId: interview.id,
        sessionId: updatedSession.id,
        score:
          savedEvaluation && typeof savedEvaluation.totalScore === 'number'
            ? savedEvaluation.totalScore
            : null,
      });
    }

    return {
      session: sanitizeDocument(updatedSession),
      evaluation: savedEvaluation ? sanitizeDocument(savedEvaluation) : null,
    };
  }

  async listMyInterviewSessions(
    currentUser: TAuthenticatedUser,
    interviewId: string,
    query: TInterviewSessionQueryDTO,
  ) {
    await this.getInterviewById(currentUser, interviewId);

    const { sessions, total } = await this.interviewSessionRepository.findAllByUser(
      {
        userId: currentUser.id,
        interviewId,
        page: query.page,
        size: query.size,
      },
    );

    const rows = await Promise.all(
      sessions.map(async (session) => {
        const evaluation = await this.aiEvaluationRepository.findBySessionId(
          session.id,
        );
        return {
          ...sanitizeDocument(session),
          evaluation: evaluation ? sanitizeDocument(evaluation) : null,
        };
      }),
    );

    return {
      sessions: rows,
      meta: buildPaginationMeta({
        page: query.page,
        size: query.size,
        totalItems: total,
      }),
    };
  }

  async getSessionFeedback(currentUser: TAuthenticatedUser, sessionId: string) {
    const session = await this.getSessionByIdRaw(sessionId);
    const interview = await this.getInterviewByIdRaw(session.interviewId.toString());

    const canView =
      currentUser.role === UserRole.ADMIN ||
      session.userId.toString() === currentUser.id ||
      interview.createdBy.toString() === currentUser.id;
    if (!canView) {
      throw new ApiError({
        statusCode: HttpStatus.FORBIDDEN,
        message: INTERVIEW_MESSAGES.SESSION_FORBIDDEN,
      });
    }

    const evaluation = await this.aiEvaluationRepository.findBySessionId(session.id);
    if (!evaluation) {
      throw new ApiError({
        statusCode: HttpStatus.NOT_FOUND,
        message: INTERVIEW_MESSAGES.EVALUATION_NOT_FOUND,
      });
    }

    return {
      interview: await this.buildInterviewResponse(interview, currentUser.id, {
        includeQuestions: true,
        includeCreator: true,
      }),
      session: sanitizeDocument(session),
      evaluation: sanitizeDocument(evaluation),
    };
  }

  async getInterviewAnalytics(
    currentUser: TAuthenticatedUser,
    interviewId: string,
    query: TInterviewSessionQueryDTO,
  ) {
    const interview = await this.getInterviewByIdRaw(interviewId);
    await this.assertCanManageInterview(currentUser, interview);

    const [{ sessions, total }, participantCount, scoreSummary] = await Promise.all([
      this.interviewSessionRepository.findAllByInterviewId({
        interviewId,
        page: query.page,
        size: query.size,
      }),
      this.interviewSessionRepository.countDistinctUsersByInterview(interviewId),
      this.aiEvaluationRepository.getInterviewScoreSummary(interviewId),
    ]);

    const completedCount = sessions.filter(
      (session) => session.status === InterviewSessionStatus.COMPLETED,
    ).length;
    const completionRate =
      total > 0 ? Math.round((completedCount / Math.max(total, 1)) * 100) : 0;

    const recentSessions = await Promise.all(
      sessions.map(async (session) => {
        let candidate: { id: string; name?: string; email?: string | null } | null =
          null;
        try {
          const user = await this.userService.getUserByIdRaw(
            session.userId.toString(),
          );
          candidate = {
            id: user.id,
            name: user.name ?? undefined,
            email: user.email,
          };
        } catch {
          candidate = {
            id: session.userId.toString(),
          };
        }

        const evaluation = await this.aiEvaluationRepository.findBySessionId(
          session.id,
        );
        return {
          ...sanitizeDocument(session),
          candidate,
          score:
            evaluation && typeof evaluation.totalScore === 'number'
              ? evaluation.totalScore
              : null,
        };
      }),
    );

    return {
      interview: await this.buildInterviewResponse(interview, currentUser.id, {
        includeCreator: true,
      }),
      summary: {
        totalSessions: total,
        uniqueParticipants: participantCount,
        completionRate,
        averageScore: scoreSummary.averageScore,
        highestScore: scoreSummary.highestScore,
        evaluationsCount: scoreSummary.evaluationsCount,
      },
      recentSessions,
      meta: buildPaginationMeta({
        page: query.page,
        size: query.size,
        totalItems: total,
      }),
    };
  }

  private async getInterviewByIdRaw(interviewId: string) {
    if (!interviewId || !isValidObjectId(interviewId)) {
      throw new ApiError({
        statusCode: HttpStatus.BAD_REQUEST,
        message: INTERVIEW_MESSAGES.INVALID_ID,
      });
    }

    const interview = await this.interviewRepository.findById(interviewId);
    if (!interview) {
      throw new ApiError({
        statusCode: HttpStatus.NOT_FOUND,
        message: INTERVIEW_MESSAGES.NOT_FOUND,
      });
    }

    return interview;
  }

  private async getSessionByIdRaw(sessionId: string) {
    if (!sessionId || !isValidObjectId(sessionId)) {
      throw new ApiError({
        statusCode: HttpStatus.BAD_REQUEST,
        message: INTERVIEW_MESSAGES.INVALID_SESSION_ID,
      });
    }

    const session = await this.interviewSessionRepository.findById(sessionId);
    if (!session) {
      throw new ApiError({
        statusCode: HttpStatus.NOT_FOUND,
        message: INTERVIEW_MESSAGES.SESSION_NOT_FOUND,
      });
    }

    return session;
  }

  private async resolveCreationContext(
    currentUser: TAuthenticatedUser,
    payload: TCreateInterviewDTO,
  ) {
    const requestedVisibility = payload.visibility;
    const requestedStatus = payload.status ?? InterviewStatus.PUBLISHED;

    if (currentUser.role === UserRole.ADMIN) {
      return {
        source: payload.companyId
          ? InterviewSource.COMPANY
          : payload.collegeId
            ? InterviewSource.COLLEGE
            : InterviewSource.CANDIDATE,
        visibility:
          requestedVisibility ??
          (payload.collegeId
            ? InterviewVisibility.COLLEGE_ONLY
            : InterviewVisibility.PUBLIC),
        status: requestedStatus,
        companyId: payload.companyId ?? null,
        collegeId: payload.collegeId ?? null,
      };
    }

    if (currentUser.role === UserRole.RECRUITER) {
      const companyId = payload.companyId
        ? await this.recruiterProfileService.resolveWritableCompanyIdForRecruiter({
            recruiterId: currentUser.id,
            requestedCompanyId: payload.companyId,
          })
        : await this.resolveRecruiterDefaultCompanyId(currentUser.id);

      if (!companyId) {
        throw new ApiError({
          statusCode: HttpStatus.BAD_REQUEST,
          message: INTERVIEW_MESSAGES.COMPANY_CONTEXT_REQUIRED,
        });
      }

      return {
        source: InterviewSource.COMPANY,
        visibility: requestedVisibility ?? InterviewVisibility.PUBLIC,
        status: requestedStatus,
        companyId,
        collegeId: null,
      };
    }

    if (currentUser.role === UserRole.COLLEGE) {
      const collegeId = payload.collegeId
        ? (await this.collegeService.assertCanManageCollege(
            currentUser,
            payload.collegeId,
          ),
          payload.collegeId)
        : ((await this.collegeService.getMyCollege(currentUser)).college as {
            id: string;
          }).id;

      return {
        source: InterviewSource.COLLEGE,
        visibility: requestedVisibility ?? InterviewVisibility.COLLEGE_ONLY,
        status: requestedStatus,
        companyId: null,
        collegeId,
      };
    }

    if (payload.companyId || payload.collegeId) {
      throw new ApiError({
        statusCode: HttpStatus.FORBIDDEN,
        message: INTERVIEW_MESSAGES.FORBIDDEN_CREATE,
      });
    }

    return {
      source: InterviewSource.CANDIDATE,
      visibility: requestedVisibility ?? InterviewVisibility.PRIVATE,
      status: requestedStatus,
      companyId: null,
      collegeId: null,
    };
  }

  private async resolveRecruiterDefaultCompanyId(recruiterId: string) {
    const memberships = await this.recruiterProfileService.listRecruiterMemberships({
      recruiterId,
      page: 1,
      size: 2,
    });

    if (!memberships.recruiterProfiles.length) {
      return null;
    }

    if (memberships.recruiterProfiles.length > 1) {
      return null;
    }

    return memberships.recruiterProfiles[0].companyId.toString();
  }

  private async buildInterviewListFilter(
    currentUser: TAuthenticatedUser,
    query: TInterviewListQueryDTO,
    options?: { takenInterviewIds?: string[] },
  ) {
    const andClauses: Record<string, unknown>[] = [];
    const accessClause = await this.buildAccessFilter(currentUser);
    if (Object.keys(accessClause).length) {
      andClauses.push(accessClause);
    }

    if (query.search) {
      andClauses.push({
        $or: [
          { title: { $regex: this.escapeRegex(query.search), $options: 'i' } },
          {
            description: {
              $regex: this.escapeRegex(query.search),
              $options: 'i',
            },
          },
          { role: { $regex: this.escapeRegex(query.search), $options: 'i' } },
        ],
      });
    }

    if (query.status) {
      andClauses.push({ status: query.status });
    }

    if (query.visibility) {
      andClauses.push({ visibility: query.visibility });
    }

    if (query.interviewType) {
      andClauses.push({ interviewType: query.interviewType });
    }

    if (query.companyId) {
      andClauses.push({ companyId: new Types.ObjectId(query.companyId) });
    }

    if (query.collegeId) {
      andClauses.push({ collegeId: new Types.ObjectId(query.collegeId) });
    }

    if (query.ownership === 'created_by_me') {
      andClauses.push({ createdBy: new Types.ObjectId(currentUser.id) });
    }

    const takenInterviewIds = options?.takenInterviewIds ?? [];
    if (query.ownership === 'taken_by_me') {
      andClauses.push({
        _id: {
          $in: takenInterviewIds.map((id) => new Types.ObjectId(id)),
        },
      });
    }

    if (query.ownership === 'not_taken') {
      if (takenInterviewIds.length > 0) {
        andClauses.push({
          _id: {
            $nin: takenInterviewIds.map((id) => new Types.ObjectId(id)),
          },
        });
      }
      andClauses.push({
        status: InterviewStatus.PUBLISHED,
      });
    }

    if (andClauses.length === 0) {
      return {};
    }

    if (andClauses.length === 1) {
      return andClauses[0];
    }

    return { $and: andClauses };
  }

  private resolveInterviewSort(
    sortBy: TInterviewListQueryDTO['sortBy'],
  ): Record<string, 1 | -1> {
    if (sortBy === 'popular') {
      return { attemptsCount: -1, createdAt: -1, _id: -1 };
    }

    if (sortBy === 'updated') {
      return { updatedAt: -1, _id: -1 };
    }

    if (sortBy === 'title') {
      return { title: 1, createdAt: -1, _id: -1 };
    }

    return { createdAt: -1, _id: -1 };
  }

  private async buildAccessFilter(currentUser: TAuthenticatedUser) {
    if (currentUser.role === UserRole.ADMIN) {
      return {};
    }

    const orClauses: Record<string, unknown>[] = [
      { createdBy: new Types.ObjectId(currentUser.id) },
      {
        status: InterviewStatus.PUBLISHED,
        visibility: InterviewVisibility.PUBLIC,
      },
    ];
    const accessibleCollegeIds = await this.listAccessibleCollegeIds(currentUser);
    if (accessibleCollegeIds.length) {
      orClauses.push({
        status: InterviewStatus.PUBLISHED,
        visibility: InterviewVisibility.COLLEGE_ONLY,
        collegeId: {
          $in: accessibleCollegeIds.map((id) => new Types.ObjectId(id)),
        },
      });
    }

    return { $or: orClauses };
  }

  private async listAccessibleCollegeIds(currentUser: TAuthenticatedUser) {
    if (currentUser.role === UserRole.ADMIN) {
      return [];
    }

    if (currentUser.role === UserRole.COLLEGE) {
      try {
        const workspace = await this.collegeService.getMyCollege(currentUser);
        const collegeId = (workspace.college as { id?: string }).id;
        return collegeId ? [collegeId] : [];
      } catch {
        return [];
      }
    }

    if (
      currentUser.role === UserRole.USER ||
      currentUser.role === UserRole.STUDENT
    ) {
      return await this.studentService.listStudentCollegeIds(currentUser.id);
    }

    return [];
  }

  private async assertCanAccessInterview(
    currentUser: TAuthenticatedUser,
    interview: {
      id: string;
      createdBy: Types.ObjectId;
      status: InterviewStatus;
      visibility: InterviewVisibility;
      collegeId?: Types.ObjectId | null;
    },
  ) {
    if (currentUser.role === UserRole.ADMIN) {
      return;
    }

    if (interview.createdBy.toString() === currentUser.id) {
      return;
    }

    if (interview.status !== InterviewStatus.PUBLISHED) {
      throw new ApiError({
        statusCode: HttpStatus.FORBIDDEN,
        message: INTERVIEW_MESSAGES.FORBIDDEN_ACCESS,
      });
    }

    if (interview.visibility === InterviewVisibility.PUBLIC) {
      return;
    }

    if (interview.visibility === InterviewVisibility.PRIVATE) {
      throw new ApiError({
        statusCode: HttpStatus.FORBIDDEN,
        message: INTERVIEW_MESSAGES.FORBIDDEN_ACCESS,
      });
    }

    if (
      interview.visibility === InterviewVisibility.COLLEGE_ONLY &&
      interview.collegeId
    ) {
      const accessibleCollegeIds = await this.listAccessibleCollegeIds(currentUser);
      if (accessibleCollegeIds.includes(interview.collegeId.toString())) {
        return;
      }
    }

    throw new ApiError({
      statusCode: HttpStatus.FORBIDDEN,
      message: INTERVIEW_MESSAGES.FORBIDDEN_ACCESS,
    });
  }

  private async assertCanManageInterview(
    currentUser: TAuthenticatedUser,
    interview: {
      createdBy: Types.ObjectId;
      source: InterviewSource;
      companyId?: Types.ObjectId | null;
      collegeId?: Types.ObjectId | null;
    },
  ) {
    if (currentUser.role === UserRole.ADMIN) {
      return;
    }

    if (interview.createdBy.toString() === currentUser.id) {
      return;
    }

    if (
      interview.source === InterviewSource.COMPANY &&
      currentUser.role === UserRole.RECRUITER &&
      interview.companyId
    ) {
      await this.recruiterProfileService.assertRecruiterMembership({
        recruiterId: currentUser.id,
        companyId: interview.companyId.toString(),
      });
      return;
    }

    if (
      interview.source === InterviewSource.COLLEGE &&
      currentUser.role === UserRole.COLLEGE &&
      interview.collegeId
    ) {
      await this.collegeService.assertCanManageCollege(
        currentUser,
        interview.collegeId.toString(),
      );
      return;
    }

    throw new ApiError({
      statusCode: HttpStatus.FORBIDDEN,
      message: INTERVIEW_MESSAGES.FORBIDDEN_MANAGE,
    });
  }

  private async buildInterviewResponse(
    interview: unknown,
    viewerUserId: string,
    options?: {
      includeQuestions?: boolean;
      includeCreator?: boolean;
      companyMap?: Map<string, { id: string; name: string; logo: string | null }>;
      collegeMap?: Map<string, { id: string; name: string; logo: string | null }>;
      latestSessionsByInterviewId?: Map<string, unknown>;
      latestEvaluationsByInterviewId?: Map<string, unknown>;
      savedInterviewIds?: Set<string>;
    },
  ) {
    const interviewData = sanitizeDocument(interview);
    if (!interviewData) return null;

    const interviewId = String(interviewData.id ?? '');
    const companyId =
      typeof interviewData.companyId === 'string'
        ? interviewData.companyId
        : ((interviewData.companyId as { toString?: () => string } | undefined)
            ?.toString?.() ?? null);
    const collegeId =
      typeof interviewData.collegeId === 'string'
        ? interviewData.collegeId
        : ((interviewData.collegeId as { toString?: () => string } | undefined)
            ?.toString?.() ?? null);
    const company =
      companyId && options?.companyMap ? options.companyMap.get(companyId) : null;
    const college =
      collegeId && options?.collegeMap ? options.collegeMap.get(collegeId) : null;
    const latestSession = options?.latestSessionsByInterviewId?.get(interviewId);
    const latestEvaluation =
      options?.latestEvaluationsByInterviewId?.get(interviewId);
    const isSaved = options?.savedInterviewIds?.has(interviewId) ?? false;

    const response: Record<string, unknown> = {
      ...interviewData,
      company: company ?? null,
      college: college ?? null,
      workspaceType:
        companyId && !collegeId
          ? 'company'
          : collegeId
            ? 'college'
            : 'candidate',
      hasAttempted: Boolean(latestSession),
      myLatestSession: latestSession ? sanitizeDocument(latestSession) : null,
      myLatestEvaluation: latestEvaluation
        ? sanitizeDocument(latestEvaluation)
        : null,
      myLatestSessionId: latestSession
        ? (sanitizeDocument(latestSession)?.id ?? null)
        : null,
      myLatestScore: latestEvaluation
        ? (sanitizeDocument(latestEvaluation)?.totalScore ?? null)
        : null,
      isSaved,
    };

    if (!options?.includeQuestions) {
      delete response.questions;
    }

    if (options?.includeCreator) {
      try {
        const creatorId =
          typeof interviewData.createdBy === 'string'
            ? interviewData.createdBy
            : ((interviewData.createdBy as { toString?: () => string } | undefined)
                ?.toString?.() ?? null);
        if (creatorId) {
          const creator = await this.userService.getUserByIdRaw(creatorId);
          response.creator = {
            id: creator.id,
            name: creator.name,
            email: creator.email,
            role: creator.role,
          };
        }
      } catch {
        response.creator = null;
      }
    }

    if (viewerUserId) {
      response.viewerId = viewerUserId;
    }

    return response;
  }

  private async buildCompanyMap(companyIds: string[]) {
    const validIds = companyIds.filter((id) => isValidObjectId(id));
    if (!validIds.length) {
      return new Map<string, { id: string; name: string; logo: string | null }>();
    }

    const companies = await this.companyRepository.findByIds(validIds);
    const map = new Map<string, { id: string; name: string; logo: string | null }>();
    companies.forEach((company) => {
      map.set(company.id, {
        id: company.id,
        name: company.name,
        logo: company.logo ?? null,
      });
    });
    return map;
  }

  private async buildCollegeMap(collegeIds: string[]) {
    const validIds = collegeIds.filter((id) => isValidObjectId(id));
    if (!validIds.length) {
      return new Map<string, { id: string; name: string; logo: string | null }>();
    }

    const colleges = await this.collegeRepository.findByIds(validIds);
    const map = new Map<string, { id: string; name: string; logo: string | null }>();
    colleges.forEach((college) => {
      map.set(college.id, {
        id: college.id,
        name: college.name,
        logo: college.logo ?? null,
      });
    });
    return map;
  }

  private async buildSavedInterviewIdSet(
    currentUser: TAuthenticatedUser,
    interviewIds: string[],
  ): Promise<Set<string>> {
    if (
      (currentUser.role !== UserRole.STUDENT && currentUser.role !== UserRole.USER) ||
      !interviewIds.length
    ) {
      return new Set<string>();
    }

    return await this.bookmarkRepository.findSavedEntityIds({
      userId: currentUser.id,
      entityType: BookmarkEntityType.INTERVIEW,
      entityIds: interviewIds,
    });
  }

  private async resolveSessionQuestions(interview: {
    title: string;
    role: string;
    interviewType: InterviewType;
    level?: string | null;
    techStack: string[];
    questionCount: number;
    instructions?: string | null;
    questions: Array<{ question: string }>;
  }) {
    const requestedQuestionCount = Math.min(
      20,
      Math.max(1, Math.round(interview.questionCount || 1)),
    );
    const baselineQuestions = (interview.questions ?? [])
      .map((question) => question.question.trim())
      .filter(Boolean);
    const dynamicSessionQuestionsEnabled =
      (process.env.INTERVIEW_DYNAMIC_SESSION_QUESTIONS ?? 'true')
        .trim()
        .toLowerCase() !== 'false';

    if (dynamicSessionQuestionsEnabled) {
      try {
        const variationToken = Math.random().toString(36).slice(2, 8);
        const generatedQuestions =
          await this.interviewAIService.generateInterviewQuestions({
            title: interview.title,
            role: interview.role,
            interviewType: interview.interviewType,
            level: interview.level ?? null,
            techStack: interview.techStack ?? [],
            questionCount: requestedQuestionCount,
            instructions: [
              interview.instructions ?? '',
              baselineQuestions.length
                ? `Reference these baseline prompts but do not copy wording exactly: ${baselineQuestions.join(
                    ' | ',
                  )}`
                : '',
              `Session variation token: ${variationToken}. Use this to avoid repeating the same opening question each attempt.`,
            ]
              .filter(Boolean)
              .join('\n'),
          });

        if (generatedQuestions.length > 0) {
          return generatedQuestions.map((question, index) => ({
            question,
            order: index + 1,
          }));
        }
      } catch {
        // Fall back to stored/fallback questions when dynamic generation is unavailable.
      }
    }

    if (baselineQuestions.length > 0) {
      return this.shuffleQuestions(baselineQuestions)
        .slice(0, requestedQuestionCount)
        .map((question, index) => ({
          question,
          order: index + 1,
        }));
    }

    return this.buildFallbackQuestions({
      role: interview.role,
      interviewType: interview.interviewType,
      techStack: interview.techStack ?? [],
      questionCount: requestedQuestionCount,
    }).map((question, index) => ({
      question,
      order: index + 1,
    }));
  }

  private buildFallbackQuestions(input: {
    role: string;
    interviewType: InterviewType;
    techStack: string[];
    questionCount: number;
  }) {
    const techStackLabel = input.techStack.length
      ? input.techStack.join(', ')
      : 'the relevant tools and frameworks';
    const fallbackPool = [
      `Thanks for joining today. Could you briefly introduce yourself and explain why you are interested in the ${input.role} role?`,
      `Walk me through a project where you used ${techStackLabel}. What were your main technical decisions?`,
      `Describe a difficult problem you solved recently. How did you approach it from start to finish?`,
      `Tell me about a time you had to balance quality and speed. What trade-offs did you make?`,
      `If you joined tomorrow, what would be your first priorities in this ${this.getInterviewTypeLabel(
        input.interviewType,
      )} interview context?`,
    ];

    const questions = this.shuffleQuestions(fallbackPool).slice(
      0,
      Math.min(fallbackPool.length, input.questionCount),
    );

    while (questions.length < input.questionCount) {
      questions.push(
        `Can you share one additional example that demonstrates your readiness for the ${input.role} role?`,
      );
    }

    return questions;
  }

  private buildVapiAssistantPayload(interview: {
    role: string;
    interviewType: string;
    level?: string | null;
    techStack?: string[];
    instructions?: string | null;
    questionCount?: number;
    durationMinutes?: number | null;
    questions: Array<{ question: string }>;
  }) {
    const boundedDurationMinutes = Math.min(
      120,
      Math.max(5, Math.round(interview.durationMinutes ?? 25)),
    );

    const normalizedQuestions = interview.questions
      .map((question) => question.question?.trim())
      .filter(Boolean) as string[];
    const firstQuestion =
      normalizedQuestions[0] ??
      `Tell me about your recent experience relevant to the ${interview.role} role.`;
    const vapiInterviewModel =
      process.env.VAPI_INTERVIEW_MODEL?.trim() || 'gpt-4o-mini';
    const roleLevel = interview.level?.trim() || 'not specified';
    const techStack = interview.techStack?.length
      ? interview.techStack.join(', ')
      : 'not specified';
    const targetQuestionCount = Math.min(
      20,
      Math.max(
        1,
        Math.round(
          interview.questionCount ?? (normalizedQuestions.length || 1),
        ),
      ),
    );
    const greetingMessage = `Hello, thank you for joining this interview today. I am your AI interviewer for the ${interview.role} role. Let us begin. First question: ${firstQuestion}`;

    const rawAssistantName = `Kaarya ${interview.role} Interviewer`.trim();
    const assistantName =
      rawAssistantName.length > 40
        ? rawAssistantName.slice(0, 40).trim()
        : rawAssistantName;

    return {
      name: assistantName,
      firstMessage: greetingMessage,
      maxDurationSeconds: boundedDurationMinutes * 60 + 120,
      silenceTimeoutSeconds: 20,
      endCallMessage: 'This concludes the interview. Thank you for your time.',
      endCallPhrases: [
        'this concludes the interview',
        'that concludes the interview',
        'the interview is now complete',
        'the interview is complete',
        'thank you for your time. goodbye',
        'thank you for your time goodbye',
      ],
      transcriber: {
        provider: 'deepgram',
        model: 'nova-2',
        language: 'en',
      },
      voice: {
        provider: '11labs',
        voiceId: 'sarah',
        stability: 0.45,
        similarityBoost: 0.85,
        speed: 0.95,
        style: 0.6,
        useSpeakerBoost: true,
      },
      model: {
        provider: 'openai',
        model: vapiInterviewModel,
        messages: [
          {
            role: 'system',
            content: `
You are a senior, human-like interviewer with a warm and professional tone.
You are running a ${interview.interviewType} interview for the role: ${interview.role}.
Candidate level: ${roleLevel}
Tech stack focus: ${techStack}
Target questions for this session: ${targetQuestionCount}
Additional interviewer notes: ${interview.instructions?.trim() || 'none'}

Ask questions in this order and wait for candidate response each time:
${normalizedQuestions.map((question) => `- ${question}`).join('\n')}

Rules:
- Keep the conversation sounding natural and human.
- firstMessage already includes greeting + question 1. Do not ask question 1 again.
- After each candidate answer, acknowledge briefly in one sentence before moving to next question.
- Keep responses concise for voice conversation.
- Ask one question at a time.
- If candidate asks to repeat, restate briefly.
- Ask one short follow-up only when needed.
- Ask exactly ${targetQuestionCount} main questions in total.
- If there is only 1 question configured, complete after that answer and one concise closing.
- Ask all listed questions exactly once in sequence.
- After all questions are completed, say exactly: "This concludes the interview. Thank you for your time. Goodbye." and then end the call.
`.trim(),
          },
        ],
      },
    };
  }

  private shuffleQuestions<T>(items: T[]): T[] {
    const copy = [...items];
    for (let index = copy.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
    }
    return copy;
  }

  private normalizeInterviewType(
    value: string | InterviewType | null | undefined,
  ): InterviewType {
    const normalized = (value ?? '').toString().trim().toLowerCase();
    if (!normalized) {
      return InterviewType.MIXED;
    }

    if (normalized === 'behavioural') {
      return InterviewType.BEHAVIORAL;
    }

    if (normalized === 'system design' || normalized === 'system-design') {
      return InterviewType.SYSTEM_DESIGN;
    }

    const validTypes = new Set(Object.values(InterviewType));
    if (validTypes.has(normalized as InterviewType)) {
      return normalized as InterviewType;
    }

    return InterviewType.MIXED;
  }

  private normalizeVisibility(
    value: string | InterviewVisibility | null | undefined,
  ): InterviewVisibility | undefined {
    const normalized = (value ?? '').toString().trim().toLowerCase();
    if (!normalized) return undefined;
    if (normalized === 'public') return InterviewVisibility.PUBLIC;
    if (normalized === 'private') return InterviewVisibility.PRIVATE;
    if (
      normalized === 'college_only' ||
      normalized === 'college-only' ||
      normalized === 'college only'
    ) {
      return InterviewVisibility.COLLEGE_ONLY;
    }
    return undefined;
  }

  private normalizeStatus(
    value: string | InterviewStatus | null | undefined,
  ): InterviewStatus | undefined {
    const normalized = (value ?? '').toString().trim().toLowerCase();
    if (!normalized) return undefined;
    if (normalized === InterviewStatus.DRAFT) return InterviewStatus.DRAFT;
    if (normalized === InterviewStatus.PUBLISHED) {
      return InterviewStatus.PUBLISHED;
    }
    if (normalized === InterviewStatus.ARCHIVED) {
      return InterviewStatus.ARCHIVED;
    }
    return undefined;
  }

  private getInterviewTypeLabel(type: InterviewType): string {
    if (type === InterviewType.TECHNICAL) return 'Technical';
    if (type === InterviewType.BEHAVIORAL) return 'Behavioral';
    if (type === InterviewType.SYSTEM_DESIGN) return 'System Design';
    if (type === InterviewType.CUSTOM) return 'Custom';
    return 'Mixed';
  }

  private escapeRegex(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
