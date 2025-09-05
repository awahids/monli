import { OpenAI } from 'openai';

export function createSumopodClient() {
  const apiKey = process.env.SUMOPOD_API_KEY;
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

