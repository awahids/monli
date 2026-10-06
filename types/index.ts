export interface User {
  id: string;
  email: string;
  name: string;
  defaultCurrency: string;
  onboardingCompleted: boolean;
  plan: 'FREE' | 'PRO';
  /** Day budget periods start on (1 = calendar month, 25 = payday the 25th). */
  budgetStartDay: number;
}

/** A shared space the user joined ("Kelola bersama"). */
export interface JoinedSpace {
  /** space_members row id, used to leave. */
  membershipId: string;
  ownerId: string;
  ownerName: string;
  role: 'editor' | 'viewer';
}

export interface ActiveSpace {
  /** Profile id whose rows are shown (user_id of accounts, transactions...). */
  ownerId: string;
  ownerName: string;
  role: 'owner' | 'editor' | 'viewer';
  isOwn: boolean;
  canWrite: boolean;
  /** Spaces the user can switch to, besides their own. */
  joined: JoinedSpace[];
  /** Names of the people in the active space, by profile id (owner and members). */
  people: Record<string, string>;
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
  /** Set when the transaction was created by a recurring rule. */
  recurringId?: string | null;
  /** Profile id of whoever recorded it (useful in shared spaces). */
  createdBy?: string | null;
  account?: Account;
  fromAccount?: Account;
  toAccount?: Account;
  category?: Category;
}

export interface RecurringTransaction {
  id: string;
  type: 'expense' | 'income' | 'transfer';
  accountId?: string | null;
  fromAccountId?: string | null;
  toAccountId?: string | null;
  categoryId?: string | null;
  amount: number;
  note: string;
  frequency: 'weekly' | 'monthly';
  dayOfMonth?: number | null;
  startDate: string;
  nextDate: string;
  endDate?: string | null;
  active: boolean;
  account?: Pick<Account, 'name' | 'type'> | null;
  fromAccount?: Pick<Account, 'name' | 'type'> | null;
  toAccount?: Pick<Account, 'name' | 'type'> | null;
  category?: Pick<Category, 'name' | 'color' | 'icon'> | null;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  savedAmount: number;
  targetDate?: string | null;
  icon?: string | null;
  color?: string | null;
  archived: boolean;
  createdAt: string;
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