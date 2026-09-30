import { z } from 'zod';

export const PASSWORD_MIN_LENGTH = 8;
// Borne haute : évite de faire hacher des chaînes énormes (déni de service sur argon2).
export const PASSWORD_MAX_LENGTH = 128;

export const emailSchema = z
  .string({ error: "L'email est requis" })
  .trim()
  .toLowerCase()
  .max(254, "L'email est trop long")
  .pipe(z.email("L'email est invalide"));

export const registerSchema = z
  .object({
    email: emailSchema,
    name: z
      .string({ error: 'Le nom est requis' })
      .trim()
      .min(1, 'Le nom est requis')
      .max(100, 'Le nom ne doit pas dépasser 100 caractères'),
    password: z
      .string({ error: 'Le mot de passe est requis' })
      .min(
        PASSWORD_MIN_LENGTH,
        `Le mot de passe doit contenir au moins ${PASSWORD_MIN_LENGTH} caractères`,
      )
      .max(
        PASSWORD_MAX_LENGTH,
        `Le mot de passe ne doit pas dépasser ${PASSWORD_MAX_LENGTH} caractères`,
      )
      .regex(/[A-Za-z]/, 'Le mot de passe doit contenir au moins une lettre')
      .regex(/\d/, 'Le mot de passe doit contenir au moins un chiffre'),
  })
  .strict();

export const loginSchema = z
  .object({
    email: emailSchema,
    password: z
      .string({ error: 'Le mot de passe est requis' })
      .min(1, 'Le mot de passe est requis')
      .max(PASSWORD_MAX_LENGTH, 'Identifiants invalides'),
  })
  .strict();

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
