import { create } from 'zustand';
import { User, Account, Category, Transaction, Budget, ActiveSpace } from '@/types';
import type { OcrItem } from '@/lib/ocr';

// Check if we're in browser environment
const isBrowser = typeof window !== 'undefined';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  /** Transactions the assistant proposes to record ("catat ..."). */
  drafts?: OcrItem[];
}

interface AppState {
  user: User | null;
  /** Whose data the app shows: the user's own space or a shared one. */
  space: ActiveSpace | null;
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  budgets: Budget[];
  loading: boolean;
  isOfflineMode: boolean;
  /**
   * Bumped after transactions change anywhere (the + button, edits, offline
   * sync). Pages that show totals reload when it changes.
   */
  dataVersion: number;

  // Chat
  chatMessages: ChatMessage[];
  
  // Actions
  setUser: (user: User | null) => void;
  setSpace: (space: ActiveSpace | null) => void;
  setAccounts: (accounts: Account[]) => void;
  setCategories: (categories: Category[]) => void;
  setTransactions: (transactions: Transaction[]) => void;
  setBudgets: (budgets: Budget[]) => void;
  setLoading: (loading: boolean) => void;
  setOfflineMode: (isOffline: boolean) => void;
  bumpData: () => void;

  addChatMessage: (message: ChatMessage) => void;
  clearChatMessages: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  space: null,
  accounts: [],
  categories: [],
  transactions: [],
  budgets: [],
  loading: false,
  isOfflineMode: isBrowser ? !navigator.onLine : false,
  dataVersion: 0,
  chatMessages: [],

  setUser: (user) => set({ user }),
  setSpace: (space) => set({ space }),
  setAccounts: (accounts) => set({ accounts }),
  setCategories: (categories) => set({ categories }),
  setTransactions: (transactions) => set({ transactions }),
  setBudgets: (budgets) => set({ budgets }),
  setLoading: (loading) => set({ loading }),
  setOfflineMode: (isOffline) => set({ isOfflineMode: isOffline }),
  bumpData: () => set((state) => ({ dataVersion: state.dataVersion + 1 })),

  addChatMessage: (message) =>
    set(state => ({ chatMessages: [...state.chatMessages, message] })),
  clearChatMessages: () => set({ chatMessages: [] }),
}));