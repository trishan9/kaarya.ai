import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StreamChat } from 'stream-chat';
import * as jwt from 'jsonwebtoken';
import { isValidObjectId } from 'mongoose';
import { ApiError } from 'src/common/errors/api-error';
import { CONFIG_KEYS } from 'src/constants/config.constants';
import { AllConfigType } from 'src/types/config.type';
import { UserRole } from 'src/types/user-role.enum';
import { TAuthenticatedUser } from 'src/types/authenticated-user.type';
import { ACUserRepository } from 'src/repositories/user.repository';
import { ACCollegeRepository } from 'src/repositories/college.repository';
import { ACStudentRepository } from 'src/repositories/student.repository';
import { ACApplicationRepository } from 'src/repositories/application.repository';
import { ACJobPostingRepository } from 'src/repositories/job-posting.repository';
import { ACRecruiterProfileRepository } from 'src/repositories/recruiter-profile.repository';

@Injectable()
export class StreamService {
  private chatClient: StreamChat | null = null;

  constructor(
    private readonly configService: ConfigService<AllConfigType>,
    private readonly userRepository: ACUserRepository,
    private readonly collegeRepository: ACCollegeRepository,
    private readonly studentRepository: ACStudentRepository,
    private readonly applicationRepository: ACApplicationRepository,
    private readonly jobPostingRepository: ACJobPostingRepository,
    private readonly recruiterProfileRepository: ACRecruiterProfileRepository,
  ) {}

  private getChatClient(): StreamChat {
    if (!this.chatClient) {
      const apiKey = this.getChatApiKey();
      const secret = this.getChatSecret();
      if (!apiKey || !secret) {
        throw new ApiError({
          statusCode: HttpStatus.SERVICE_UNAVAILABLE,
          message: 'Stream Chat is not configured. Please set STREAM_CHAT_API_KEY and STREAM_CHAT_SECRET in your .env file and restart the backend.',
        });
      }
      this.chatClient = StreamChat.getInstance(apiKey, secret);
    }
    return this.chatClient;
  }

  isChatConfigured(): boolean {
    const apiKey = this.getChatApiKey();
    const secret = this.getChatSecret();
    return !!(apiKey && secret);
  }

  isVideoConfigured(): boolean {
    const apiKey = this.getVideoApiKey();
    const secret = this.getVideoSecret();
    return !!(apiKey && secret);
  }

  getChatApiKey(): string | null {
    const value =
      this.configService.get(CONFIG_KEYS.STREAM.CHAT_API_KEY, {
        infer: true,
      }) ?? process.env.STREAM_CHAT_API_KEY;
    const normalized = value?.trim();
    return normalized && normalized.length > 0 ? normalized : null;
  }

  getVideoApiKey(): string | null {
    const value =
      this.configService.get(CONFIG_KEYS.STREAM.VIDEO_API_KEY, {
        infer: true,
      }) ?? process.env.STREAM_VIDEO_API_KEY;
    const normalized = value?.trim();
    if (normalized && normalized.length > 0) {
      return normalized;
    }

    // Stream can use a single app key/secret pair for both chat and video.
    return this.getChatApiKey();
  }

  private getChatSecret(): string | null {
    const value =
      this.configService.get(CONFIG_KEYS.STREAM.CHAT_SECRET, {
        infer: true,
      }) ?? process.env.STREAM_CHAT_SECRET;
    const normalized = value?.trim();
    return normalized && normalized.length > 0 ? normalized : null;
  }

  private getVideoSecret(): string | null {
    const value =
      this.configService.get(CONFIG_KEYS.STREAM.VIDEO_SECRET, {
        infer: true,
      }) ?? process.env.STREAM_VIDEO_SECRET;
    const normalized = value?.trim();
    if (normalized && normalized.length > 0) {
      return normalized;
    }

    // Fallback to chat secret when dedicated video secret is not provided.
    return this.getChatSecret();
  }

  createChatToken(userId: string): string {
    const client = this.getChatClient();
    // Token valid for 24 hours
    const exp = Math.floor(Date.now() / 1000) + 24 * 60 * 60;
    return client.createToken(userId, exp);
  }

  createVideoToken(userId: string, validityInSeconds = 24 * 60 * 60): string {
    const apiKey = this.getVideoApiKey();
    const secret = this.getVideoSecret();
    if (!apiKey || !secret) {
      throw new ApiError({
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
        message: 'Stream Video is not configured. Please set STREAM_VIDEO_API_KEY and STREAM_VIDEO_SECRET.',
      });
    }

    const now = Math.floor(Date.now() / 1000);
    const exp = now + validityInSeconds;
    const payload = {
      user_id: userId,
      iat: now,
      exp,
    };
    return jwt.sign(payload, secret, { algorithm: 'HS256' });
  }

