export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          name: string;
          default_currency: string;
          plan: 'FREE' | 'PRO';
          live_price_used_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name: string;
          default_currency?: string;
          plan?: 'FREE' | 'PRO';
          live_price_used_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          default_currency?: string;
          plan?: 'FREE' | 'PRO';
          live_price_used_at?: string | null;
          updated_at?: string;
        };
      };
      accounts: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          type: 'bank' | 'ewallet' | 'cash';
          currency: string;
          opening_balance: number;
          current_balance: number;
          archived: boolean;
          account_number: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          type: 'bank' | 'ewallet' | 'cash';
          currency?: string;
          opening_balance?: number;
          current_balance?: number;
          archived?: boolean;
          account_number?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          type?: 'bank' | 'ewallet' | 'cash';
          currency?: string;
          opening_balance?: number;
          current_balance?: number;
          archived?: boolean;
          account_number?: string | null;
          updated_at?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          type: 'expense' | 'income';
          color: string;
          icon: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          type: 'expense' | 'income';
          color?: string;
          icon?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          type?: 'expense' | 'income';
          color?: string;
          icon?: string;
          updated_at?: string;
        };
      };
      budgets: {
        Row: {
          id: string;
          user_id: string;
          month: string;
          total_amount: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          month: string;
          total_amount?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          month?: string;
          total_amount?: number;
          updated_at?: string;
        };
      };
      budget_items: {
        Row: {
          id: string;
          budget_id: string;
          category_id: string;
          amount: number;
          rollover: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          budget_id: string;
          category_id: string;
          amount: number;
          rollover?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          category_id?: string;
          amount?: number;
          rollover?: boolean;
          updated_at?: string;
        };
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          actual_date: string;
          budget_month: string;
          type: 'expense' | 'income' | 'transfer';
          account_id: string | null;
          from_account_id: string | null;
          to_account_id: string | null;
          amount: number;
          category_id: string | null;
          note: string;
          tags: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date: string;
          actual_date?: string;
          budget_month?: string;
          type: 'expense' | 'income' | 'transfer';
          account_id?: string | null;
          from_account_id?: string | null;
          to_account_id?: string | null;
          amount: number;
          category_id?: string | null;
          note?: string;
          tags?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          date?: string;
          actual_date?: string;
          budget_month?: string;
          type?: 'expense' | 'income' | 'transfer';
          account_id?: string | null;
          from_account_id?: string | null;
          to_account_id?: string | null;
          amount?: number;
          category_id?: string | null;
          note?: string;
          tags?: string[];
          updated_at?: string;
        };
      };

      payments: {
        Row: {
          id: string;
          user_id: string;
          order_id: string;
          product_name: string;
          amount: number;
          status: string;
          token: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          order_id: string;
          product_name: string;
          amount: number;
          status?: string;
          token: string;
          created_at?: string;
        };
        Update: {
          product_name?: string;
          amount?: number;
          status?: string;
          token?: string;
        };
      };
      ai_logs: {
        Row: {
          id: string;
          email: string;
          feature: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          feature: string;
          created_at?: string;
        };
        Update: {
          email?: string;
          feature?: string;
          created_at?: string;
        };
      };
    };
  };
}
