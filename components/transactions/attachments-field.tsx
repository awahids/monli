'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { FileText, Lock, Paperclip, X } from 'lucide-react';
import { toast } from 'sonner';
import type { Transaction } from '@/types';
import { useAppStore } from '@/lib/store';
import { spacePlan } from '@/lib/plans';
import { shrinkImage } from '@/lib/ocr';
import { MAX_ATTACHMENTS, receiptUrl, setAttachments, uploadAttachment } from '@/lib/receipts';
import { Button } from '@/components/ui/button';
import { useT } from '@/lib/i18n';

/** One attachment: a thumbnail for photos, a file tile for PDFs; opens in a new tab. */
function AttachmentTile({ path, onRemove, busy }: { path: string; onRemove: () => void; busy: boolean }) {
  const { t } = useT();
  const [url, setUrl] = useState<string | null>(null);
  const pdf = path.endsWith('.pdf');
  useEffect(() => {
    receiptUrl(path).then(setUrl);
  }, [path]);
  return (
    <li className="relative">
      <a
        href={url ?? undefined}
        target="_blank"
        rel="noreferrer"
        className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-md border bg-muted"
        aria-label={pdf ? t('Buka PDF', 'Open PDF') : t('Buka foto', 'Open photo')}
      >
        {pdf ? (
          <FileText className="h-6 w-6 text-muted-foreground" />
        ) : url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="h-full w-full animate-pulse" />
        )}
      </a>
      <button
        type="button"
        disabled={busy}
        onClick={onRemove}
        aria-label={t('Hapus lampiran', 'Remove attachment')}
        className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-background"
      >
        <X className="h-3 w-3" />
      </button>
    </li>
  );
}

/**
 * Files kept with a saved transaction besides the receipt photo, such as a
 * warranty card or an invoice PDF. PRO, up to MAX_ATTACHMENTS.
 * Like the receipt, removing only unlinks; the file stays in storage.
 */
export function AttachmentsField({ transaction }: { transaction: Transaction }) {
  const { user, space } = useAppStore();
  const { t } = useT();
  const [paths, setPaths] = useState<string[]>(transaction.attachments ?? []);
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const isPro = spacePlan(user, space) === 'PRO';

  const save = async (next: string[]) => {
    await setAttachments(transaction.id, next);
    setPaths(next);
  };

  const add = async (files: FileList | null) => {
    if (!files?.length || !user) return;
    setBusy(true);
    try {
      const room = MAX_ATTACHMENTS - paths.length;
      const added: string[] = [];
      for (const file of Array.from(files).slice(0, room)) {
        const blob = file.type === 'application/pdf' ? file : await shrinkImage(file);
        added.push(await uploadAttachment(space?.ownerId ?? user.id, blob));
      }
      await save([...paths, ...added]);
      toast.success(t('Lampiran tersimpan', 'Attachment saved'));
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
      if (input.current) input.current.value = '';
    }
  };

  const remove = async (path: string) => {
    setBusy(true);
    try {
      await save(paths.filter((p) => p !== path));
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (!isPro) {
    return (
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Lock className="h-3.5 w-3.5" />
        {t('Lampiran lain (garansi, invoice PDF) khusus PRO. ', 'Other attachments (warranty, invoice PDF) are PRO. ')}
        <Link href="/upgrade" className="web-only font-medium text-primary underline-offset-2 hover:underline">
          {t('Lihat paket', 'See plans')}
        </Link>
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <input
        ref={input}
        type="file"
        multiple
        accept="image/*,application/pdf"
        className="hidden"
        aria-label={t('Pilih lampiran', 'Choose attachments')}
        onChange={(e) => add(e.target.files)}
      />
      {paths.length > 0 && (
        <ul className="flex flex-wrap gap-3" aria-label={t('Lampiran', 'Attachments')}>
          {paths.map((p) => (
            <AttachmentTile key={p} path={p} busy={busy} onRemove={() => remove(p)} />
          ))}
        </ul>
      )}
      {paths.length < MAX_ATTACHMENTS && (
        <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => input.current?.click()}>
          <Paperclip className="mr-2 h-4 w-4" />
          {busy ? t('Mengunggah...', 'Uploading...') : t('Tambah lampiran (foto/PDF)', 'Add attachment (photo/PDF)')}
        </Button>
      )}
    </div>
  );
}
