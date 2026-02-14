import { registerAs } from '@nestjs/config';
import { CONFIG_NAMESPACE } from 'src/constants/config.constants';

export default registerAs(CONFIG_NAMESPACE.GEMINI, () => {
  const fallbackModels = (process.env.GEMINI_FALLBACK_MODELS || '')
    .split(',')
    .map((model) => model.trim())
    .filter(Boolean);

  return {
    apiKey: process.env.GEMINI_API_KEY || '',
    model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    fallbackModels:
      fallbackModels.length > 0
        ? fallbackModels
        : ['gemini-2.0-flash', 'gemini-flash-latest', 'gemini-2.0-flash-lite'],
  };
});
