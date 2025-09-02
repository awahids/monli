'use client';

import { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useAppStore } from '@/lib/store';

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const { chatMessages, addChatMessage } = useAppStore();
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const message = input.trim();
    addChatMessage({ role: 'user', content: message });
    setInput('');
    setLoading(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to get response');
      addChatMessage({ role: 'assistant', content: data.answer });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to chat');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {open ? (
        <div className="w-80 h-96 rounded-lg border bg-background shadow-lg flex flex-col">
          <div className="flex items-center justify-between p-2 border-b">
            <span className="font-medium">Chat</span>
            <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <ScrollArea className="flex-1 p-2">
            {chatMessages.map((m, i) => (
              <div
                key={i}
                className={cn('mb-2 text-sm', m.role === 'user' ? 'text-right' : 'text-left')}
              >
                {m.role === 'assistant' ? (
                  <div
                    className={cn(
                      'rounded-lg px-3 py-2 text-left',
                      'bg-muted whitespace-pre-wrap'
                    )}
                  >
                    <ReactMarkdown>{m.content}</ReactMarkdown>
                  </div>
                ) : (
                  <span
                    className={cn(
                      'inline-block rounded-lg px-3 py-2',
                      'bg-primary text-primary-foreground'
                    )}
                  >
                    {m.content}
                  </span>
                )}
              </div>
            ))}
            {loading && <div className="text-sm text-muted-foreground">Thinking...</div>}
          </ScrollArea>
          <form
            onSubmit={e => {
              e.preventDefault();
              sendMessage();
            }}
            className="p-2 border-t flex gap-2"
          >
            <Input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask something..."
              disabled={loading}
            />
            <Button type="submit" disabled={loading}>
              Send
            </Button>
          </form>
        </div>
      ) : (
        <Button size="icon" className="rounded-full shadow-lg" onClick={() => setOpen(true)}>
          <MessageCircle className="h-5 w-5" />
        </Button>
      )}
    </div>
  );
}

export default ChatWidget;

