import {
  ensureStreamChannelWith,
  ensureStreamChannels,
  getStreamChatToken,
  getStreamConfig,
  getStreamVideoToken,
} from "@/lib/actions/inbox-actions";
import { API_URLS } from "@/lib/api/endpoints";

const { apiMock } = vi.hoisted(() => ({
  apiMock: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

vi.mock("@/lib/api/axios-instance", () => ({
  api: apiMock,
}));

const responseError = (message: string) => ({
  response: {
    data: { message },
  },
});

describe("inbox actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("gets stream config and default fallback payload on failure", async () => {
    apiMock.get.mockResolvedValueOnce({
      data: { success: true, data: { chatEnabled: true, videoEnabled: true } },
    });
    expect(await getStreamConfig()).toEqual({
      success: true,
      data: { chatEnabled: true, videoEnabled: true },
    });
    expect(apiMock.get).toHaveBeenCalledWith(API_URLS.STREAM.CONFIG);

    apiMock.get.mockRejectedValueOnce(responseError("config-response"));
    expect(await getStreamConfig()).toEqual({
      success: false,
      data: {
        chatEnabled: false,
        videoEnabled: false,
        chatApiKey: null,
        videoApiKey: null,
      },
      message: "config-response",
    });

    apiMock.get.mockRejectedValueOnce(new Error("config-runtime"));
    expect(await getStreamConfig()).toEqual({
      success: false,
      data: {
        chatEnabled: false,
        videoEnabled: false,
        chatApiKey: null,
        videoApiKey: null,
      },
      message: "config-runtime",
    });

    apiMock.get.mockRejectedValueOnce({});
    expect(await getStreamConfig()).toEqual({
      success: false,
      data: {
        chatEnabled: false,
        videoEnabled: false,
        chatApiKey: null,
        videoApiKey: null,
      },
      message: "Failed to fetch Stream config",
    });
  });

  it("gets chat token and fallback errors", async () => {
    apiMock.post.mockResolvedValueOnce({ data: { success: true, data: { token: "t" } } });
    expect(await getStreamChatToken()).toEqual({ success: true, data: { token: "t" } });
    expect(apiMock.post).toHaveBeenCalledWith(API_URLS.STREAM.CHAT_TOKEN);

    apiMock.post.mockRejectedValueOnce(responseError("chat-response"));
    expect(await getStreamChatToken()).toEqual({
      success: false,
      message: "chat-response",
    });

    apiMock.post.mockRejectedValueOnce(new Error("chat-runtime"));
    expect(await getStreamChatToken()).toEqual({
      success: false,
      message: "chat-runtime",
    });

    apiMock.post.mockRejectedValueOnce({});
    expect(await getStreamChatToken()).toEqual({
      success: false,
      message: "Failed to get chat token",
    });
  });

  it("ensures channels and returns fallback errors", async () => {
    apiMock.post.mockResolvedValueOnce({ data: { success: true } });
    expect(await ensureStreamChannels()).toEqual({ success: true });
    expect(apiMock.post).toHaveBeenCalledWith(API_URLS.STREAM.ENSURE_CHANNELS);

    apiMock.post.mockRejectedValueOnce(responseError("channels-response"));
    expect(await ensureStreamChannels()).toEqual({
      success: false,
      message: "channels-response",
    });

    apiMock.post.mockRejectedValueOnce(new Error("channels-runtime"));
    expect(await ensureStreamChannels()).toEqual({
      success: false,
      message: "channels-runtime",
    });

    apiMock.post.mockRejectedValueOnce({});
    expect(await ensureStreamChannels()).toEqual({
      success: false,
      message: "Failed to ensure channels",
    });
  });

  it("ensures direct channel with normalized payload and optional jobId", async () => {
    apiMock.post.mockResolvedValue({ data: { success: true } });

    expect(await ensureStreamChannelWith("  user-1  ", "  job-1 ")).toEqual({
      success: true,
    });
    expect(apiMock.post).toHaveBeenNthCalledWith(
      1,
      API_URLS.STREAM.ENSURE_CHANNEL_WITH,
      { targetUserId: "user-1", jobId: "job-1" },
    );

    expect(await ensureStreamChannelWith("  user-1  ", "   ")).toEqual({
      success: true,
    });
    expect(apiMock.post).toHaveBeenNthCalledWith(
      2,
      API_URLS.STREAM.ENSURE_CHANNEL_WITH,
      { targetUserId: "user-1" },
    );

    apiMock.post.mockRejectedValueOnce(responseError("channel-response"));
    expect(await ensureStreamChannelWith("u")).toEqual({
      success: false,
      message: "channel-response",
    });

    apiMock.post.mockRejectedValueOnce(new Error("channel-runtime"));
    expect(await ensureStreamChannelWith("u")).toEqual({
      success: false,
      message: "channel-runtime",
    });

    apiMock.post.mockRejectedValueOnce({});
    expect(await ensureStreamChannelWith("u")).toEqual({
      success: false,
      message: "Failed to ensure channel",
    });
  });

  it("gets video token and fallback errors", async () => {
    apiMock.post.mockResolvedValueOnce({ data: { success: true, data: { token: "v" } } });
    expect(await getStreamVideoToken()).toEqual({
      success: true,
      data: { token: "v" },
    });
    expect(apiMock.post).toHaveBeenCalledWith(API_URLS.STREAM.VIDEO_TOKEN);

    apiMock.post.mockRejectedValueOnce(responseError("video-response"));
    expect(await getStreamVideoToken()).toEqual({
      success: false,
      message: "video-response",
    });

    apiMock.post.mockRejectedValueOnce(new Error("video-runtime"));
    expect(await getStreamVideoToken()).toEqual({
      success: false,
      message: "video-runtime",
    });

    apiMock.post.mockRejectedValueOnce({});
    expect(await getStreamVideoToken()).toEqual({
      success: false,
      message: "Failed to get video token",
    });
  });
});

