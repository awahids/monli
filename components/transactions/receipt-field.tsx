'use client';

import { useEffect, useRef, useState } from 'react';
import { Paperclip } from 'lucide-react';
import { toast } from 'sonner';
import type { Transaction } from '@/types';
import { useAppStore } from '@/lib/store';
import { shrinkImage } from '@/lib/ocr';
import { receiptUrl, setReceipt, uploadReceipt } from '@/lib/receipts';
import { Button } from '@/components/ui/button';

/**
 * The receipt photo of a saved transaction: view it, attach one, or remove it.
 * ponytail: removing or replacing only unlinks; the old file stays in storage
 * (a scan's rows share one photo). Clean up orphans if storage costs matter.
 */
export function ReceiptField({ transaction }: { transaction: Transaction }) {
  const { user, space } = useAppStore();
  const [path, setPath] = useState(transaction.receiptPath ?? null);
  const [url, setUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setUrl(null);
    if (path) receiptUrl(path).then(setUrl);
  }, [path]);

  const save = async (next: string | null) => {
    await setReceipt(transaction.id, next);
    setPath(next);
  };

  const attach = async (file?: File) => {
    if (!file || !user) return;
    setBusy(true);
    try {
      await save(await uploadReceipt(space?.ownerId ?? user.id, await shrinkImage(file)));
      toast.success('Foto struk tersimpan');
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
      if (input.current) input.current.value = '';
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await save(null);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2">
      <input
        ref={input}
        type="file"
        accept="image/*"
        className="hidden"
        aria-label="Pilih foto struk"
        onChange={(e) => attach(e.target.files?.[0])}
      />
      {path ? (
        <div className="flex items-center gap-3">
          <a href={url ?? undefined} target="_blank" rel="noreferrer" className="shrink-0">
            {url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={url} alt="Foto struk" className="h-20 w-20 rounded-md border object-cover" />
            ) : (
              <span className="block h-20 w-20 animate-pulse rounded-md bg-muted" />
            )}
          </a>
          <div className="flex flex-col gap-1">
            <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => input.current?.click()}>
              Ganti foto
            </Button>
            <Button type="button" variant="ghost" size="sm" disabled={busy} onClick={remove}>
              Hapus foto
            </Button>
          </div>
        </div>
      ) : (
        <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => input.current?.click()}>
          <Paperclip className="mr-2 h-4 w-4" />
          {busy ? 'Mengunggah...' : 'Lampirkan foto struk'}
        </Button>
      )}
    </div>
  );
}
