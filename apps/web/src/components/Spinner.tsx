export function Spinner({ label = 'Chargement…' }: { label?: string }) {
  return (
    <div role="status" className="flex items-center justify-center gap-3 py-10 text-slate-500">
      <span
        aria-hidden="true"
        className="size-5 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent"
      />
      <span className="text-sm">{label}</span>
    </div>
  );
}