  /**
   * Ensures Stream users and 1:1 channels exist for the current user based on their role.
   * - Recruiter: channels with applicants (students who applied to their company jobs)
   * - College: channels with students in their workspace
   * - Student/User: channels with other students in their college workspace(s)
   */
  async ensureChannelsForUser(currentUser: TAuthenticatedUser): Promise<void> {
    if (!this.isChatConfigured() || !currentUser?.id) return;

    const client = this.getChatClient();
    const userId = this.normalizeUserId(currentUser.id);
    if (!userId) return;

    // Fetch current user for upsert
    const currentUserDoc = await this.userRepository.findById(userId);
    if (!currentUserDoc) return;

    const targets = new Set<string>();

    if (currentUser.role === UserRole.RECRUITER) {
      const companyIds =
        await this.recruiterProfileRepository.findCompanyIdsByRecruiterId(
          userId,
        );
      const allJobIds: string[] = [];
      for (const companyId of companyIds.filter((id) => isValidObjectId(id))) {
        const { jobs } = await this.jobPostingRepository.findAll({
          page: 1,
          size: 500,
          companyId,
        });
        allJobIds.push(...jobs.map((j) => j._id.toString()));
      }
      if (allJobIds.length > 0) {
        const applicantIds =
          await this.applicationRepository.findDistinctStudentIdsByJobIds(
            allJobIds,
          );
        applicantIds.forEach((id) => this.addTargetId(targets, id, userId));
      }
    } else if (currentUser.role === UserRole.COLLEGE) {
      const collegeIds = await this.findManagedCollegeIds(userId);
      for (const collegeId of collegeIds) {
        const studentIds = await this.studentRepository.findStudentIdsByCollegeId(
          collegeId,
        );
        studentIds.forEach((id) => this.addTargetId(targets, id, userId));
      }
    } else if (
      currentUser.role === UserRole.USER ||
      currentUser.role === UserRole.STUDENT
    ) {
      const collegeIds =
        await this.studentRepository.findCollegeIdsByStudentId(userId);
      for (const collegeId of collegeIds.filter((id) => isValidObjectId(id))) {
        const peerIds =
          await this.studentRepository.findStudentIdsByCollegeId(collegeId);
        peerIds.forEach((id) => this.addTargetId(targets, id, userId));
      }
    }

    if (targets.size === 0) return;

    const uniqueTargets = Array.from(targets);
    const users = await this.userRepository.findByIds([userId, ...uniqueTargets]);
    const userMap = new Map(users.map((u) => [u._id.toString(), u]));

    try {
      await this.upsertUsersInStream(client, users);
    } catch (error) {
      throw new ApiError({
        statusCode: HttpStatus.BAD_GATEWAY,
        message: this.toStreamErrorMessage(error, 'Failed to sync Stream users.'),
      });
    }

    let ensuredAnyChannel = false;
    let firstEnsureError: unknown = null;
    const syncedTargetIds = uniqueTargets.filter((targetId) =>
      userMap.has(targetId),
    );

    const batchSize = 10;
    for (let index = 0; index < syncedTargetIds.length; index += batchSize) {
      const batch = syncedTargetIds.slice(index, index + batchSize);
      const batchResults = await Promise.allSettled(
        batch.map(async (targetId) => {
          await this.ensureDirectChannelWithRetry(client, userId, targetId);
        }),
      );

      for (const result of batchResults) {
        if (result.status === 'fulfilled') {
          ensuredAnyChannel = true;
          continue;
        }

        if (!firstEnsureError) {
          firstEnsureError = result.reason;
        }
      }
    }

    if (!ensuredAnyChannel && firstEnsureError) {
      throw new ApiError({
        statusCode: HttpStatus.BAD_GATEWAY,
        message: this.toStreamErrorMessage(
          firstEnsureError,
          'Failed to ensure inbox channels.',
        ),
      });
    }
  }

