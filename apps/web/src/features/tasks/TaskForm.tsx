import { zodResolver } from '@hookform/resolvers/zod';
import {
  createTaskSchema,
  TASK_DESCRIPTION_MAX_LENGTH,
  TASK_TITLE_MAX_LENGTH,
  type CreateTaskInput,
  type TaskDto,
} from '@taskapp/shared';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { ErrorAlert } from '../../components/Alert';
import { Button } from '../../components/Button';
import { SelectField, TextAreaField, TextField } from '../../components/FormField';
import { applyServerErrors } from '../../lib/form-errors';
import { STATUS_OPTIONS } from '../../lib/task-status';

interface TaskFormProps {
  /** Tâche à modifier ; absente pour une création. */
  task?: TaskDto;
  submitLabel: string;
  onSubmit: (input: CreateTaskInput) => Promise<unknown>;
  onCancel?: () => void;
}

export function TaskForm({ task, submitLabel, onSubmit, onCancel }: TaskFormProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      title: task?.title ?? '',
      description: task?.description ?? '',
      status: task?.status ?? 'TODO',
    },
  });

  const submit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await onSubmit(values);
      if (!task) reset();
    } catch (error) {
      setFormError(applyServerErrors(error, setError, ['title', 'description', 'status']));
    }
  });

  return (
    <form onSubmit={submit} noValidate className="space-y-4" aria-label={submitLabel}>
      {formError && <ErrorAlert>{formError}</ErrorAlert>}
      <TextField
        label="Titre"
        maxLength={TASK_TITLE_MAX_LENGTH}
        placeholder="Ex. : Préparer la démo"
        error={errors.title?.message}
        {...register('title')}
      />
      <TextAreaField
        label="Description (optionnelle)"
        maxLength={TASK_DESCRIPTION_MAX_LENGTH}
        error={errors.description?.message}
        {...register('description')}
      />
      <SelectField
        label="Statut"
        options={STATUS_OPTIONS}
        error={errors.status?.message}
        {...register('status')}
      />
      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button variant="secondary" onClick={onCancel}>
            Annuler
          </Button>
        )}
        <Button type="submit" loading={isSubmitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
