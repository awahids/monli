import { OpenAI } from 'openai';

export function createSumopodClient(apiKey = process.env.SUMOPOD_API_KEY) {
  if (!apiKey) {
    throw new Error('SUMOPOD_API_KEY is not set');
  }
  return new OpenAI({ apiKey, baseURL: 'https://ai.sumopod.com/v1' });
}

const FALLBACK_MODEL = 'gpt-4o-mini';
const SUPPORTED_MODELS = new Set([FALLBACK_MODEL, 'gpt-4o']);

export function getSumopodModel() {
  const model = process.env.SUMOPOD_MODEL;
  return model && SUPPORTED_MODELS.has(model) ? model : FALLBACK_MODEL;
}

/**
 * The cartoon from a photo (app/api/profile/avatar) has its own key and model,
 * apart from the assistant's, on the same SumoPod endpoint. Without its own
 * key it uses the assistant's.
 */
export function createSumopodAvatarClient() {
  return createSumopodClient(process.env.SUMOPOD_AVATAR_API_KEY || process.env.SUMOPOD_API_KEY);
}

/** Any SumoPod model that can see images. */
export function getSumopodAvatarModel() {
  return process.env.SUMOPOD_AVATAR_MODEL || 'gpt-4.1-mini';
}
