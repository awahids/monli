import { toast } from 'sonner';

let pending: Promise<number> | null = null;

/**
 * Asks the server to record recurring transactions that are due. Runs at
 * most once per page load (concurrent callers share the request) and
 * resolves with the number of transactions created; never throws.
 */
export function runDueRecurring(): Promise<number> {
  if (!pending) {
    pending = fetch('/api/recurring/run', { method: 'POST' })
      .then((res) => (res.ok ? res.json() : { created: 0 }))
      .then((data) => {
        const created = Number(data?.created) || 0;
        if (created > 0) toast.success(`${created} transaksi rutin otomatis dicatat`);
        return created;
      })
      .catch(() => 0);
  }
  return pending;
}

/** Lets the next call run again, e.g. after a rule was created or resumed. */
export function resetDueRecurring() {
  pending = null;
}
