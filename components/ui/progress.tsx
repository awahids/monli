'use client';

import * as React from 'react';

import { cn } from '@/lib/utils';

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
  indicatorClassName?: string;
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  (
    { className, value = 0, max = 100, indicatorClassName, ...props },
    ref,
  ) => {
    const clampedValue = Math.min(Math.max(value, 0), max);
    const percentage = max ? (clampedValue / max) * 100 : 0;

    return (
      <div
        ref={ref}
        role="progressbar"
        aria-valuenow={clampedValue}
        aria-valuemin={0}
        aria-valuemax={max}
        data-value={clampedValue}
        data-max={max}
        className={cn(
          'relative h-4 w-full overflow-hidden rounded-full bg-secondary',
          className,
        )}
        {...props}
      >
        <div
          className={cn('h-full bg-primary transition-all', indicatorClassName)}
          style={{ width: `${percentage}%` }}
        />
      </div>
    );
  },
);
Progress.displayName = 'Progress';

export { Progress };
