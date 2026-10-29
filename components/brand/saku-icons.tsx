import type { CSSProperties, ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Qala Saku's own icons for the main navigation: rounded 2px strokes in the
 * current colour, each carrying the Warm Gold diamond from the Qala mark
 * (components/brand/qala-mark.tsx). Drop-in for lucide icons: size them with
 * `className`. The diamond pops when its link is the current page (globals.css).
 * Category icons in the same style: components/transactions/category-icon.tsx.
 */
export type SakuIconProps = { className?: string; style?: CSSProperties };
export type SakuIcon = (props: SakuIconProps) => JSX.Element;

export function Icon({ className, style, children }: SakuIconProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('saku-icon h-6 w-6', className)}
      style={style}
      aria-hidden
    >
      {children}
    </svg>
  );
}

/** The gold diamond, centred on (x, y) with half-diagonal r. */
export function Gem({ x, y, r }: { x: number; y: number; r: number }) {
  return (
    <path
      className="saku-gem"
      d={`M${x} ${y - r}L${x + r} ${y}L${x} ${y + r}L${x - r} ${y}Z`}
      fill="hsl(var(--brand-gold))"
      stroke="none"
    />
  );
}

export const HomeIcon: SakuIcon = (props) => (
  <Icon {...props}>
    <path d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1Z" />
    <Gem x={12} y={14.5} r={2.8} />
  </Icon>
);

export const ReceiptIcon: SakuIcon = (props) => (
  <Icon {...props}>
    <path d="M6 3h12v18l-2-1.5-2 1.5-2-1.5-2 1.5-2-1.5L6 21Z" />
    <path d="M9 8h6M9 12h3" />
    <Gem x={15} y={12.5} r={1.9} />
  </Icon>
);

/** A pie whose missing slice is the diamond. */
export const BudgetIcon: SakuIcon = (props) => (
  <Icon {...props}>
    <path d="M11 4.1A8 8 0 1 0 19.9 13H11Z" />
    <Gem x={16.6} y={7.4} r={3.4} />
  </Icon>
);

export const MoreIcon: SakuIcon = (props) => (
  <Icon {...props}>
    <rect x="4" y="4" width="6.5" height="6.5" rx="2" />
    <rect x="13.5" y="4" width="6.5" height="6.5" rx="2" />
    <rect x="4" y="13.5" width="6.5" height="6.5" rx="2" />
    <Gem x={16.75} y={16.75} r={3.9} />
  </Icon>
);

export const AddIcon: SakuIcon = (props) => (
  <Icon {...props}>
    <path d="M12 4v5M12 15v5M4 12h5M15 12h5" />
    <Gem x={12} y={12} r={2.4} />
  </Icon>
);

export const AccountsIcon: SakuIcon = (props) => (
  <Icon {...props}>
    <rect x="3" y="5.5" width="18" height="13" rx="3" />
    <path d="M3 10h18" />
    <Gem x={16.5} y={14.3} r={1.9} />
  </Icon>
);

export const GoalIcon: SakuIcon = (props) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="8.5" />
    <circle cx="12" cy="12" r="4.5" />
    <Gem x={12} y={12} r={2} />
  </Icon>
);

/** A flag on its pole, the diamond waving on the cloth. */
export const ChallengeIcon: SakuIcon = (props) => (
  <Icon {...props}>
    <path d="M6 21V4" />
    <path d="M6 4.5h11l-2.5 4 2.5 4H6" />
    <Gem x={11} y={8.5} r={2} />
  </Icon>
);

export const DebtIcon: SakuIcon = (props) => (
  <Icon {...props}>
    <path d="M4 7.5h14M15 4.5l3 3-3 3" />
    <path d="M20 16.5H6M9 13.5l-3 3 3 3" />
    <Gem x={12} y={12} r={1.6} />
  </Icon>
);

export const RecurringIcon: SakuIcon = (props) => (
  <Icon {...props}>
    <path d="M4.6 10A7.6 7.6 0 0 1 18.4 7.6" />
    <path d="M19 3.8v4.1h-4.1" />
    <path d="M19.4 14A7.6 7.6 0 0 1 5.6 16.4" />
    <path d="M5 20.2v-4.1h4.1" />
    <Gem x={12} y={12} r={2.3} />
  </Icon>
);

/** Rising bars, the tallest crowned with the diamond. */
export const ReportIcon: SakuIcon = (props) => (
  <Icon {...props}>
    <path d="M4 20h16" />
    <path d="M7 16.5v-3.5M12 16.5V9.5M17 16.5V12" />
    <Gem x={17} y={6.8} r={2.4} />
  </Icon>
);

export const WrappedIcon: SakuIcon = (props) => (
  <Icon {...props}>
    <path d="m10 3 1.6 4.4L16 9l-4.4 1.6L10 15l-1.6-4.4L4 9l4.4-1.6Z" />
    <Gem x={17.5} y={17} r={2.8} />
  </Icon>
);

/** An open bowl offering the diamond. */
export const ZakatIcon: SakuIcon = (props) => (
  <Icon {...props}>
    <path d="M3.5 12.5h17c0 4.1-3.8 7.5-8.5 7.5s-8.5-3.4-8.5-7.5Z" />
    <path d="M7 9.5 5.8 8.3M17 9.5l1.2-1.2" />
    <Gem x={12} y={7} r={3} />
  </Icon>
);

/** Two sliders; the first knob is the diamond. */
export const SettingsIcon: SakuIcon = (props) => (
  <Icon {...props}>
    <path d="M4 7.5h8M18.5 7.5H20M4 16.5h2.5M12 16.5h8" />
    <Gem x={15.3} y={7.5} r={3} />
    <circle cx="9.2" cy="16.5" r="2.6" />
  </Icon>
);

export const NewsIcon: SakuIcon = (props) => (
  <Icon {...props}>
    <path d="M4 10v4a1 1 0 0 0 1 1h2l6 4V5L7 9H5a1 1 0 0 0-1 1Z" />
    <path d="m17.5 7 1.5-1.5M17.5 17l1.5 1.5" />
    <Gem x={18.5} y={12} r={2} />
  </Icon>
);

export const GuideIcon: SakuIcon = (props) => (
  <Icon {...props}>
    <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5Z" />
    <path d="M13 4h5.5A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5H13Z" />
    <Gem x={16.5} y={9} r={1.9} />
  </Icon>
);
