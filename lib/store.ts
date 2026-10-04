import { create } from 'zustand';
import { User, Account, Category, Transaction, Budget } from '@/types';

// Check if we're in browser environment
const isBrowser = typeof window !== 'undefined';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface AppState {
  user: User | null;
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  budgets: Budget[];
  loading: boolean;
  isOfflineMode: boolean;

  // Chat
  chatMessages: ChatMessage[];
  
  // Actions
  setUser: (user: User | null) => void;
  setAccounts: (accounts: Account[]) => void;
  setCategories: (categories: Category[]) => void;
  setTransactions: (transactions: Transaction[]) => void;
  setBudgets: (budgets: Budget[]) => void;
  setLoading: (loading: boolean) => void;
  setOfflineMode: (isOffline: boolean) => void;

  addChatMessage: (message: ChatMessage) => void;
  clearChatMessages: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  accounts: [],
  categories: [],
  transactions: [],
  budgets: [],
  loading: false,
  isOfflineMode: isBrowser ? !navigator.onLine : false,
  chatMessages: [],

  setUser: (user) => set({ user }),
  setAccounts: (accounts) => set({ accounts }),
  setCategories: (categories) => set({ categories }),
  setTransactions: (transactions) => set({ transactions }),
  setBudgets: (budgets) => set({ budgets }),
  setLoading: (loading) => set({ loading }),
  setOfflineMode: (isOffline) => set({ isOfflineMode: isOffline }),

  addChatMessage: (message) =>
    set(state => ({ chatMessages: [...state.chatMessages, message] })),
  clearChatMessages: () => set({ chatMessages: [] }),
}));