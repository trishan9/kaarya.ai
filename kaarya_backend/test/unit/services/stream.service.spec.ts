import { HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Types } from 'mongoose';
import * as jwt from 'jsonwebtoken';
import { CONFIG_KEYS } from 'src/constants/config.constants';
import { ApiError } from 'src/common/errors/api-error';
import { ACApplicationRepository } from 'src/repositories/application.repository';
import { ACCollegeRepository } from 'src/repositories/college.repository';
import { ACJobPostingRepository } from 'src/repositories/job-posting.repository';
import { ACRecruiterProfileRepository } from 'src/repositories/recruiter-profile.repository';
import { ACStudentRepository } from 'src/repositories/student.repository';
import { ACUserRepository } from 'src/repositories/user.repository';
import { StreamService } from 'src/services/stream.service';
import { UserRole } from 'src/types/user-role.enum';

const channelCreate = jest.fn();
const mockChannel = { create: channelCreate };
const streamClient = {
  createToken: jest.fn(),
  upsertUsers: jest.fn(),
  channel: jest.fn().mockReturnValue(mockChannel),
};

jest.mock('stream-chat', () => ({
  StreamChat: {
    getInstance: jest.fn(() => streamClient),
  },
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
}));

describe('StreamService', () => {
  let service: StreamService;
  let configService: jest.Mocked<ConfigService>;
  let userRepository: jest.Mocked<ACUserRepository>;
  let collegeRepository: jest.Mocked<ACCollegeRepository>;
  let studentRepository: jest.Mocked<ACStudentRepository>;
  let applicationRepository: jest.Mocked<ACApplicationRepository>;
  let jobPostingRepository: jest.Mocked<ACJobPostingRepository>;
  let recruiterProfileRepository: jest.Mocked<ACRecruiterProfileRepository>;

  const userId = new Types.ObjectId().toString();
  const peerId = new Types.ObjectId().toString();
  const peerIdTwo = new Types.ObjectId().toString();
  const companyId = new Types.ObjectId().toString();
  const collegeId = new Types.ObjectId().toString();
  const jobId = new Types.ObjectId().toString();

  const setConfig = (entries: Record<string, string | undefined>) => {
    configService.get.mockImplementation((key: string) => entries[key] as never);
  };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.STREAM_CHAT_API_KEY = '';
    process.env.STREAM_CHAT_SECRET = '';
    process.env.STREAM_VIDEO_API_KEY = '';
    process.env.STREAM_VIDEO_SECRET = '';

    configService = {
      get: jest.fn(),
    } as unknown as jest.Mocked<ConfigService>;

    userRepository = {
      create: jest.fn(),
      findAll: jest.fn(),
      getAnalytics: jest.fn(),
      findById: jest.fn(),
      findByIds: jest.fn(),
      findByEmail: jest.fn(),
      findByProviderSocialId: jest.fn(),
      updateById: jest.fn(),
      deleteById: jest.fn(),
      findCandidateLeaderboardRows: jest.fn(),
      countCandidatesAheadOfUser: jest.fn(),
    } as unknown as jest.Mocked<ACUserRepository>;

    collegeRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByInviteCode: jest.fn(),
      findByIds: jest.fn(),
      findFirstByCreatedBy: jest.fn(),
      findByCreatedBy: jest.fn(),
      updateById: jest.fn(),
      deleteById: jest.fn(),
      findAll: jest.fn(),
    } as unknown as jest.Mocked<ACCollegeRepository>;

    studentRepository = {
      create: jest.fn(),
      findByStudentAndCollege: jest.fn(),
      upsertByStudentAndCollege: jest.fn(),
      findAllByStudentId: jest.fn(),
      findAllByCollegeId: jest.fn(),
      findStudentIdsByCollegeId: jest.fn(),
      findCollegeIdsByStudentId: jest.fn(),
      deleteByStudentAndCollege: jest.fn(),
      deleteManyByCollegeId: jest.fn(),
    } as unknown as jest.Mocked<ACStudentRepository>;

    applicationRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByJobIdAndStudentId: jest.fn(),
      findByJobIdAndStudentIdWithRelations: jest.fn(),
      findByIdForJob: jest.fn(),
      findByStudentAndJobIds: jest.fn(),
      findAllByStudentId: jest.fn(),
      countByStudentWithFilters: jest.fn(),
      getStatusCountsByStudentWithFilters: jest.fn(),
      getDailyCountsByStudentWithFilters: jest.fn(),
      getJobCountsByStudentWithFilters: jest.fn(),
      updateById: jest.fn(),
      findJobIdsByStudentAndStatuses: jest.fn(),
      countByJobId: jest.fn(),
      countByStudentIds: jest.fn(),
      findAllByJobId: jest.fn(),
      findDistinctStudentIdsByJobIds: jest.fn(),
      countByStudentAndResumeId: jest.fn(),
      getStatusCountsByStudentIds: jest.fn(),
      getLeaderboardStatsByStudentIds: jest.fn(),
      getLeaderboardRows: jest.fn(),
    } as unknown as jest.Mocked<ACApplicationRepository>;

    jobPostingRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      updateById: jest.fn(),
      deleteById: jest.fn(),
      deleteManyByCompanyId: jest.fn(),
      deleteManyByCollegeId: jest.fn(),
      incrementViewsCount: jest.fn(),
      setApplicationsCount: jest.fn(),
    } as unknown as jest.Mocked<ACJobPostingRepository>;

    recruiterProfileRepository = {
      create: jest.fn(),
      findFirstByRecruiterId: jest.fn(),
      findByRecruiterAndCompany: jest.fn(),
      upsertByRecruiterAndCompany: jest.fn(),
      existsByRecruiterAndCompany: jest.fn(),
      findAllByRecruiterId: jest.fn(),
      findCompanyIdsByRecruiterId: jest.fn(),
      deleteByRecruiterAndCompany: jest.fn(),
      deleteManyByCompanyId: jest.fn(),
      findAllByCompanyId: jest.fn(),
    } as unknown as jest.Mocked<ACRecruiterProfileRepository>;

    setConfig({});
    streamClient.createToken.mockReturnValue('chat-token');
    streamClient.upsertUsers.mockResolvedValue(undefined);
    (jwt.sign as unknown as jest.Mock).mockReturnValue('video-token');
    channelCreate.mockResolvedValue(undefined);

    service = new StreamService(
      configService,
      userRepository,
      collegeRepository,
      studentRepository,
      applicationRepository,
      jobPostingRepository,
      recruiterProfileRepository,
    );
  });

  it('should resolve stream config flags and token creation', () => {
    setConfig({
      [CONFIG_KEYS.STREAM.CHAT_API_KEY]: 'chat-key',
      [CONFIG_KEYS.STREAM.CHAT_SECRET]: 'chat-secret',
      [CONFIG_KEYS.STREAM.VIDEO_API_KEY]: 'video-key',
      [CONFIG_KEYS.STREAM.VIDEO_SECRET]: 'video-secret',
    });

    expect(service.isChatConfigured()).toBe(true);
    expect(service.isVideoConfigured()).toBe(true);
    expect(service.getChatApiKey()).toBe('chat-key');
    expect(service.getVideoApiKey()).toBe('video-key');
    expect(service.createChatToken(userId)).toBe('chat-token');
    expect(service.createVideoToken(userId, 60)).toBe('video-token');
    expect(jwt.sign).toHaveBeenCalled();
  });

  it('should throw for missing stream chat/video configuration', () => {
    setConfig({
      [CONFIG_KEYS.STREAM.CHAT_API_KEY]: '',
      [CONFIG_KEYS.STREAM.CHAT_SECRET]: '',
      [CONFIG_KEYS.STREAM.VIDEO_API_KEY]: '',
      [CONFIG_KEYS.STREAM.VIDEO_SECRET]: '',
    });

    expect(() => service.createChatToken(userId)).toThrow(ApiError);
    try {
      service.createVideoToken(userId);
      throw new Error('Expected ApiError');
    } catch (error) {
      const apiError = error as ApiError;
      expect(apiError.getStatus()).toBe(HttpStatus.SERVICE_UNAVAILABLE);
    }
  });

  it('should ensure channels for recruiter, college and student roles', async () => {
    setConfig({
      [CONFIG_KEYS.STREAM.CHAT_API_KEY]: 'chat-key',
      [CONFIG_KEYS.STREAM.CHAT_SECRET]: 'chat-secret',
    });
    userRepository.findById.mockResolvedValue({ _id: new Types.ObjectId(userId) } as never);
    userRepository.findByIds.mockResolvedValue([
      { _id: new Types.ObjectId(userId), name: 'Me' },
      { _id: new Types.ObjectId(peerId), name: 'Peer' },
    ] as never);

    recruiterProfileRepository.findCompanyIdsByRecruiterId.mockResolvedValue([
      companyId,
    ]);
    jobPostingRepository.findAll.mockResolvedValue({
      jobs: [{ _id: new Types.ObjectId(jobId) }],
      total: 1,
    } as never);
    applicationRepository.findDistinctStudentIdsByJobIds.mockResolvedValue([peerId]);

    await service.ensureChannelsForUser({
      id: userId,
      role: UserRole.RECRUITER,
    } as never);
    expect(streamClient.upsertUsers).toHaveBeenCalled();
    expect(streamClient.channel).toHaveBeenCalled();

    collegeRepository.findByCreatedBy.mockResolvedValue([
      { _id: new Types.ObjectId(collegeId) },
    ] as never);
    studentRepository.findStudentIdsByCollegeId.mockResolvedValue([peerId]);
    await service.ensureChannelsForUser({
      id: userId,
      role: UserRole.COLLEGE,
    } as never);

    studentRepository.findCollegeIdsByStudentId.mockResolvedValue([collegeId]);
    await service.ensureChannelsForUser({
      id: userId,
      role: UserRole.STUDENT,
    } as never);
  });

  it('should ensure direct channel with permission checks', async () => {
    setConfig({
      [CONFIG_KEYS.STREAM.CHAT_API_KEY]: 'chat-key',
      [CONFIG_KEYS.STREAM.CHAT_SECRET]: 'chat-secret',
    });
    userRepository.findById
      .mockResolvedValueOnce({ _id: new Types.ObjectId(userId), name: 'Me' } as never)
      .mockResolvedValueOnce({ _id: new Types.ObjectId(peerId), name: 'Peer' } as never);
    recruiterProfileRepository.findCompanyIdsByRecruiterId.mockResolvedValue([companyId]);
    jobPostingRepository.findById.mockResolvedValue({
      id: jobId,
      companyId: new Types.ObjectId(companyId),
    } as never);
    applicationRepository.findByJobIdAndStudentId.mockResolvedValue({ id: 'app' } as never);

    await service.ensureChannelWithUser(
      { id: userId, role: UserRole.RECRUITER } as never,
      peerId,
      jobId,
    );
    expect(streamClient.upsertUsers).toHaveBeenCalled();
    expect(streamClient.channel).toHaveBeenCalled();

    await expect(
      service.ensureChannelWithUser(
        { id: userId, role: UserRole.RECRUITER } as never,
        'bad-id',
      ),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it('should cover helper utilities and retry/error branches', async () => {
    const internal = service as any;

    expect(internal.normalizeUserId('bad-id')).toBeNull();
    expect(internal.normalizeUserId(userId)).toBe(userId);
    const targets = new Set<string>();
    internal.addTargetId(targets, peerId, userId);
    internal.addTargetId(targets, userId, userId);
    expect(Array.from(targets)).toEqual([peerId]);

    collegeRepository.findByCreatedBy.mockResolvedValue([
      { _id: new Types.ObjectId(collegeId) },
    ] as never);
    await expect(internal.findManagedCollegeIds(userId)).resolves.toEqual([
      collegeId,
    ]);

    await internal.upsertUsersInStream(streamClient as never, [
      { _id: new Types.ObjectId(userId), name: 'Me', photo: null },
      { _id: new Types.ObjectId(userId), name: 'Me', photo: null },
    ]);
    expect(streamClient.upsertUsers).toHaveBeenCalledTimes(1);

    channelCreate.mockRejectedValueOnce({
      response: { status: 409 },
      message: 'Already exists',
    });
    await expect(
      internal.ensureDirectChannel(streamClient, userId, peerId),
    ).resolves.toBeUndefined();

    channelCreate
      .mockRejectedValueOnce({ response: { status: 503 }, message: 'temporary' })
      .mockResolvedValueOnce(undefined);
    jest.spyOn(internal, 'sleep').mockResolvedValue(undefined);
    await expect(
      internal.ensureDirectChannelWithRetry(streamClient, userId, peerId, 2),
    ).resolves.toBeUndefined();

    channelCreate.mockRejectedValueOnce({ response: { status: 400 }, message: 'bad' });
    await expect(
      internal.ensureDirectChannelWithRetry(streamClient, userId, peerId, 1),
    ).rejects.toEqual(expect.objectContaining({ response: { status: 400 } }));

    expect(internal.isChannelAlreadyExistsError({ response: { status: 409 } })).toBe(
      true,
    );
    expect(
      internal.isRetriableStreamError({ response: { status: 503 }, message: 'try again' }),
    ).toBe(true);
    expect(internal.isRetriableStreamError({ response: { status: 400 } })).toBe(false);
    expect(
      internal.toStreamErrorMessage(
        { response: { data: { message: 'upstream' } } },
        'fallback',
      ),
    ).toBe('upstream');
    expect(internal.toStreamErrorMessage({}, 'fallback')).toBe('fallback');
  });

  it('should cover permission matrix in assertCanCreateChannelWith', async () => {
    const internal = service as any;

    recruiterProfileRepository.findCompanyIdsByRecruiterId.mockResolvedValue([
      companyId,
    ]);
    jobPostingRepository.findById.mockResolvedValue({
      id: jobId,
      companyId: new Types.ObjectId(companyId),
    } as never);
    applicationRepository.findByJobIdAndStudentId.mockResolvedValue({
      id: 'app',
    } as never);
    await expect(
      internal.assertCanCreateChannelWith(
        { id: userId, role: UserRole.RECRUITER },
        peerId,
        jobId,
      ),
    ).resolves.toBe(true);

    collegeRepository.findByCreatedBy.mockResolvedValue([
      { _id: new Types.ObjectId(collegeId) },
    ] as never);
    studentRepository.findStudentIdsByCollegeId.mockResolvedValue([peerId]);
    await expect(
      internal.assertCanCreateChannelWith(
        { id: userId, role: UserRole.COLLEGE },
        peerId,
      ),
    ).resolves.toBe(true);

    studentRepository.findCollegeIdsByStudentId.mockResolvedValue([collegeId]);
    studentRepository.findStudentIdsByCollegeId.mockResolvedValue([peerId]);
    await expect(
      internal.assertCanCreateChannelWith(
        { id: userId, role: UserRole.STUDENT },
        peerId,
      ),
    ).resolves.toBe(true);

    await expect(
      internal.assertCanCreateChannelWith(
        { id: userId, role: UserRole.STUDENT },
        'bad-id',
      ),
    ).resolves.toBe(false);
  });

  it('should throw when stream user upsert fails during channel ensure', async () => {
    setConfig({
      [CONFIG_KEYS.STREAM.CHAT_API_KEY]: 'chat-key',
      [CONFIG_KEYS.STREAM.CHAT_SECRET]: 'chat-secret',
    });
    userRepository.findById.mockResolvedValue({ _id: new Types.ObjectId(userId) } as never);
    userRepository.findByIds.mockResolvedValue([
      { _id: new Types.ObjectId(userId), name: 'Me' },
      { _id: new Types.ObjectId(peerId), name: 'Peer' },
    ] as never);
    recruiterProfileRepository.findCompanyIdsByRecruiterId.mockResolvedValue([
      companyId,
    ]);
    jobPostingRepository.findAll.mockResolvedValue({
      jobs: [{ _id: new Types.ObjectId(jobId) }],
      total: 1,
    } as never);
    applicationRepository.findDistinctStudentIdsByJobIds.mockResolvedValue([peerId]);
    streamClient.upsertUsers.mockRejectedValue({
      response: { data: { message: 'sync failed upstream' } },
    });

    await expect(
      service.ensureChannelsForUser({
        id: userId,
        role: UserRole.RECRUITER,
      } as never),
    ).rejects.toEqual(
      expect.objectContaining({
        response: expect.objectContaining({
          message: 'sync failed upstream',
        }),
      }),
    );
  });

  it('should throw when no direct channel could be ensured for any target', async () => {
    setConfig({
      [CONFIG_KEYS.STREAM.CHAT_API_KEY]: 'chat-key',
      [CONFIG_KEYS.STREAM.CHAT_SECRET]: 'chat-secret',
    });
    userRepository.findById.mockResolvedValue({ _id: new Types.ObjectId(userId) } as never);
    userRepository.findByIds.mockResolvedValue([
      { _id: new Types.ObjectId(userId), name: 'Me' },
      { _id: new Types.ObjectId(peerId), name: 'Peer' },
      { _id: new Types.ObjectId(peerIdTwo), name: 'Peer 2' },
    ] as never);
    recruiterProfileRepository.findCompanyIdsByRecruiterId.mockResolvedValue([
      companyId,
    ]);
    jobPostingRepository.findAll.mockResolvedValue({
      jobs: [{ _id: new Types.ObjectId(jobId) }],
      total: 1,
    } as never);
    applicationRepository.findDistinctStudentIdsByJobIds.mockResolvedValue([
      peerId,
      peerIdTwo,
    ]);
    channelCreate.mockRejectedValue({
      response: { status: 400 },
      message: 'cannot create channel',
    });

    await expect(
      service.ensureChannelsForUser({
        id: userId,
        role: UserRole.RECRUITER,
      } as never),
    ).rejects.toEqual(
      expect.objectContaining({
        response: expect.objectContaining({
          message: 'cannot create channel',
        }),
      }),
    );
  });

  it('should short-circuit direct-channel ensure on blank target id', async () => {
    setConfig({
      [CONFIG_KEYS.STREAM.CHAT_API_KEY]: 'chat-key',
      [CONFIG_KEYS.STREAM.CHAT_SECRET]: 'chat-secret',
    });

    await service.ensureChannelWithUser(
      { id: userId, role: UserRole.RECRUITER } as never,
      '   ',
    );

    expect(userRepository.findById).not.toHaveBeenCalled();
  });

  it('should reject direct-channel creation when permission check fails', async () => {
    setConfig({
      [CONFIG_KEYS.STREAM.CHAT_API_KEY]: 'chat-key',
      [CONFIG_KEYS.STREAM.CHAT_SECRET]: 'chat-secret',
    });
    recruiterProfileRepository.findCompanyIdsByRecruiterId.mockResolvedValue([]);
    jobPostingRepository.findById.mockResolvedValue({
      id: jobId,
      companyId: new Types.ObjectId(companyId),
    } as never);

    await expect(
      service.ensureChannelWithUser(
        { id: userId, role: UserRole.RECRUITER } as never,
        peerId,
        jobId,
      ),
    ).rejects.toEqual(
      expect.objectContaining({
        response: expect.objectContaining({
          message:
            'You do not have permission to start a conversation with this user.',
        }),
      }),
    );
  });

  it('should convert direct-channel provider errors into ApiError responses', async () => {
    setConfig({
      [CONFIG_KEYS.STREAM.CHAT_API_KEY]: 'chat-key',
      [CONFIG_KEYS.STREAM.CHAT_SECRET]: 'chat-secret',
    });
    recruiterProfileRepository.findCompanyIdsByRecruiterId.mockResolvedValue([companyId]);
    jobPostingRepository.findById.mockResolvedValue({
      id: jobId,
      companyId: new Types.ObjectId(companyId),
    } as never);
    applicationRepository.findByJobIdAndStudentId.mockResolvedValue({ id: 'app' } as never);
    userRepository.findById
      .mockResolvedValueOnce({ _id: new Types.ObjectId(userId), name: 'Me' } as never)
      .mockResolvedValueOnce({ _id: new Types.ObjectId(peerId), name: 'Peer' } as never);
    streamClient.upsertUsers.mockRejectedValue({ message: 'upsert exploded' });

    await expect(
      service.ensureChannelWithUser(
        { id: userId, role: UserRole.RECRUITER } as never,
        peerId,
        jobId,
      ),
    ).rejects.toEqual(
      expect.objectContaining({
        response: expect.objectContaining({ message: 'upsert exploded' }),
      }),
    );
  });

  it('should cover remaining assertCanCreateChannelWith branches and helper fallbacks', async () => {
    const internal = service as any;

    await expect(
      internal.assertCanCreateChannelWith(
        { id: userId, role: UserRole.RECRUITER },
        peerId,
        'not-a-valid-job-id',
      ),
    ).resolves.toBe(false);

    recruiterProfileRepository.findCompanyIdsByRecruiterId.mockResolvedValue([
      companyId,
    ]);
    jobPostingRepository.findAll.mockResolvedValue({
      jobs: [{ _id: new Types.ObjectId(jobId) }],
      total: 1,
    } as never);
    applicationRepository.findDistinctStudentIdsByJobIds.mockResolvedValue([peerId]);
    await expect(
      internal.assertCanCreateChannelWith(
        { id: userId, role: UserRole.RECRUITER },
        peerId,
      ),
    ).resolves.toBe(true);

    recruiterProfileRepository.findCompanyIdsByRecruiterId.mockResolvedValue([
      'bad-company-id',
    ]);
    await expect(
      internal.assertCanCreateChannelWith(
        { id: userId, role: UserRole.RECRUITER },
        peerId,
      ),
    ).resolves.toBe(false);

    collegeRepository.findByCreatedBy.mockResolvedValue([
      { _id: new Types.ObjectId(collegeId) },
    ] as never);
    studentRepository.findStudentIdsByCollegeId.mockResolvedValue([
      new Types.ObjectId().toString(),
    ]);
    await expect(
      internal.assertCanCreateChannelWith(
        { id: userId, role: UserRole.COLLEGE },
        peerId,
      ),
    ).resolves.toBe(false);

    await expect(
      internal.assertCanCreateChannelWith(
        { id: userId, role: 'UNKNOWN_ROLE' },
        peerId,
      ),
    ).resolves.toBe(false);

    expect(internal.normalizeUserId(12345)).toBeNull();
    await expect(internal.findManagedCollegeIds('')).resolves.toEqual([]);
  });

  it('should cover sleep helper execution directly', async () => {
    const internal = service as any;
    await expect(internal.sleep(0)).resolves.toBeUndefined();
  });

  it('should cover env fallbacks, early returns, and remaining helper branches', async () => {
    const internal = service as any;

    setConfig({
      [CONFIG_KEYS.STREAM.CHAT_API_KEY]: undefined,
      [CONFIG_KEYS.STREAM.CHAT_SECRET]: undefined,
      [CONFIG_KEYS.STREAM.VIDEO_API_KEY]: undefined,
      [CONFIG_KEYS.STREAM.VIDEO_SECRET]: undefined,
    });
    process.env.STREAM_CHAT_API_KEY = ' env-chat-key ';
    process.env.STREAM_CHAT_SECRET = ' env-chat-secret ';
    process.env.STREAM_VIDEO_API_KEY = '';
    process.env.STREAM_VIDEO_SECRET = '';
    expect(service.getChatApiKey()).toBe('env-chat-key');
    expect(service.getVideoApiKey()).toBe('env-chat-key');
    expect(service.isChatConfigured()).toBe(true);
    expect(service.isVideoConfigured()).toBe(true);

    // ensureChannelsForUser guard paths
    await expect(
      service.ensureChannelsForUser({ id: '', role: UserRole.RECRUITER } as never),
    ).resolves.toBeUndefined();
    await expect(
      service.ensureChannelsForUser({ id: 'bad-id', role: UserRole.RECRUITER } as never),
    ).resolves.toBeUndefined();
    userRepository.findById.mockResolvedValue(null);
    await expect(
      service.ensureChannelsForUser({ id: userId, role: UserRole.RECRUITER } as never),
    ).resolves.toBeUndefined();

    userRepository.findById.mockResolvedValue({ _id: new Types.ObjectId(userId) } as never);
    recruiterProfileRepository.findCompanyIdsByRecruiterId.mockResolvedValue([companyId]);
    jobPostingRepository.findAll.mockResolvedValue({ jobs: [], total: 0 } as never);
    await expect(
      service.ensureChannelsForUser({ id: userId, role: UserRole.RECRUITER } as never),
    ).resolves.toBeUndefined();
    expect(userRepository.findByIds).not.toHaveBeenCalled();

    studentRepository.findCollegeIdsByStudentId.mockResolvedValue(['bad-college-id']);
    await expect(
      service.ensureChannelsForUser({ id: userId, role: UserRole.USER } as never),
    ).resolves.toBeUndefined();

    // ensureChannelWithUser guard and missing-user branches
    await expect(
      service.ensureChannelWithUser(
        { id: userId, role: UserRole.RECRUITER } as never,
        userId,
        jobId,
      ),
    ).resolves.toBeUndefined();

    recruiterProfileRepository.findCompanyIdsByRecruiterId.mockResolvedValue([companyId]);
    jobPostingRepository.findById.mockResolvedValue({
      id: jobId,
      companyId: new Types.ObjectId(companyId),
    } as never);
    applicationRepository.findByJobIdAndStudentId.mockResolvedValue({ id: 'app' } as never);
    userRepository.findById
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ _id: new Types.ObjectId(peerId), name: 'Peer' } as never);
    await expect(
      service.ensureChannelWithUser(
        { id: userId, role: UserRole.RECRUITER } as never,
        peerId,
        jobId,
      ),
    ).resolves.toBeUndefined();

    userRepository.findById
      .mockResolvedValueOnce({ _id: new Types.ObjectId(userId), name: 'Me' } as never)
      .mockResolvedValueOnce(null);
    await expect(
      service.ensureChannelWithUser(
        { id: userId, role: UserRole.RECRUITER } as never,
        peerId,
        jobId,
      ),
    ).resolves.toBeUndefined();

    // assertCanCreateChannelWith uncovered branches
    await expect(
      internal.assertCanCreateChannelWith(
        { id: 'bad-id', role: UserRole.RECRUITER },
        peerId,
      ),
    ).resolves.toBe(false);

    jobPostingRepository.findById.mockResolvedValue(null as never);
    await expect(
      internal.assertCanCreateChannelWith(
        { id: userId, role: UserRole.RECRUITER },
        peerId,
        jobId,
      ),
    ).resolves.toBe(false);

    jobPostingRepository.findById.mockResolvedValue({
      id: jobId,
      companyId: null,
    } as never);
    await expect(
      internal.assertCanCreateChannelWith(
        { id: userId, role: UserRole.RECRUITER },
        peerId,
        jobId,
      ),
    ).resolves.toBe(false);

    collegeRepository.findByCreatedBy.mockResolvedValue([]);
    await expect(
      internal.assertCanCreateChannelWith(
        { id: userId, role: UserRole.COLLEGE },
        peerId,
      ),
    ).resolves.toBe(false);

    studentRepository.findCollegeIdsByStudentId.mockResolvedValue([collegeId]);
    studentRepository.findStudentIdsByCollegeId.mockResolvedValue([peerId]);
    await expect(
      internal.assertCanCreateChannelWith(
        { id: userId, role: UserRole.USER },
        peerId,
      ),
    ).resolves.toBe(true);

    expect(internal.normalizeUserId({ toString: () => 'still-bad' })).toBeNull();
    expect(internal.normalizeUserId(0)).toBeNull();

    await internal.upsertUsersInStream(streamClient as never, [
      { _id: { toString: () => '' }, name: null, photo: null },
    ]);
    expect(streamClient.upsertUsers).not.toHaveBeenCalled();

    await internal.upsertUsersInStream(streamClient as never, [
      { _id: new Types.ObjectId(userId), name: null, photo: null },
    ]);
    expect(streamClient.upsertUsers).toHaveBeenCalledWith([
      { id: userId, name: 'User', image: undefined },
    ]);

    expect(internal.isChannelAlreadyExistsError({ response: { status: 409 } })).toBe(true);
    expect(internal.isRetriableStreamError({ response: { status: 408 } })).toBe(true);
    expect(internal.isRetriableStreamError('boom')).toBe(false);
    expect(internal.isChannelAlreadyExistsError({ message: 123 })).toBe(false);
  });

  it('should evaluate false branches for unknown roles and non-peer user checks', async () => {
    setConfig({
      [CONFIG_KEYS.STREAM.CHAT_API_KEY]: 'chat-key',
      [CONFIG_KEYS.STREAM.CHAT_SECRET]: 'chat-secret',
    });
    userRepository.findById.mockResolvedValue({ _id: new Types.ObjectId(userId) } as never);
    await expect(
      service.ensureChannelsForUser({ id: userId, role: 'UNKNOWN_ROLE' } as never),
    ).resolves.toBeUndefined();

    const internal = service as any;
    studentRepository.findCollegeIdsByStudentId.mockResolvedValue([collegeId]);
    studentRepository.findStudentIdsByCollegeId.mockResolvedValue([
      new Types.ObjectId().toString(),
    ]);
    await expect(
      internal.assertCanCreateChannelWith(
        { id: userId, role: UserRole.USER },
        peerId,
      ),
    ).resolves.toBe(false);
  });
});
