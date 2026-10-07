import { parseMoney } from '@/lib/currency';

export type OcrItem = {
  description: string;
  amount: number;
  /** YYYY-MM-DD when the image shows a date per row (e.g. a bank history). */
  date?: string;
  type?: 'expense' | 'income';
};

export type OcrResult = { items: OcrItem[]; total: number; date: string | null };

export const OCR_PROMPT = `Read this image. It is either a shopping receipt or a screenshot of a bank / e-wallet transaction history.
- Receipt: one item per purchased line, and the receipt total.
- Transaction history: one item per transaction row, with that row's own date; "description" is the merchant or person name, "type" is "income" for money in (Uang masuk, Kredit, +) and "expense" otherwise.
Amounts are positive whole numbers without currency symbols or separators (Rp40.000 -> 40000). Dates are yyyy-mm-dd; months may be in Indonesian (Okt = October).
Reply with JSON only: {"items":[{"description":string,"amount":number,"date":string|null,"type":"expense"|"income"}],"total":number,"date":string|null}`;

const DATE = /^\d{4}-\d{2}-\d{2}$/;

function toAmount(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.round(Math.abs(value));
  if (typeof value === 'string') return parseMoney(value);
  return 0;
}

const toDate = (value: unknown) => (typeof value === 'string' && DATE.test(value) ? value : undefined);

/**
 * Turns the model's reply into items. Tolerates what models actually send:
 * JSON wrapped in ```json fences or prose, amounts as "Rp40.000" or -40000.
 */
export function parseOcrReply(content: string): OcrResult {
  const start = content.indexOf('{');
  const end = content.lastIndexOf('}');
  let data: Record<string, unknown> = {};
  try {
    if (start !== -1 && end > start) data = JSON.parse(content.slice(start, end + 1));
  } catch {
    data = {};
  }

  const rawItems = Array.isArray(data.items) ? (data.items as Record<string, unknown>[]) : [];
  const items: OcrItem[] = rawItems
    .map((it) => {
      const negative = typeof it.amount === 'number' ? it.amount < 0 : String(it.amount ?? '').trim().startsWith('-');
      const type: OcrItem['type'] = it.type === 'income' && !negative ? 'income' : 'expense';
      return {
        description: String(it.description ?? '').trim(),
        amount: toAmount(it.amount),
        date: toDate(it.date),
        type,
      };
    })
    .filter((it) => it.amount > 0);

  return { items, total: toAmount(data.total), date: toDate(data.date) ?? null };
}

/**
 * Downscales a photo before upload (browser only). Phone photos often exceed
 * the 4.5 MB request limit on Vercel; 2000px keeps receipt text readable.
 */
export async function shrinkImage(file: File, maxSide = 2000): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size < 1_500_000) return file;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return await new Promise((resolve) => canvas.toBlob((blob) => resolve(blob ?? file), 'image/jpeg', 0.85));
  } catch {
    return file; // e.g. a format this browser cannot decode; let the server try
  }
}
