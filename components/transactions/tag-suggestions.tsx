'use client';

import { useEffect, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import type { Category } from '@/types';
import { suggestCategory, suggestTags, type TagHistoryRow } from '@/lib/tags';
import { spacePlan } from '@/lib/plans';
import { useAppStore } from '@/lib/store';
import { useT } from '@/lib/i18n';
import { CategoryIcon } from '@/components/transactions/category-icon';

let historyRequest: Promise<TagHistoryRow[]> | null = null;

/** The space's note/tag history, fetched once per page load and shared by every form. */
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
  /** Categories of the transaction's type; empty for transfers. */
  categories: Category[];
  tags: string[];
  onAdd: (tag: string) => void;
  onCategory: (categoryId: string) => void;
}

/** PRO: "Saran: [Makan] +kantor +makan-siang" under the note, learned from past transactions. */
export function TagSuggestions({ note, categoryId, categories, tags, onAdd, onCategory }: Props) {
  const { user, space } = useAppStore();
  const { t } = useT();
  const isPro = spacePlan(user, space) === 'PRO';
  const [history, setHistory] = useState<TagHistoryRow[]>([]);

  useEffect(() => {
    if (!isPro) return;
    let active = true;
    loadTagHistory().then((rows) => active && setHistory(rows));
    return () => {
      active = false;
    };
  }, [isPro]);

  const suggestedTags = useMemo(
    () => suggestTags(history, { note, categoryId, exclude: tags }),
    [history, note, categoryId, tags]
  );
  const suggestedCategory = useMemo(() => {
    const id = suggestCategory(history, note, categories);
    return id && id !== categoryId ? categories.find((c) => c.id === id) : undefined;
  }, [history, note, categories, categoryId]);

  if (!isPro || (!suggestedTags.length && !suggestedCategory)) return null;

  const chip =
    'inline-flex items-center gap-1 rounded-full border border-dashed px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:border-solid hover:bg-muted hover:text-foreground';
  return (
    <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label={t('Saran', 'Suggestions')}>
      <span className="text-xs text-muted-foreground">{t('Saran:', 'Suggested:')}</span>
      {suggestedCategory && (
        <button
          type="button"
          onClick={() => onCategory(suggestedCategory.id)}
          aria-label={t(`Pakai kategori ${suggestedCategory.name}`, `Use category ${suggestedCategory.name}`)}
          className={chip}
        >
          <CategoryIcon name={suggestedCategory.icon} className="h-3 w-3" style={{ color: suggestedCategory.color || undefined }} />
          {suggestedCategory.name}
        </button>
      )}
      {suggestedTags.map((tag) => (
        <button key={tag} type="button" onClick={() => onAdd(tag)} aria-label={t(`Tambah tag ${tag}`, `Add tag ${tag}`)} className={chip}>
          <Plus className="h-3 w-3" />
          {tag}
        </button>
      ))}
    </div>
  );
}
