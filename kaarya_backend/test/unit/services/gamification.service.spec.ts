import { ACGamificationEventRepository } from 'src/repositories/gamification-event.repository';
import { ACGamificationProfileRepository } from 'src/repositories/gamification-profile.repository';
import { ACUserRepository } from 'src/repositories/user.repository';
import { GamificationService } from 'src/services/gamification.service';
import { GamificationEventType } from 'src/types/gamification-event-type.enum';
import { UserRole } from 'src/types/user-role.enum';

describe('GamificationService', () => {
  let service: GamificationService;
  let gamificationEventRepository: jest.Mocked<ACGamificationEventRepository>;
  let gamificationProfileRepository: jest.Mocked<ACGamificationProfileRepository>;
  let userRepository: jest.Mocked<ACUserRepository>;

  beforeEach(() => {
    gamificationEventRepository = {
      createUnique: jest.fn(),
    } as never;
    gamificationProfileRepository = {
      applyDelta: jest.fn(),
    } as never;
    userRepository = {
      findById: jest.fn(),
    } as never;

    service = new GamificationService(
      gamificationEventRepository,
      gamificationProfileRepository,
      userRepository,
    );
  });

  it('should short-circuit awardProgress for invalid input and non-candidate users', async () => {
    expect(
      await service.awardProgress({
        userId: '',
        eventType: GamificationEventType.JOB_VIEWED,
        eventKey: 'key',
      }),
    ).toEqual({ created: false });

    expect(
      await service.awardProgress({
        userId: 'u1',
        eventType: GamificationEventType.JOB_VIEWED,
        eventKey: 'key',
        xpDelta: 0,
        scoreDelta: 0,
      }),
    ).toEqual({ created: false });

    userRepository.findById.mockResolvedValue({ id: 'u1', role: UserRole.RECRUITER } as never);
    expect(
      await service.awardProgress({
        userId: 'u1',
        eventType: GamificationEventType.JOB_VIEWED,
        eventKey: 'key',
        xpDelta: 2,
        scoreDelta: 1,
      }),
    ).toEqual({ created: false });
  });

  it('should award progress and return updated profile values', async () => {
    userRepository.findById.mockResolvedValue({ id: 'u1', role: UserRole.STUDENT } as never);
    gamificationEventRepository.createUnique.mockResolvedValue({ created: true } as never);
    gamificationProfileRepository.applyDelta.mockResolvedValue({
      xp: 120,
      level: 2,
      score: 15,
    } as never);

    const result = await service.awardProgress({
      userId: 'u1',
      eventType: GamificationEventType.JOB_VIEWED,
      eventKey: 'job:viewed:u1:j1',
      xpDelta: 2.8,
      scoreDelta: 1.9,
      metadata: { jobId: 'j1' },
    });

    expect(gamificationEventRepository.createUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        xpAwarded: 2,
        scoreDelta: 1,
      }),
    );
    expect(gamificationProfileRepository.applyDelta).toHaveBeenCalledWith({
      userId: 'u1',
      xpDelta: 2,
      scoreDelta: 1,
    });
    expect(result).toEqual({ created: true, xp: 120, level: 2, score: 15 });
  });

  it('should return created false when event already exists', async () => {
    userRepository.findById.mockResolvedValue({ id: 'u1', role: UserRole.USER } as never);
    gamificationEventRepository.createUnique.mockResolvedValue({ created: false } as never);

    const result = await service.awardProgress({
      userId: 'u1',
      eventType: GamificationEventType.JOB_SAVED,
      eventKey: 'job:saved:u1:j1',
      xpDelta: 5,
      scoreDelta: 0,
    });

    expect(result).toEqual({ created: false });
    expect(gamificationProfileRepository.applyDelta).not.toHaveBeenCalled();
  });

  it('should route helper award methods through awardProgress', async () => {
    const spy = jest
      .spyOn(service, 'awardProgress')
      .mockResolvedValue({ created: true } as never);

    await service.awardJobViewed({ userId: 'u1', jobId: 'j1' });
    await service.awardJobSaved({ userId: 'u1', jobId: 'j1' });
    await service.awardInterviewSaved({ userId: 'u1', interviewId: 'i1' });
    await service.awardJobApplicationSubmitted({
      userId: 'u1',
      applicationId: 'a1',
      jobId: 'j1',
    });
    await service.awardProfileUpdated({
      userId: 'u1',
      updatedAt: new Date('2026-02-10T00:00:00.000Z'),
    });
    await service.awardInterviewStarted({
      userId: 'u1',
      interviewId: 'i1',
      sessionId: 's1',
    });
    await service.awardResumeBuilderCreated({
      userId: 'u1',
      resumeBuilderId: 'rb1',
    });
    await service.awardResumeBuilderSaved({
      userId: 'u1',
      resumeBuilderId: 'rb1',
      resumeId: 'r1',
    });

    expect(spy).toHaveBeenCalledTimes(8);
  });

  it('should award application status by supported statuses and ignore unsupported', async () => {
    const spy = jest
      .spyOn(service, 'awardProgress')
      .mockResolvedValue({ created: true } as never);

    await service.awardApplicationStatus({
      userId: 'u1',
      applicationId: 'a1',
      status: 'shortlisted',
    });
    await service.awardApplicationStatus({
      userId: 'u1',
      applicationId: 'a1',
      status: 'interview_scheduled',
    });
    await service.awardApplicationStatus({
      userId: 'u1',
      applicationId: 'a1',
      status: 'accepted',
    });
    await service.awardApplicationStatus({
      userId: 'u1',
      applicationId: 'a1',
      status: 'rejected',
    });
    const unsupported = await service.awardApplicationStatus({
      userId: 'u1',
      applicationId: 'a1',
      status: 'unknown' as never,
    });

    expect(spy).toHaveBeenCalledTimes(4);
    expect(unsupported).toEqual({ created: false });
  });

  it('should award interview completed and ats scan score events', async () => {
    const spy = jest
      .spyOn(service, 'awardProgress')
      .mockResolvedValue({ created: true } as never);

    await service.awardInterviewCompleted({
      userId: 'u1',
      interviewId: 'i1',
      sessionId: 's1',
      score: 90,
    });
    await service.awardAtsScan({
      userId: 'u1',
      resumeId: 'r1',
      score: 75,
    });

    expect(spy).toHaveBeenCalledTimes(4);
  });

  it('should return xp progress snapshot', () => {
    expect(service.getXpProgress(510)).toEqual(
      expect.objectContaining({
        level: 3,
        currentXp: 510,
      }),
    );
  });
});

