'use client';

import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Mic, MessageCircle, SendHorizontal, Sparkles, Square, Trash2, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useAppStore } from '@/lib/store';
import OcrReviewDialog from '@/components/transactions/ocr-review-dialog';
import type { TransactionFormValues } from '@/components/transactions/transaction-form';
import { ensureFormOptions, saveTransaction, toTransactionPayload } from '@/lib/transactions-client';
import { useT } from '@/lib/i18n';
import { isNativeApp } from '@/lib/native';

// Web Speech API (Chrome/Android, Safari/iOS); not in TypeScript's DOM types yet.
type Recognition = {
  lang: string;
  interimResults: boolean;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};
function speechRecognition(): (new () => Recognition) | undefined {
  if (isNativeApp()) return NativeRecognition;
  const w = window as unknown as {
    SpeechRecognition?: new () => Recognition;
    webkitSpeechRecognition?: new () => Recognition;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

/** The same interface over the speech plugin of the iOS/Android app, whose WebView has none. */
class NativeRecognition implements Recognition {
  lang = 'id-ID';
  interimResults = false;
  onresult: Recognition['onresult'] = null;
  onerror: Recognition['onerror'] = null;
  onend: Recognition['onend'] = null;

  start() {
    (async () => {
      const { SpeechRecognition } = await import('@/lib/native-plugins');
      try {
        const { speechRecognition } = await SpeechRecognition.requestPermissions();
        if (speechRecognition !== 'granted') return this.onerror?.({ error: 'not-allowed' });
        const { matches } = await SpeechRecognition.start({ language: this.lang, maxResults: 1, partialResults: false, popup: false });
        if (matches?.[0]) this.onresult?.({ results: [[{ transcript: matches[0] }]] });
      } catch {
        this.onerror?.({ error: 'no-speech' });
      } finally {
        this.onend?.();
      }
    })();
  }

  stop() {
    import('@/lib/native-plugins').then(({ SpeechRecognition }) => SpeechRecognition.stop()).catch(() => undefined);
  }
}

type Usage = { used: number; limit: number; unlimited: boolean };

const SUGGESTIONS: [string, string][] = [
  ['Catat makan siang 25rb', 'Record lunch 25k'],
  ['Ringkas pengeluaranku bulan ini', 'Summarize my spending this month'],
  ['Kategori apa yang paling boros?', 'Which category costs me the most?'],
  ['Apakah budget bulan ini masih aman?', 'Is my budget still on track this month?'],
  ['Bandingkan pengeluaran dengan bulan lalu', 'Compare spending with last month'],
];

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const { t, locale } = useT();
  const { chatMessages, addChatMessage, clearChatMessages, accounts, categories, user, space } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [usage, setUsage] = useState<Usage | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  // Drafts from "catat ...": the message being reviewed, and those already saved.
  const [reviewing, setReviewing] = useState<number | null>(null);
  const [saved, setSaved] = useState<Set<number>>(new Set());
  const [canListen, setCanListen] = useState(false);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<Recognition | null>(null);

  useEffect(() => setCanListen(Boolean(speechRecognition())), []);

  // Load this month's remaining quota when the panel opens.
  useEffect(() => {
    if (!open || usage) return;
    fetch('/api/ai/usage')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.chat) setUsage({ ...data.chat, unlimited: data.unlimited });
      })
      .catch(() => {});
  }, [open, usage]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [chatMessages, loading]);

  const remaining = usage && !usage.unlimited ? Math.max(usage.limit - usage.used, 0) : null;
  const outOfQuota = remaining === 0;

  const sendMessage = async (text?: string) => {
    const message = (text ?? input).trim();
    if (!message || loading || outOfQuota) return;
    const history = useAppStore.getState().chatMessages.map(({ role, content }) => ({ role, content }));
    addChatMessage({ role: 'user', content: message });
    setInput('');
    setLoading(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, history }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t('Gagal mendapat jawaban', 'Could not get an answer'));
      addChatMessage({ role: 'assistant', content: data.answer, drafts: data.drafts });
      if (data.usage) setUsage(data.usage);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('Gagal mengirim pesan', 'Could not send the message'));
    } finally {
      setLoading(false);
    }
  };

  const toggleVoice = () => {
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }
    const Ctor = speechRecognition();
    if (!Ctor) return;
    const recognition = new Ctor();
    recognition.lang = locale === 'en' ? 'en-US' : 'id-ID';
    recognition.interimResults = false;
    recognition.onresult = (e) => {
      const text = Array.from(e.results, (r) => r[0].transcript).join(' ').trim();
      if (text) sendMessage(text);
    };
    recognition.onerror = (e) => {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        toast.error(t('Izinkan akses mikrofon untuk mencatat lewat suara', 'Allow microphone access to record by voice'));
      } else if (e.error !== 'no-speech' && e.error !== 'aborted') {
        toast.error(t('Suara tidak tertangkap, coba lagi', "Didn't catch that, try again"));
      }
    };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  };

  const openReview = (index: number) => {
    if (user) ensureFormOptions(space?.ownerId ?? user.id).catch(console.error);
    setReviewing(index);
  };

  const saveDrafts = async (values: TransactionFormValues[]) => {
    let count = 0;
    try {
      for (const v of values) {
        await saveTransaction(toTransactionPayload(v));
        count += 1;
      }
      toast.success(t(`${count} transaksi tersimpan`, `${count} transactions saved`));
      setSaved((prev) => new Set(prev).add(reviewing!));
      setReviewing(null);
    } catch (e) {
      toast.error(
        `${(e as Error).message}${count ? t(` (${count} dari ${values.length} sudah tersimpan)`, ` (${count} of ${values.length} already saved)`) : ''}`
      );
    }
  };

  return (
    <div className="fixed bottom-[calc(6.5rem+env(safe-area-inset-bottom))] right-[max(1rem,calc(50vw-13rem))] z-50">
      {open ? (
        <div
          role="dialog"
          aria-label={t('Asisten keuangan AI', 'AI finance assistant')}
          className="flex h-[calc(100dvh-8rem)] w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-xl border bg-background shadow-xl"
        >
          <div className="flex items-center justify-between border-b px-3 py-2">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-accent-foreground">
                <Sparkles className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-semibold leading-tight">{t('Asisten Qala Saku', 'Qala Saku assistant')}</p>
                <p className="text-xs text-muted-foreground">
                  {usage?.unlimited
                    ? t('Tanpa batas', 'Unlimited')
                    : remaining !== null
                    ? t(`${remaining} dari ${usage!.limit} pertanyaan tersisa bulan ini`, `${remaining} of ${usage!.limit} questions left this month`)
                    : t('Bertanya soal keuanganmu', 'Ask about your finances')}
                </p>
              </div>
            </div>
            <div className="flex">
              {chatMessages.length > 0 && (
                <Button variant="ghost" size="icon" onClick={clearChatMessages} aria-label={t('Hapus percakapan', 'Clear conversation')}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label={t('Tutup chat', 'Close chat')}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-3">
            {chatMessages.length === 0 && (
              <div className="space-y-3 pt-2">
                <p className="text-sm text-muted-foreground">
                  {t(
                    'Tanyakan soal transaksi, budget, dan saldomu, atau minta catat transaksi, misalnya “catat bensin 50rb pakai Dompet”.',
                    'Ask about your transactions, budget and balances, or ask to record one, e.g. “record fuel 50k from Wallet”.'
                  )}
                  {canListen && t(' Bisa juga lewat suara.', ' You can also use your voice.')}
                </p>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTIONS.map(([idText, enText]) => t(idText, enText)).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => sendMessage(s)}
                      disabled={loading || outOfQuota}
                      className="rounded-full border px-3 py-1.5 text-left text-xs transition-colors hover:bg-muted disabled:opacity-50"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {chatMessages.map((m, i) => (
              <div key={i} className={cn('flex text-sm', m.role === 'user' ? 'justify-end' : 'justify-start')}>
                {m.role === 'assistant' ? (
                  <div className="max-w-[90%] space-y-1 rounded-xl rounded-bl-sm bg-muted px-3 py-2 [&_h1]:font-semibold [&_h2]:font-semibold [&_h3]:font-semibold [&_li]:my-0.5 [&_ol]:list-decimal [&_ol]:pl-4 [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:pl-4">
                    <ReactMarkdown>{m.content}</ReactMarkdown>
                    {m.drafts?.length ? (
                      saved.has(i) ? (
                        <p className="flex items-center gap-1 pt-1 text-xs font-medium text-green-700 dark:text-green-400">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Tersimpan
                        </p>
                      ) : (
                        <Button size="sm" className="mt-1" onClick={() => openReview(i)}>
                          {t('Periksa & simpan', 'Review & save')}
                        </Button>
                      )
                    ) : null}
                  </div>
                ) : (
                  <span className="max-w-[85%] rounded-xl rounded-br-sm bg-primary px-3 py-2 text-primary-foreground">
                    {m.content}
                  </span>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex gap-1 px-1" aria-label={t('Sedang menjawab', 'Answering')}>
                {[0, 150, 300].map((d) => (
                  <span
                    key={d}
                    className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50"
                    style={{ animationDelay: `${d}ms` }}
                  />
                ))}
              </div>
            )}
          </div>

          {outOfQuota ? (
            <p className="border-t p-3 text-center text-xs text-muted-foreground">
              {t('Kuota pertanyaan bulan ini sudah habis. Kuota direset tiap awal bulan.', "This month's questions are used up. They reset at the start of each month.")}
            </p>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage();
              }}
              className="flex gap-2 border-t p-2"
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={listening ? t('Mendengarkan...', 'Listening...') : t('Tanya atau catat transaksi...', 'Ask or record a transaction...')}
                disabled={loading || listening}
                aria-label={t('Pertanyaan', 'Question')}
                maxLength={2000}
              />
              {canListen && (
                <Button
                  type="button"
                  size="icon"
                  variant={listening ? 'destructive' : 'outline'}
                  onClick={toggleVoice}
                  disabled={loading}
                  aria-label={listening ? t('Berhenti merekam', 'Stop recording') : t('Bicara', 'Speak')}
                  aria-pressed={listening}
                >
                  {listening ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
              )}
              <Button type="submit" size="icon" disabled={loading || !input.trim()} aria-label={t('Kirim', 'Send')}>
                <SendHorizontal className="h-4 w-4" />
              </Button>
            </form>
          )}
        </div>
      ) : (
        <Button
          size="icon"
          className="h-12 w-12 rounded-full shadow-lg"
          onClick={() => setOpen(true)}
          aria-label={t('Buka asisten AI', 'Open AI assistant')}
        >
          <MessageCircle className="h-5 w-5" />
        </Button>
      )}
      <OcrReviewDialog
        open={reviewing !== null}
        onOpenChange={(o) => !o && setReviewing(null)}
        items={reviewing !== null ? chatMessages[reviewing]?.drafts ?? [] : []}
        accounts={accounts}
        categories={categories}
        date={new Date()}
        onSave={saveDrafts}
        title={t('Periksa transaksi', 'Review transactions')}
      />
    </div>
  );
}

export default ChatWidget;
