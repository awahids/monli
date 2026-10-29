export interface Database {
  // Qala Saku lives in its own schema of a shared Supabase project.
  saku: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          name: string;
          default_currency: string;
          plan: 'FREE' | 'PRO';
          /** End of a PRO trial; null when PRO has no end or the plan is FREE. */
          pro_until: string | null;
          ai_unlimited: boolean;
          live_price_used_at: string | null;
          onboarding_completed: boolean;
          budget_start_day: number;
          avatar_seed: string | null;
          avatar_path: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name: string;
          default_currency?: string;
          plan?: 'FREE' | 'PRO';
          pro_until?: string | null;
          ai_unlimited?: boolean;
          live_price_used_at?: string | null;
          onboarding_completed?: boolean;
          budget_start_day?: number;
          avatar_seed?: string | null;
          avatar_path?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          default_currency?: string;
          plan?: 'FREE' | 'PRO';
          pro_until?: string | null;
          ai_unlimited?: boolean;
          live_price_used_at?: string | null;
          onboarding_completed?: boolean;
          budget_start_day?: number;
          avatar_seed?: string | null;
          avatar_path?: string | null;
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
          /** Counts toward the daily allowance; off for savings and the like. */
          daily_allowance: boolean;
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
          daily_allowance?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          type?: 'expense' | 'income';
          color?: string;
          icon?: string;
          daily_allowance?: boolean;
          updated_at?: string;
        };
      };
      budgets: {
        Row: {
          id: string;
          user_id: string;
          month: string;
          total_amount: number;
          rollover: boolean;
          /** Computed field (saku.carry): leftover carried in from last period. */
          carry: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          month: string;
          total_amount?: number;
          rollover?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          month?: string;
          total_amount?: number;
          rollover?: boolean;
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
          /** Generated from tags for partial search. */
          tags_text: string;
          receipt_path: string | null;
          attachments: string[];
          created_by: string | null;
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
          receipt_path?: string | null;
          attachments?: string[];
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
          receipt_path?: string | null;
          attachments?: string[];
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
          months: number;
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
          months?: number;
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
      space_members: {
        Row: {
          id: string;
          owner_id: string;
          member_id: string | null;
          email: string;
          role: 'editor' | 'viewer';
          status: 'pending' | 'active';
          token: string;
          member_name: string | null;
          created_at: string;
          accepted_at: string | null;
        };
        Insert: {
          id?: string;
          owner_id: string;
          email: string;
          role?: 'editor' | 'viewer';
        };
        Update: {
          role?: 'editor' | 'viewer';
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
      push_subscriptions: {
        Row: {
          endpoint: string;
          user_id: string;
          p256dh: string;
          auth: string;
          budget_alerts: boolean;
          created_at: string;
        };
        Insert: {
          endpoint: string;
          user_id: string;
          p256dh: string;
          auth: string;
          budget_alerts?: boolean;
        };
        Update: {
          user_id?: string;
          p256dh?: string;
          auth?: string;
          budget_alerts?: boolean;
        };
      };
      push_schedule: {
        Row: {
          user_id: string;
          id: number;
          kind: 'bill' | 'daily' | 'report' | 'weekly' | 'other';
          title: string;
          body: string;
          url: string;
          send_at: string;
        };
        Insert: {
          user_id: string;
          id: number;
          kind?: 'bill' | 'daily' | 'report' | 'weekly' | 'other';
          title: string;
          body: string;
          url: string;
          send_at: string;
        };
        Update: {
          send_at?: string;
        };
      };
      push_budget_alerts: {
        Row: {
          user_id: string;
          month: string;
          category_id: string;
          level: 80 | 100;
          sent_at: string;
        };
        Insert: {
          user_id: string;
          month: string;
          category_id: string;
          level: 80 | 100;
          sent_at?: string;
        };
        Update: {
          level?: 80 | 100;
          sent_at?: string;
        };
      };
    };
  };
}
