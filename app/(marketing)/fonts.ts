import { Onest } from 'next/font/google';

/** Editorial face for the landing page only. */
export const onest = Onest({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-onest',
  display: 'swap',
});