  /**
   * Ensures a 1:1 channel exists between the current user and a target user.
   * Used when recruiters/colleges start a chat from applicant/student views.
   * Validates permission: recruiters only with applicants, colleges only with their students.
   */
  async ensureChannelWithUser(
    currentUser: TAuthenticatedUser,
    targetUserId: string,
    jobId?: string | null,
  ): Promise<void> {
    if (!this.isChatConfigured() || !currentUser?.id || !targetUserId?.trim()) {
      return;
    }

    const userId = this.normalizeUserId(currentUser.id);
    const targetId = this.normalizeUserId(targetUserId);
    if (!userId || !targetId) {
      throw new ApiError({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Invalid user id supplied for chat.',
      });
    }
    if (userId === targetId) return;

    const canChat = await this.assertCanCreateChannelWith(
      currentUser,
      targetId,
      jobId,
    );
    if (!canChat) {
      throw new ApiError({
        statusCode: HttpStatus.FORBIDDEN,
        message: 'You do not have permission to start a conversation with this user.',
      });
    }

    const client = this.getChatClient();
    const [currentUserDoc, targetUserDoc] = await Promise.all([
      this.userRepository.findById(userId),
      this.userRepository.findById(targetId),
    ]);
    if (!currentUserDoc || !targetUserDoc) return;

    try {
      await this.upsertUsersInStream(client, [currentUserDoc, targetUserDoc]);
      await this.ensureDirectChannelWithRetry(client, userId, targetId);
    } catch (error) {
      throw new ApiError({
        statusCode: HttpStatus.BAD_GATEWAY,
        message: this.toStreamErrorMessage(
          error,
          'Failed to create Stream channel.',
        ),
      });
    }
  }

  private async assertCanCreateChannelWith(
    currentUser: TAuthenticatedUser,
    targetId: string,
    jobId?: string | null,
  ): Promise<boolean> {
    if (!isValidObjectId(targetId)) return false;
    const currentUserId = this.normalizeUserId(currentUser.id);
    if (!currentUserId) return false;

    if (currentUser.role === UserRole.RECRUITER) {
      const normalizedJobId = this.normalizeUserId(jobId ?? null);
      if (jobId?.trim() && !normalizedJobId) {
        return false;
      }

      if (normalizedJobId) {
        const job = await this.jobPostingRepository.findById(normalizedJobId);
        if (!job) return false;
        const companyId = job.companyId
          ? (job.companyId as unknown as { toString: () => string }).toString()
          : null;
        if (!companyId) return false;
        const companyIds =
          await this.recruiterProfileRepository.findCompanyIdsByRecruiterId(
            currentUserId,
          );
        if (!companyIds.includes(companyId)) return false;
        const application =
          await this.applicationRepository.findByJobIdAndStudentId(
            normalizedJobId,
            targetId,
          );
        return !!application;
      }

      const companyIds =
        await this.recruiterProfileRepository.findCompanyIdsByRecruiterId(
          currentUserId,
        );
      const allJobIds: string[] = [];
      for (const companyId of companyIds.filter((id) => isValidObjectId(id))) {
        const { jobs } = await this.jobPostingRepository.findAll({
          page: 1,
          size: 500,
          companyId,
        });
        allJobIds.push(...jobs.map((j) => j._id.toString()));
      }
      if (allJobIds.length === 0) return false;
      const applicantIds =
        await this.applicationRepository.findDistinctStudentIdsByJobIds(
          allJobIds,
        );
      return applicantIds.includes(targetId);
    }
    if (currentUser.role === UserRole.COLLEGE) {
      const collegeIds = await this.findManagedCollegeIds(currentUserId);
      if (collegeIds.length === 0) return false;

      for (const collegeId of collegeIds) {
        const studentIds = await this.studentRepository.findStudentIdsByCollegeId(
          collegeId,
        );
        if (studentIds.includes(targetId)) {
          return true;
        }
      }

      return false;
    }
    if (currentUser.role === UserRole.USER || currentUser.role === UserRole.STUDENT) {
      const collegeIds = await this.studentRepository.findCollegeIdsByStudentId(
        currentUserId,
      );
      for (const collegeId of collegeIds.filter((id) => isValidObjectId(id))) {
        const peerIds =
          await this.studentRepository.findStudentIdsByCollegeId(collegeId);
        if (peerIds.includes(targetId)) return true;
      }
    }
    return false;
  }

  private normalizeUserId(value: unknown): string | null {
    if (typeof value === 'string') {
      const normalized = value.trim();
      return normalized && isValidObjectId(normalized) ? normalized : null;
    }

    if (
      value &&
      typeof value === 'object' &&
      'toString' in value &&
      typeof (value as { toString?: unknown }).toString === 'function'
    ) {
      const normalized = (
        value as { toString: () => string }
      ).toString().trim();
      return normalized && isValidObjectId(normalized) ? normalized : null;
    }

    return null;
  }

