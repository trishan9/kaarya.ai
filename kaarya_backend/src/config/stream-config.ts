import { registerAs } from '@nestjs/config';
import { CONFIG_NAMESPACE } from 'src/constants/config.constants';
import { StreamConfig } from 'src/types/stream-config.type';

const envOrUndefined = (value?: string) => {
  const normalized = value?.trim();
  return normalized && normalized.length > 0 ? normalized : undefined;
};

export default registerAs<StreamConfig>(CONFIG_NAMESPACE.STREAM, () => ({
  chatApiKey: envOrUndefined(process.env.STREAM_CHAT_API_KEY),
  chatSecret: envOrUndefined(process.env.STREAM_CHAT_SECRET),
  videoApiKey: envOrUndefined(process.env.STREAM_VIDEO_API_KEY),
  videoSecret: envOrUndefined(process.env.STREAM_VIDEO_SECRET),
}));
