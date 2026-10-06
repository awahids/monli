'use client';

import { useEffect, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { suggestTags, type TagHistoryRow } from '@/lib/tags';

let historyRequest: Promise<TagHistoryRow[]> | null = null;

/** The user's tag history, fetched once per page load and shared by every form. */
function loadTagHistory(): Promise<TagHistoryRow[]> {
  if (!historyRequest) {
    historyRequest = fetch('/api/transactions/tag-history')
      .then((res) => (res.ok ? res.json() : { rows: [] }))
      .then((data) => (Array.isArray(data.rows) ? data.rows : []))
      .catch(() => {
        historyRequest = null;
        return [];
      });
  }
  return historyRequest;
}

interface Props {
  note?: string;
  categoryId?: string;
  tags: string[];
  onAdd: (tag: string) => void;
}

/** "Tag: +kantor +makan-siang" chips under the note, learned from past transactions. */
export function TagSuggestions({ note, categoryId, tags, onAdd }: Props) {
  const [history, setHistory] = useState<TagHistoryRow[]>([]);

  useEffect(() => {
    let active = true;
    loadTagHistory().then((rows) => active && setHistory(rows));
    return () => {
      active = false;
    };
  }, []);

  const suggestions = useMemo(
    () => suggestTags(history, { note, categoryId, exclude: tags }),
    [history, note, categoryId, tags]
  );

  if (!suggestions.length) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5" aria-label="Saran tag">
      <span className="text-xs text-muted-foreground">Saran tag:</span>
      {suggestions.map((tag) => (
        <button
          key={tag}
          type="button"
          onClick={() => onAdd(tag)}
          className="inline-flex items-center gap-0.5 rounded-full border border-dashed px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:border-solid hover:bg-muted hover:text-foreground"
        >
          <Plus className="h-3 w-3" />
          {tag}
        </button>
      ))}
    </div>
  );
}