  private addTargetId(targets: Set<string>, value: unknown, selfId: string) {
    const normalized = this.normalizeUserId(value);
    if (!normalized || normalized === selfId) return;
    targets.add(normalized);
  }

  private async findManagedCollegeIds(collegeUserId: string): Promise<string[]> {
    if (!collegeUserId) {
      return [];
    }

    const colleges = await this.collegeRepository.findByCreatedBy(collegeUserId);
    return colleges
      .map((college) => this.normalizeUserId(college._id))
      .filter((collegeId): collegeId is string => Boolean(collegeId));
  }

  private async upsertUsersInStream(
    client: StreamChat,
    users: Array<{
      _id: { toString: () => string };
      name?: string | null;
      photo?: string | null;
    }>,
  ) {
    const uniqueById = new Map<
      string,
      {
        id: string;
        name: string;
        image?: string;
      }
    >();

    for (const user of users) {
      const id = user._id.toString();
      if (!id) continue;
      uniqueById.set(id, {
        id,
        name: user.name ?? 'User',
        image: user.photo ?? undefined,
      });
    }

    if (uniqueById.size === 0) return;

    await client.upsertUsers(Array.from(uniqueById.values()));
  }

  private async ensureDirectChannel(
    client: StreamChat,
    userId: string,
    targetId: string,
  ) {
    const members = [userId, targetId].sort();
    const channelData = {
      members,
      created_by: { id: userId },
      created_by_id: userId,
    };
    const channelOptions = {
      created_by: { id: userId },
      created_by_id: userId,
      watch: false,
      state: false,
      presence: false,
    };

    try {
      const channel = client.channel('messaging', null, channelData);
      await channel.create(channelOptions);
    } catch (error) {
      if (this.isChannelAlreadyExistsError(error)) {
        return;
      }

      throw error;
    }
  }

  private async ensureDirectChannelWithRetry(
    client: StreamChat,
    userId: string,
    targetId: string,
    maxAttempts = 4,
  ) {
    let lastError: unknown = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        await this.ensureDirectChannel(client, userId, targetId);
        return;
      } catch (error) {
        lastError = error;

        if (!this.isRetriableStreamError(error) || attempt >= maxAttempts) {
          throw error;
        }

        await this.sleep(attempt * 180);
      }
    }

    if (lastError) {
      throw lastError;
    }
  }

  private isChannelAlreadyExistsError(error: unknown) {
    const status =
      error &&
      typeof error === 'object' &&
      'response' in error &&
      (error as { response?: { status?: number } }).response?.status;
    if (status === 409) {
      return true;
    }

    const message =
      error &&
      typeof error === 'object' &&
      'message' in error &&
      typeof (error as { message?: unknown }).message === 'string'
        ? (error as { message: string }).message.toLowerCase()
        : '';
    return message.includes('already exists');
  }

  private isRetriableStreamError(error: unknown) {
    const status =
      error &&
      typeof error === 'object' &&
      'response' in error &&
      (error as { response?: { status?: number } }).response?.status;
    const numericStatus = typeof status === 'number' ? status : null;

    if (
      numericStatus !== null &&
      [408, 409, 429, 500, 502, 503, 504].includes(numericStatus)
    ) {
      return true;
    }

    const message =
      error &&
      typeof error === 'object' &&
      'message' in error &&
      typeof (error as { message?: unknown }).message === 'string'
        ? (error as { message: string }).message.toLowerCase()
        : '';

    return (
      message.includes('timeout') ||
      message.includes('temporar') ||
      message.includes('rate') ||
      message.includes('try again')
    );
  }

  private async sleep(durationMs: number) {
    await new Promise((resolve) => setTimeout(resolve, durationMs));
  }

  private toStreamErrorMessage(error: unknown, fallback: string) {
    const responseMessage =
      error &&
      typeof error === 'object' &&
      'response' in error &&
      typeof (error as { response?: { data?: { message?: unknown } } }).response
        ?.data?.message === 'string'
        ? (
            error as { response: { data: { message: string } } }
          ).response.data.message
        : null;
    if (responseMessage) {
      return responseMessage;
    }

    const message =
      error &&
      typeof error === 'object' &&
      'message' in error &&
      typeof (error as { message?: unknown }).message === 'string'
        ? (error as { message: string }).message
        : null;
    return message && message.trim().length > 0 ? message : fallback;
  }
}
