import type { ReactNode } from 'react';

export function AuthCard({
  title,
  children,
  footer,
}: {
  title: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <p className="text-2xl font-bold text-indigo-600">TaskApp</p>
          <h1 className="mt-2 text-xl font-semibold text-slate-900">{title}</h1>
        </div>
        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">{children}</div>
        <p className="text-center text-sm text-slate-600">{footer}</p>
      </div>
    </main>
  );
}
