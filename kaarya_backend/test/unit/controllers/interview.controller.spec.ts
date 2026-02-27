import { Types } from 'mongoose';
import { ApiError } from 'src/common/errors/api-error';
import { INTERVIEW_MESSAGES } from 'src/constants/messages.constants';
import { InterviewController } from 'src/controllers/interview.controller';
import { InterviewService } from 'src/services/interview.service';
import { InterviewType } from 'src/types/interview-type.enum';

describe('InterviewController', () => {
  let controller: InterviewController;
  let interviewService: jest.Mocked<InterviewService>;

  const user = { id: new Types.ObjectId().toString(), role: 'student' } as never;
  const interviewId = new Types.ObjectId().toString();
  const sessionId = new Types.ObjectId().toString();

  beforeEach(() => {
    interviewService = {
      listInterviews: jest.fn(),
      getInterviewById: jest.fn(),
      createInterview: jest.fn(),
      updateInterview: jest.fn(),
      deleteInterview: jest.fn(),
      startInterviewSession: jest.fn(),
      completeInterviewSession: jest.fn(),
      listMyInterviewSessions: jest.fn(),
      getSessionFeedback: jest.fn(),
      getInterviewAnalytics: jest.fn(),
    } as unknown as jest.Mocked<InterviewService>;

    controller = new InterviewController(interviewService);
  });

  it('should list interviews and validate query', async () => {
    interviewService.listInterviews.mockResolvedValue({
      interviews: [],
      meta: { page: 1, size: 12 },
    } as never);

    const result = await controller.listInterviews(
      { user },
      { page: 1, size: 12 } as never,
    );
    expect(result.message).toBe(INTERVIEW_MESSAGES.FETCH_ALL_SUCCESS);

    await expect(
      controller.listInterviews({ user }, { page: 0 } as never),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it('should get interview by id and reject invalid id', async () => {
    interviewService.getInterviewById.mockResolvedValue({ id: interviewId } as never);

    const result = await controller.getInterviewById({ user }, interviewId);
    expect(result.message).toBe(INTERVIEW_MESSAGES.FETCH_SUCCESS);

    await expect(
      controller.getInterviewById({ user }, 'bad-id'),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it('should create interview and validate payload', async () => {
    interviewService.createInterview.mockResolvedValue({ id: interviewId } as never);

    const result = await controller.createInterview(
      { user },
      {
        title: 'Backend Interview',
        interviewType: InterviewType.TECHNICAL,
        role: 'Backend Engineer',
      } as never,
    );
    expect(result.message).toBe(INTERVIEW_MESSAGES.CREATE_SUCCESS);

    await expect(
      controller.createInterview(
        { user },
        { title: 'x', interviewType: InterviewType.TECHNICAL, role: 'x' } as never,
      ),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it('should update interview and validate id/payload', async () => {
    interviewService.updateInterview.mockResolvedValue({ id: interviewId } as never);

    const result = await controller.updateInterview(
      { user },
      interviewId,
      { title: 'Updated title' } as never,
    );
    expect(result.message).toBe(INTERVIEW_MESSAGES.UPDATE_SUCCESS);

    await expect(
      controller.updateInterview({ user }, 'bad-id', { title: 'ok' } as never),
    ).rejects.toBeInstanceOf(ApiError);
    await expect(
      controller.updateInterview({ user }, interviewId, {} as never),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it('should delete interview and reject invalid id', async () => {
    interviewService.deleteInterview.mockResolvedValue({ id: interviewId } as never);

    const result = await controller.deleteInterview({ user }, interviewId);
    expect(result.message).toBe(INTERVIEW_MESSAGES.DELETE_SUCCESS);

    await expect(
      controller.deleteInterview({ user }, 'bad-id'),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it('should start interview session and validate id/payload', async () => {
    interviewService.startInterviewSession.mockResolvedValue({
      id: sessionId,
    } as never);

    const result = await controller.startInterviewSession(
      { user },
      interviewId,
      { mode: 'web', metadata: {} } as never,
    );
    expect(result.message).toBe(INTERVIEW_MESSAGES.SESSION_START_SUCCESS);

    await expect(
      controller.startInterviewSession({ user }, 'bad-id', { mode: 'web' } as never),
    ).rejects.toBeInstanceOf(ApiError);
    await expect(
      controller.startInterviewSession(
        { user },
        interviewId,
        { mode: 'invalid' } as never,
      ),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it('should complete interview session and validate id/payload', async () => {
    interviewService.completeInterviewSession.mockResolvedValue({
      id: sessionId,
    } as never);

    const result = await controller.completeInterviewSession(
      { user },
      interviewId,
      sessionId,
      { transcript: [] } as never,
    );
    expect(result.message).toBe(INTERVIEW_MESSAGES.SESSION_COMPLETE_SUCCESS);

    await expect(
      controller.completeInterviewSession(
        { user },
        'bad-id',
        sessionId,
        { transcript: [] } as never,
      ),
    ).rejects.toBeInstanceOf(ApiError);
    await expect(
      controller.completeInterviewSession(
        { user },
        interviewId,
        'bad-id',
        { transcript: [] } as never,
      ),
    ).rejects.toBeInstanceOf(ApiError);
    await expect(
      controller.completeInterviewSession(
        { user },
        interviewId,
        sessionId,
        { transcript: [{ role: 'unknown', content: 'x' }] } as never,
      ),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it('should list my interview sessions and validate id/query', async () => {
    interviewService.listMyInterviewSessions.mockResolvedValue({
      sessions: [],
      meta: { page: 1, size: 10 },
    } as never);

    const result = await controller.listMyInterviewSessions(
      { user },
      interviewId,
      { page: 1, size: 10 } as never,
    );
    expect(result.message).toBe(INTERVIEW_MESSAGES.SESSION_FETCH_SUCCESS);

    await expect(
      controller.listMyInterviewSessions(
        { user },
        'bad-id',
        { page: 1, size: 10 },
      ),
    ).rejects.toBeInstanceOf(ApiError);
    await expect(
      controller.listMyInterviewSessions({ user }, interviewId, { page: 0 } as never),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it('should get session feedback and validate session id', async () => {
    interviewService.getSessionFeedback.mockResolvedValue({
      id: sessionId,
    } as never);

    const result = await controller.getSessionFeedback({ user }, sessionId);
    expect(result.message).toBe(INTERVIEW_MESSAGES.EVALUATION_FETCH_SUCCESS);

    await expect(
      controller.getSessionFeedback({ user }, 'bad-id'),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it('should get interview analytics and validate id/query', async () => {
    interviewService.getInterviewAnalytics.mockResolvedValue({
      totalParticipants: 0,
    } as never);

    const result = await controller.getInterviewAnalytics(
      { user },
      interviewId,
      { page: 1, size: 10 } as never,
    );
    expect(result.message).toBe(INTERVIEW_MESSAGES.ANALYTICS_FETCH_SUCCESS);

    await expect(
      controller.getInterviewAnalytics(
        { user },
        'bad-id',
        { page: 1, size: 10 },
      ),
    ).rejects.toBeInstanceOf(ApiError);
    await expect(
      controller.getInterviewAnalytics({ user }, interviewId, { page: 0 } as never),
    ).rejects.toBeInstanceOf(ApiError);
  });
});
