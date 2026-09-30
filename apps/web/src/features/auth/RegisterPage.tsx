import { zodResolver } from '@hookform/resolvers/zod';
import { PASSWORD_MIN_LENGTH, registerSchema } from '@taskapp/shared';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router';
import { ApiError } from '../../api/client';
import { ErrorAlert } from '../../components/Alert';
import { Button } from '../../components/Button';
import { TextField } from '../../components/FormField';
import { applyServerErrors } from '../../lib/form-errors';
import { AuthCard } from './AuthCard';
import { useRegister } from './hooks';

export function RegisterPage() {
  const navigate = useNavigate();
  const registerUser = useRegister();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '' },
  });

  const onSubmit = handleSubmit((values) => {
    setFormError(null);
    registerUser.mutate(values, {
      onSuccess: () => void navigate('/tasks', { replace: true }),
      onError: (error) => {
        if (error instanceof ApiError && error.code === 'CONFLICT') {
          setError('email', { type: 'server', message: error.message });
          return;
        }
        setFormError(applyServerErrors(error, setError, ['name', 'email', 'password']));
      },
    });
  });

  return (
    <AuthCard
      title="Créer un compte"
      subtitle="Quelques secondes suffisent pour commencer à vous organiser."
      footer={
        <>
          Déjà inscrit ?{' '}
          <Link
            to="/login"
            className="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            Se connecter
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        {formError && <ErrorAlert>{formError}</ErrorAlert>}
        <TextField
          label="Nom"
          autoComplete="name"
          error={errors.name?.message}
          {...register('name')}
        />
        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />
        <TextField
          label="Mot de passe"
          type="password"
          autoComplete="new-password"
          error={errors.password?.message}
          {...register('password')}
        />
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Au moins {PASSWORD_MIN_LENGTH} caractères, avec au moins une lettre et un chiffre.
        </p>
        <Button type="submit" loading={registerUser.isPending} className="w-full">
          Créer mon compte
        </Button>
      </form>
    </AuthCard>
  );
}
