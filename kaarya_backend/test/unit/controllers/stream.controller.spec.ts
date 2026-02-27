import { StreamController } from 'src/controllers/stream.controller';
import { StreamService } from 'src/services/stream.service';

describe('StreamController', () => {
  let controller: StreamController;
  let streamService: jest.Mocked<StreamService>;

  beforeEach(() => {
    streamService = {
      createChatToken: jest.fn().mockReturnValue('chat-token'),
      getChatApiKey: jest.fn().mockReturnValue('chat-key'),
      createVideoToken: jest.fn().mockReturnValue('video-token'),
      getVideoApiKey: jest.fn().mockReturnValue('video-key'),
      ensureChannelsForUser: jest.fn().mockResolvedValue(undefined),
      ensureChannelWithUser: jest.fn().mockResolvedValue(undefined),
      isChatConfigured: jest.fn().mockReturnValue(true),
      isVideoConfigured: jest.fn().mockReturnValue(false),
    } as unknown as jest.Mocked<StreamService>;

    controller = new StreamController(streamService);
  });

  it('should create chat token', async () => {
    const result = await controller.createChatToken({
      user: { id: 'u1', role: 'student' } as never,
    });

    expect(streamService.createChatToken).toHaveBeenCalledWith('u1');
    expect(result).toEqual({
      success: true,
      message: 'Stream Chat token created',
      data: { token: 'chat-token', apiKey: 'chat-key' },
    });
  });

  it('should fail chat token when user is missing', async () => {
    await expectInternalServerError(() =>
      controller.createChatToken({ user: {} as never }),
    );
  });

  it('should create video token', async () => {
    const result = await controller.createVideoToken({
      user: { id: 'u1' } as never,
    });

    expect(streamService.createVideoToken).toHaveBeenCalledWith('u1');
    expect(result.message).toBe('Stream Video token created');
    expect(result.data).toEqual({ token: 'video-token', apiKey: 'video-key' });
  });

  it('should fail video token when user is missing', async () => {
    await expectInternalServerError(() =>
      controller.createVideoToken({ user: null as never }),
    );
  });

  it('should ensure channels for user', async () => {
    const result = await controller.ensureChannels({
      user: { id: 'u1', role: 'student' } as never,
    });

    expect(streamService.ensureChannelsForUser).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'u1' }),
    );
    expect(result).toEqual({
      success: true,
      message: 'Channels ensured',
      data: null,
    });
  });

  it('should fail ensure channels when user is missing', async () => {
    await expectInternalServerError(() =>
      controller.ensureChannels({ user: null as never }),
    );
  });

  it('should ensure channel with another user', async () => {
    const result = await controller.ensureChannelWith(
      { user: { id: 'u1', role: 'student' } as never },
      { targetUserId: '  u2 ', jobId: '  job-1 ' },
    );

    expect(streamService.ensureChannelWithUser).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'u1' }),
      'u2',
      'job-1',
    );
    expect(result.message).toBe('Channel ensured');
  });

  it('should reject ensure channel when target user is missing', async () => {
    await expectInternalServerError(() =>
      controller.ensureChannelWith(
        { user: { id: 'u1' } as never },
        { targetUserId: '   ' },
      ),
    );
  });

  it('should reject ensure channel when requester is missing', async () => {
    await expectInternalServerError(() =>
      controller.ensureChannelWith(
        { user: undefined as never },
        { targetUserId: 'u2' },
      ),
    );
  });

  it('should return stream config', async () => {
    const result = await controller.getConfig();

    expect(result).toEqual({
      success: true,
      message: 'Stream config retrieved',
      data: {
        chatEnabled: true,
        videoEnabled: false,
        chatApiKey: 'chat-key',
        videoApiKey: 'video-key',
      },
    });
  });
});

async function expectInternalServerError(fn: () => Promise<unknown>) {
  try {
    await fn();
  } catch (error) {
    const apiError = error as { getStatus?: () => number };
    expect(typeof apiError?.getStatus).toBe('function');
    expect(apiError.getStatus?.()).toBe(500);
    return;
  }

  throw new Error('Expected internal server error');
}
