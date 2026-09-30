import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema } from '@taskapp/shared';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate } from 'react-router';
import { ErrorAlert } from '../../components/Alert';
import { Button } from '../../components/Button';
import { TextField } from '../../components/FormField';
import { applyServerErrors } from '../../lib/form-errors';
import { AuthCard } from './AuthCard';
import { useLogin } from './hooks';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useLogin();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({ resolver: zodResolver(loginSchema), defaultValues: { email: '', password: '' } });

  const onSubmit = handleSubmit((values) => {
    setFormError(null);
    login.mutate(values, {
      onSuccess: () => {
        const from = (location.state as { from?: string } | null)?.from;
        void navigate(from ?? '/tasks', { replace: true });
      },
      onError: (error) => setFormError(applyServerErrors(error, setError, ['email', 'password'])),
    });
  });

  return (
    <AuthCard
      title="Connexion"
      footer={
        <>
          Pas encore de compte ?{' '}
          <Link to="/register" className="font-semibold text-indigo-600 hover:text-indigo-500">
            Créer un compte
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        {formError && <ErrorAlert>{formError}</ErrorAlert>}
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
          autoComplete="current-password"
          error={errors.password?.message}
          {...register('password')}
        />
        <Button type="submit" loading={login.isPending} className="w-full">
          Se connecter
        </Button>
      </form>
    </AuthCard>
  );
}
