import { useAppStore } from '@/lib/store';

const BUCKET = 'receipts';
// Loaded on use: the transaction form imports this file, and unit tests load
// that form without Supabase settings.
const storage = async () => (await import('@/lib/supabase')).supabase.storage.from(BUCKET);
const EXT: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

/** Stores a receipt photo under the space owner's folder; returns its path. */
export async function uploadReceipt(ownerId: string, image: Blob): Promise<string> {
  const ext = EXT[image.type];
  if (!ext) throw new Error('Format foto tidak didukung');
  const path = `${ownerId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await (await storage()).upload(path, image, { contentType: image.type });
  if (error) throw new Error('Gagal mengunggah foto struk');
  return path;
}

/** A link to view the photo, valid for an hour. */
export async function receiptUrl(path: string): Promise<string | null> {
  const { data } = await (await storage()).createSignedUrl(path, 3600);
  return data?.signedUrl ?? null;
}

/** Links (or with null, unlinks) a photo to an existing transaction. */
export async function setReceipt(transactionId: string, receiptPath: string | null): Promise<void> {
  const res = await fetch(`/api/transactions/${transactionId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ receiptPath }),
  });
  if (!res.ok) throw new Error('Gagal menyimpan foto struk');
  useAppStore.getState().bumpData();
}
