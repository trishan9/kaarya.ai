import { ApiError } from 'src/common/errors/api-error';
import { INTERVIEW_MESSAGES } from 'src/constants/messages.constants';
import { InterviewVapiController } from 'src/controllers/interview-vapi.controller';
import { InterviewService } from 'src/services/interview.service';
import { InterviewType } from 'src/types/interview-type.enum';

describe('InterviewVapiController', () => {
  let controller: InterviewVapiController;
  let interviewService: jest.Mocked<InterviewService>;

  beforeEach(() => {
    interviewService = {
      getVoiceCreationConfig: jest.fn(),
      extractVapiWebhookSecret: jest.fn(),
      assertVapiWebhookSecret: jest.fn(),
      createInterviewFromVapiWebhook: jest.fn(),
    } as unknown as jest.Mocked<InterviewService>;

    controller = new InterviewVapiController(interviewService);
  });

  it('should return voice creation config', async () => {
    interviewService.getVoiceCreationConfig.mockResolvedValue({
      workflowId: 'wf-1',
    } as never);

    const result = await controller.getVoiceCreationConfig({
      user: { id: 'u1', role: 'student' } as never,
    });

    expect(result).toEqual({
      success: true,
      message: INTERVIEW_MESSAGES.VAPI_CREATION_CONFIG_SUCCESS,
      data: { workflowId: 'wf-1' },
    });
  });

  it('should return health endpoint response', async () => {
    const result = await controller.vapiGenerateHealth();

    expect(result).toEqual({
      success: true,
      message: INTERVIEW_MESSAGES.VAPI_GENERATE_SUCCESS,
      data: { ok: true },
    });
  });

  it('should create interview from vapi payload', async () => {
    interviewService.extractVapiWebhookSecret.mockReturnValue('secret');
    interviewService.createInterviewFromVapiWebhook.mockResolvedValue({
      id: 'i1',
    } as never);

    const result = await controller.generateInterviewFromVapi(
      { 'x-vapi-secret': 'secret' },
      {
        title: 'Voice interview',
        interviewType: InterviewType.TECHNICAL,
        role: 'Backend Engineer',
      } as never,
    );

    expect(interviewService.extractVapiWebhookSecret).toHaveBeenCalled();
    expect(interviewService.assertVapiWebhookSecret).toHaveBeenCalledWith('secret');
    expect(interviewService.createInterviewFromVapiWebhook).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Voice interview',
        interviewType: InterviewType.TECHNICAL,
      }),
    );
    expect(result.message).toBe(INTERVIEW_MESSAGES.VAPI_GENERATE_SUCCESS);
  });

  it('should reject invalid vapi payload', async () => {
    await expect(
      controller.generateInterviewFromVapi(
        { 'x-vapi-secret': 'secret' },
        { techStack: 12 } as never,
      ),
    ).rejects.toBeInstanceOf(ApiError);
  });
});
