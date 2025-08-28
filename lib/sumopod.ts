import { OpenAI } from 'openai';

export function createSumopodClient() {
  const apiKey = process.env.SUMOPOD_API_KEY;
  if (!apiKey) {
    throw new Error('SUMOPOD_API_KEY is not set');
  }
  return new OpenAI({ apiKey, baseURL: 'https://ai.sumopod.com/v1' });
}

export function getSumopodModel() {
  return process.env.SUMOPOD_MODEL || 'gpt-4o-mini';
}

