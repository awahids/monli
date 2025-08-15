export interface User {
  id: string;
  email: string;
  name: string;
  defaultCurrency: string;
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
  date: string;
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
  monthlyBudget: number;
  monthlyActual: number;
  mtdSpend: number;
  dailyAverage: number;
  remainingAllowance: number;
}

export interface CategorySpend {
  categoryId: string;
  categoryName: string;
  amount: number;
  budgeted: number;
  color: string;
}