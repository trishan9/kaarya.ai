import streamConfig from 'src/config/stream-config';

describe('stream-config', () => {
  const previousEnv = {
    STREAM_CHAT_API_KEY: process.env.STREAM_CHAT_API_KEY,
    STREAM_CHAT_SECRET: process.env.STREAM_CHAT_SECRET,
    STREAM_VIDEO_API_KEY: process.env.STREAM_VIDEO_API_KEY,
    STREAM_VIDEO_SECRET: process.env.STREAM_VIDEO_SECRET,
  };

  afterEach(() => {
    process.env.STREAM_CHAT_API_KEY = previousEnv.STREAM_CHAT_API_KEY;
    process.env.STREAM_CHAT_SECRET = previousEnv.STREAM_CHAT_SECRET;
    process.env.STREAM_VIDEO_API_KEY = previousEnv.STREAM_VIDEO_API_KEY;
    process.env.STREAM_VIDEO_SECRET = previousEnv.STREAM_VIDEO_SECRET;
  });

  it('should trim configured values', () => {
    process.env.STREAM_CHAT_API_KEY = '  chat-key  ';
    process.env.STREAM_CHAT_SECRET = ' chat-secret ';
    process.env.STREAM_VIDEO_API_KEY = ' video-key ';
    process.env.STREAM_VIDEO_SECRET = ' video-secret ';

    const config = streamConfig();

    expect(config).toEqual({
      chatApiKey: 'chat-key',
      chatSecret: 'chat-secret',
      videoApiKey: 'video-key',
      videoSecret: 'video-secret',
    });
  });

  it('should normalize empty values to undefined', () => {
    process.env.STREAM_CHAT_API_KEY = '   ';
    process.env.STREAM_CHAT_SECRET = '';
    process.env.STREAM_VIDEO_API_KEY = '   ';
    delete process.env.STREAM_VIDEO_SECRET;

    const config = streamConfig();

    expect(config).toEqual({
      chatApiKey: undefined,
      chatSecret: undefined,
      videoApiKey: undefined,
      videoSecret: undefined,
    });
  });
});
