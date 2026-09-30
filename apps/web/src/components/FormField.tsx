import {
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type Ref,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';

export const FIELD_CLASSES =
  'block w-full rounded-lg border-0 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm ring-1 ring-inset transition placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-500 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500';

interface FieldWrapperProps {
  id: string;
  label: string;
  error?: string;
  children: ReactNode;
}

function FieldWrapper({ id, label, error, children }: FieldWrapperProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}

export function ringClass(error?: string) {
  return error ? 'ring-red-400 dark:ring-red-500/70' : 'ring-slate-300 dark:ring-slate-700';
}

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  ref?: Ref<HTMLInputElement>;
}

export function TextField({ label, error, id: idProp, ...props }: TextFieldProps) {
  const generatedId = useId();
  const id = idProp ?? generatedId;
  return (
    <FieldWrapper id={id} label={label} error={error}>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`${FIELD_CLASSES} ${ringClass(error)}`}
        {...props}
      />
    </FieldWrapper>
  );
}

interface TextAreaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  ref?: Ref<HTMLTextAreaElement>;
}

export function TextAreaField({
  label,
  error,
  id: idProp,
  rows = 3,
  ...props
}: TextAreaFieldProps) {
  const generatedId = useId();
  const id = idProp ?? generatedId;
  return (
    <FieldWrapper id={id} label={label} error={error}>
      <textarea
        id={id}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`${FIELD_CLASSES} ${ringClass(error)} resize-y`}
        {...props}
      />
    </FieldWrapper>
  );
}

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  options: readonly { value: string; label: string }[];
  ref?: Ref<HTMLSelectElement>;
}

export function SelectField({ label, error, options, id: idProp, ...props }: SelectFieldProps) {
  const generatedId = useId();
  const id = idProp ?? generatedId;
  return (
    <FieldWrapper id={id} label={label} error={error}>
      <select id={id} className={`${FIELD_CLASSES} ${ringClass(error)}`} {...props}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FieldWrapper>
  );
}
