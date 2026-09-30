import type { PaginationMeta } from '@taskapp/shared';
import { Button } from '../../components/Button';

interface PaginationProps {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
}

export function Pagination({ meta, onPageChange }: PaginationProps) {
  if (meta.totalPages <= 1) return null;
  return (
    <nav aria-label="Pagination" className="flex items-center justify-between pt-2">
      <Button
        variant="secondary"
        disabled={meta.page <= 1}
        onClick={() => onPageChange(meta.page - 1)}
      >
        Précédent
      </Button>
      <p className="text-sm text-slate-600">
        Page {meta.page} sur {meta.totalPages}
      </p>
      <Button
        variant="secondary"
        disabled={meta.page >= meta.totalPages}
        onClick={() => onPageChange(meta.page + 1)}
      >
        Suivant
      </Button>
    </nav>
  );
}
