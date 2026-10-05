'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { getDisplayCurrency, parseMoney } from '@/lib/currency';

const SYMBOLS: Record<string, string> = { IDR: 'Rp', USD: '$', EUR: '€' };
const LOCALES: Record<string, string> = { IDR: 'id-ID', USD: 'en-US', EUR: 'de-DE' };

export interface MoneyInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'size'> {
  value: number | undefined | null;
  onValueChange: (value: number) => void;
  currency?: string;
  size?: 'default' | 'lg';
}

/**
 * Amount field with a fixed currency prefix and thousand separators.
 * Empty when the value is 0 so users don't have to delete a placeholder
 * "Rp 0" before typing.
 */
export const MoneyInput = React.forwardRef<HTMLInputElement, MoneyInputProps>(
  ({ value, onValueChange, currency, size = 'default', className, ...props }, ref) => {
    const code = currency ?? getDisplayCurrency();
    const display =
      value && value > 0
        ? new Intl.NumberFormat(LOCALES[code] ?? 'id-ID', { maximumFractionDigits: 0 }).format(value)
        : '';

    return (
      <div
        className={cn(
          'flex items-center rounded-md border border-input bg-background ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
          size === 'lg' ? 'h-16 px-4' : 'h-10 px-3',
          className
        )}
      >
        <span
          className={cn(
            'mr-2 shrink-0 font-semibold text-muted-foreground',
            size === 'lg' ? 'text-2xl' : 'text-sm'
          )}
        >
          {SYMBOLS[code] ?? code}
        </span>
        <input
          ref={ref}
          inputMode="numeric"
          autoComplete="off"
          placeholder="0"
          value={display}
          onChange={(e) => onValueChange(parseMoney(e.target.value))}
          className={cn(
            'w-full min-w-0 bg-transparent outline-none placeholder:text-muted-foreground/60',
            size === 'lg' ? 'font-display text-3xl font-bold tabular-nums' : 'text-sm'
          )}
          {...props}
        />
      </div>
    );
  }
);
MoneyInput.displayName = 'MoneyInput';
