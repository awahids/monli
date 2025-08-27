export interface User {
  id: string;
  email: string;
  name: string;
  defaultCurrency: string;
  onboardingCompleted: boolean;
  plan: 'FREE' | 'PRO';
}

export interface Account {
  id: string;
  userId: string;
  name: string;
  type: 'bank' | 'ewallet' | 'cash';
  currency: string;
  openingBalance: number;
  archived: boolean;
  currentBalance?: number;
  accountNumber?: string;
}

export interface Category {
  id: string;
  userId: string;
  name: string;
  type: 'expense' | 'income';
  color: string;
  icon: string;
}

export interface Budget {
  id: string;
  userId: string;
  month: string;
  totalAmount: number;
  items: BudgetItem[];
}

export interface BudgetItem {
  id: string;
  budgetId: string;
  categoryId: string;
  amount: number;
  rollover: boolean;
  category?: Category;
  actual?: number;
}

export interface Transaction {
  id: string;
  userId: string;
  /** @deprecated use actualDate */
  date: string;
  actualDate: string;
  budgetMonth: string;
  type: 'expense' | 'income' | 'transfer';
  accountId?: string;
  fromAccountId?: string;
  toAccountId?: string;
  amount: number;
  categoryId?: string;
  note: string;
  tags: string[];
  account?: Account;
  fromAccount?: Account;
  toAccount?: Account;
  category?: Category;
}

export interface DashboardKPIs {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  savings: number;
}

export interface CategorySpend {
  categoryId: string;
  categoryName: string;
  amount: number;
  budgeted: number;
  color: string;
}

export interface Payment {
  id: string;
  userId: string;
  orderId: string;
  productName: string;
  amount: number;
  status: string;
  createdAt: string;
}

export type { CategoryPoint, ChartResponse } from './reports';