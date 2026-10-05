import { z } from 'zod';

export const accountSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['bank', 'ewallet', 'cash']),
  currency: z.string().default('IDR'),
  openingBalance: z.number().nonnegative().default(0),
  archived: z.boolean().default(false),
  accountNumber: z.string().optional(),
});

export const categorySchema = z.object({
  name: z.string().min(1),
  type: z.enum(['expense', 'income']),
  color: z.string().optional(),
  icon: z.string().optional(),
});

export const currencyCodes = ['IDR', 'USD', 'EUR'] as const;

export const profileSchema = z.object({
  name: z.string().min(1).max(100),
  defaultCurrency: z.enum(currencyCodes),
});

export const profilePatchSchema = profileSchema.partial();

const monthSchema = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Invalid month format. Use YYYY-MM');

export const budgetItemSchema = z.object({
  categoryId: z.string().uuid(),
  amount: z.number().nonnegative(),
  rollover: z.boolean().default(false),
});

export const budgetItemsAddSchema = z.object({
  items: z.array(budgetItemSchema),
});

export const budgetItemPatchSchema = budgetItemSchema.partial();

export const budgetSchema = z.object({
  month: monthSchema,
  totalAmount: z.number().positive(),
  items: z.array(budgetItemSchema).default([]),
});

export const budgetPatchSchema = z.object({
  month: monthSchema.optional(),
  totalAmount: z.number().positive().optional(),
  items: z.array(budgetItemSchema).optional(),
});

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/);

const transactionBaseSchema = z.object({
  budgetMonth: monthSchema,
  actualDate: dateSchema,
  date: dateSchema.optional(),
  type: z.enum(['expense', 'income', 'transfer']),
  accountId: z.string().uuid().nullable().optional(),
  fromAccountId: z.string().uuid().nullable().optional(),
  toAccountId: z.string().uuid().nullable().optional(),
  amount: z.number().positive(),
  categoryId: z.string().uuid().nullable().optional(),
  note: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const transactionCreateSchema = transactionBaseSchema.superRefine(
  (data, ctx) => {
    if (data.type === 'expense' || data.type === 'income') {
      if (!data.accountId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['accountId'],
          message: 'accountId is required',
        });
      }
    } else if (data.type === 'transfer') {
      if (!data.fromAccountId || !data.toAccountId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['fromAccountId'],
          message: 'fromAccountId and toAccountId are required',
        });
      } else if (data.fromAccountId === data.toAccountId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['toAccountId'],
          message: 'fromAccountId and toAccountId must differ',
        });
      }
      if (data.categoryId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['categoryId'],
          message: 'categoryId must be null for transfers',
        });
      }
    }
  },
);

export const transactionPatchSchema = transactionBaseSchema
  .partial()
  .superRefine((data, ctx) => {
    if (data.type === 'expense' || data.type === 'income') {
      if (data.accountId === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['accountId'],
          message: 'accountId is required',
        });
      }
    } else if (data.type === 'transfer') {
      if (data.fromAccountId === undefined || data.toAccountId === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['fromAccountId'],
          message: 'fromAccountId and toAccountId are required',
        });
      } else if (data.fromAccountId === data.toAccountId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['toAccountId'],
          message: 'fromAccountId and toAccountId must differ',
        });
      }
      if (data.categoryId !== undefined && data.categoryId !== null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['categoryId'],
          message: 'categoryId must be null for transfers',
        });
      }
    }
  });

export type TransactionCreate = z.infer<typeof transactionCreateSchema>;
export type TransactionPatch = z.infer<typeof transactionPatchSchema>;

export const recurringSchema = z
  .object({
    type: z.enum(['expense', 'income', 'transfer']),
    accountId: z.string().uuid().nullable().optional(),
    fromAccountId: z.string().uuid().nullable().optional(),
    toAccountId: z.string().uuid().nullable().optional(),
    categoryId: z.string().uuid().nullable().optional(),
    amount: z.number().positive(),
    note: z.string().max(200).default(''),
    frequency: z.enum(['weekly', 'monthly']),
    dayOfMonth: z.number().int().min(1).max(31).nullable().optional(),
    startDate: dateSchema,
    endDate: dateSchema.nullable().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === 'transfer') {
      if (!data.fromAccountId || !data.toAccountId || data.fromAccountId === data.toAccountId) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['toAccountId'], message: 'Pilih dua akun yang berbeda' });
      }
    } else if (!data.accountId) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['accountId'], message: 'Pilih akun' });
    }
    if (data.frequency === 'monthly' && !data.dayOfMonth) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['dayOfMonth'], message: 'Pilih tanggal' });
    }
    if (data.endDate && data.endDate < data.startDate) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['endDate'], message: 'Tanggal selesai sebelum tanggal mulai' });
    }
  });

export const savingsGoalSchema = z.object({
  name: z.string().trim().min(1).max(80),
  targetAmount: z.number().positive(),
  savedAmount: z.number().nonnegative().default(0),
  targetDate: dateSchema.nullable().optional(),
  icon: z.string().max(40).nullable().optional(),
  color: z.string().max(20).nullable().optional(),
  archived: z.boolean().optional(),
});

export const savingsGoalPatchSchema = savingsGoalSchema.partial();

export const savingsContributionSchema = z.object({
  amount: z.number().refine((n) => n !== 0, 'Nominal tidak boleh 0'),
});
