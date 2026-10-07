import { parseMoney } from '@/lib/currency';

export type OcrItem = {
  description: string;
  amount: number;
  /** YYYY-MM-DD when the image shows a date per row (e.g. a bank history). */
  date?: string;
  type?: 'expense' | 'income';
  /** Pre-selected in the review form (chat drafts name them). */
  categoryId?: string;
  accountId?: string;
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
  if (typeof value === 'string') {
    // "25rb", "1,5 juta": Indonesian shorthand, comma as the decimal mark.
    const short = value.toLowerCase().match(/([\d.,]+)\s*(rb|ribu|k|jt|juta)\b/);
    if (short) {
      const n = parseFloat(short[1].replace(/\./g, '').replace(',', '.'));
      return Math.round(n * (short[2].startsWith('j') ? 1_000_000 : 1_000));
    }
    return parseMoney(value);
  }
  return 0;
}

const toDate = (value: unknown) => (typeof value === 'string' && DATE.test(value) ? value : undefined);

/** The first {...} in a reply; models wrap JSON in ```json fences or prose. */
function extractJson(content: string): Record<string, unknown> {
  const start = content.indexOf('{');
  const end = content.lastIndexOf('}');
  try {
    if (start !== -1 && end > start) return JSON.parse(content.slice(start, end + 1));
  } catch {}
  return {};
}

function toItems(raw: unknown): OcrItem[] {
  const rows = Array.isArray(raw) ? (raw as Record<string, unknown>[]) : [];
  return rows
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
}

/**
 * Turns the model's reply into items. Tolerates what models actually send:
 * JSON wrapped in ```json fences or prose, amounts as "Rp40.000" or -40000.
 */
export function parseOcrReply(content: string): OcrResult {
  const data = extractJson(content);
  return { items: toItems(data.items), total: toAmount(data.total), date: toDate(data.date) ?? null };
}

/** Asks the chat model to answer with drafts when the user wants to record transactions. */
export const RECORD_INSTRUCTION =
  'Jika pengguna meminta mencatat transaksi (mis. "catat makan siang 25rb pakai Dompet" atau "gaji masuk 5 juta"), ' +
  'balas HANYA dengan JSON tanpa teks lain: {"record":[{"type":"expense"|"income","amount":number,"description":string,' +
  '"category":string|null,"account":string|null,"date":"yyyy-mm-dd"}]}. Pakai nama kategori dan akun persis dari data ' +
  'pengguna (null kalau tidak jelas), tanggal hari ini kalau tidak disebut, dan nominal angka utuh (25rb = 25000, 1,5 juta = 1500000). ' +
  'Untuk pertanyaan lain, jawab seperti biasa.';

const sameName = (a: string, b: unknown) => typeof b === 'string' && a.trim().toLowerCase() === b.trim().toLowerCase();

/**
 * Drafts from a chat reply that follows RECORD_INSTRUCTION, with category and
 * account names matched to ids; null when the reply is an ordinary answer.
 */
export function parseRecordReply(
  content: string,
  accounts: { id: string; name: string }[],
  categories: { id: string; name: string; type: string }[]
): OcrItem[] | null {
  if (!content.includes('"record"')) return null;
  const rows = extractJson(content).record;
  if (!Array.isArray(rows)) return null;
  const items = toItems(rows).map((item, i) => {
    const row = rows[i] as Record<string, unknown>;
    return {
      ...item,
      categoryId: categories.find((c) => c.type === item.type && sameName(c.name, row.category))?.id,
      accountId: accounts.find((a) => sameName(a.name, row.account))?.id,
    };
  });
  return items.length ? items : null;
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
