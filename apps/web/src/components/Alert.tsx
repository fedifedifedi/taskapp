import type { ReactNode } from 'react';
import { AlertIcon } from './icons';

export function ErrorAlert({ children }: { children: ReactNode }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
    >
      <AlertIcon className="mt-0.5 size-4 shrink-0" />
      <div>{children}</div>
    </div>
  );
}
