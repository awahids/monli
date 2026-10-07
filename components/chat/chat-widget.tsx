'use client';

import { useEffect, useRef, useState } from 'react';
import { MessageCircle, SendHorizontal, Sparkles, Trash2, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useAppStore } from '@/lib/store';

type Usage = { used: number; limit: number; unlimited: boolean };

const SUGGESTIONS = [
  'Ringkas pengeluaranku bulan ini',
  'Kategori apa yang paling boros?',
  'Apakah budget bulan ini masih aman?',
  'Bandingkan pengeluaran dengan bulan lalu',
];

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const { chatMessages, addChatMessage, clearChatMessages } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [usage, setUsage] = useState<Usage | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

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
    const history = useAppStore.getState().chatMessages;
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
      if (!res.ok) throw new Error(data.error || 'Gagal mendapat jawaban');
      addChatMessage({ role: 'assistant', content: data.answer });
      if (data.usage) setUsage(data.usage);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Gagal mengirim pesan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-[calc(6.5rem+env(safe-area-inset-bottom))] right-[max(1rem,calc(50vw-13rem))] z-50">
      {open ? (
        <div
          role="dialog"
          aria-label="Asisten keuangan AI"
          className="flex h-[calc(100dvh-8rem)] w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-xl border bg-background shadow-xl"
        >
          <div className="flex items-center justify-between border-b px-3 py-2">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-accent-foreground">
                <Sparkles className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-semibold leading-tight">Asisten Qala Saku</p>
                <p className="text-xs text-muted-foreground">
                  {usage?.unlimited
                    ? 'Tanpa batas'
                    : remaining !== null
                    ? `${remaining} dari ${usage!.limit} pertanyaan tersisa bulan ini`
                    : 'Bertanya soal keuanganmu'}
                </p>
              </div>
            </div>
            <div className="flex">
              {chatMessages.length > 0 && (
                <Button variant="ghost" size="icon" onClick={clearChatMessages} aria-label="Hapus percakapan">
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Tutup chat">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-3">
            {chatMessages.length === 0 && (
              <div className="space-y-3 pt-2">
                <p className="text-sm text-muted-foreground">
                  Tanyakan apa saja soal transaksi, budget, dan saldomu. Jawaban hanya berdasarkan data di
                  akunmu.
                </p>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTIONS.map((s) => (
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
                  </div>
                ) : (
                  <span className="max-w-[85%] rounded-xl rounded-br-sm bg-primary px-3 py-2 text-primary-foreground">
                    {m.content}
                  </span>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex gap-1 px-1" aria-label="Sedang menjawab">
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
              Kuota pertanyaan bulan ini sudah habis. Kuota direset tiap awal bulan.
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
                placeholder="Tulis pertanyaan..."
                disabled={loading}
                aria-label="Pertanyaan"
                maxLength={2000}
              />
              <Button type="submit" size="icon" disabled={loading || !input.trim()} aria-label="Kirim">
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
          aria-label="Buka asisten AI"
        >
          <MessageCircle className="h-5 w-5" />
        </Button>
      )}
    </div>
  );
}

export default ChatWidget;
