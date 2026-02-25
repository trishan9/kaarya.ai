"use server";

import { api } from "@/lib/api/axios-instance";
import { API_URLS } from "@/lib/api/endpoints";

export type StreamConfigResponse = {
  success: boolean;
  data?: {
    chatEnabled: boolean;
    videoEnabled: boolean;
    chatApiKey?: string | null;
    videoApiKey?: string | null;
  };
  message?: string;
};

export async function getStreamConfig(): Promise<StreamConfigResponse> {
  try {
    const response = await api.get(API_URLS.STREAM.CONFIG);
    return response.data;
  } catch (error: Error | unknown) {
    const err = error as { response?: { data?: { message?: string } }; message?: string };
    return {
      success: false,
      data: { chatEnabled: false, videoEnabled: false, chatApiKey: null, videoApiKey: null },
      message: err?.response?.data?.message ?? err?.message ?? "Failed to fetch Stream config",
    };
  }
}

export type StreamChatTokenResponse = {
  success: boolean;
  data?: { token: string; apiKey?: string | null };
  message?: string;
};

export async function getStreamChatToken(): Promise<StreamChatTokenResponse> {
  try {
    const response = await api.post(API_URLS.STREAM.CHAT_TOKEN);
    return response.data;
  } catch (error: Error | unknown) {
    const err = error as { response?: { data?: { message?: string } }; message?: string };
    return {
      success: false,
      message: err?.response?.data?.message ?? err?.message ?? "Failed to get chat token",
    };
  }
}

export type EnsureChannelsResponse = {
  success: boolean;
  message?: string;
};

export async function ensureStreamChannels(): Promise<EnsureChannelsResponse> {
  try {
    await api.post(API_URLS.STREAM.ENSURE_CHANNELS);
    return { success: true };
  } catch (error: Error | unknown) {
    const err = error as { response?: { data?: { message?: string } }; message?: string };
    return {
      success: false,
      message: err?.response?.data?.message ?? err?.message ?? "Failed to ensure channels",
    };
  }
}

export async function ensureStreamChannelWith(
  targetUserId: string,
  jobId?: string | null,
): Promise<EnsureChannelsResponse> {
  try {
    await api.post(API_URLS.STREAM.ENSURE_CHANNEL_WITH, {
      targetUserId: targetUserId.trim(),
      ...(jobId?.trim() ? { jobId: jobId.trim() } : {}),
    });
    return { success: true };
  } catch (error: Error | unknown) {
    const err = error as { response?: { data?: { message?: string } }; message?: string };
    return {
      success: false,
      message: err?.response?.data?.message ?? err?.message ?? "Failed to ensure channel",
    };
  }
}

export type StreamVideoTokenResponse = {
  success: boolean;
  data?: { token: string; apiKey?: string | null };
  message?: string;
};

export async function getStreamVideoToken(): Promise<StreamVideoTokenResponse> {
  try {
    const response = await api.post(API_URLS.STREAM.VIDEO_TOKEN);
    return response.data;
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } }; message?: string };
    return {
      success: false,
      message: err?.response?.data?.message ?? err?.message ?? "Failed to get video token",
    };
  }
}
