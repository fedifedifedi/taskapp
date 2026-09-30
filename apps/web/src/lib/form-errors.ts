import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';
import { ApiError } from '../api/client';

/**
 * Reporte les erreurs de validation renvoyées par l'API sur les champs du formulaire.
 * Renvoie le message global à afficher (ou null si tout a été rattaché à un champ).
 */
export function applyServerErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  fields: readonly Path<T>[],
): string | null {
  if (!(error instanceof ApiError)) return 'Une erreur inattendue est survenue';

  let unmatched = error.details.length === 0;
  for (const issue of error.details) {
    const field = fields.find((name) => name === issue.path);
    if (field) setError(field, { type: 'server', message: issue.message });
    else unmatched = true;
  }
  return unmatched ? error.message : null;
}
