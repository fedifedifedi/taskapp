import type { ApiErrorBody, ErrorCode, ValidationIssue } from '@taskapp/shared';
import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { isProduction } from '../config/env.js';
import { logger } from '../config/logger.js';
import { Prisma } from '../generated/prisma/client.js';
import { AppError, NotFoundError } from '../lib/errors.js';

function sendError(
  res: Response,
  statusCode: number,
  code: ErrorCode,
  message: string,
  details?: ValidationIssue[],
): void {
  const body: ApiErrorBody = { error: { code, message, ...(details && { details }) } };
  res.status(statusCode).json(body);
}

function hasType(err: unknown): err is { type: string; status?: number } {
  return (
    typeof err === 'object' && err !== null && typeof (err as { type?: unknown }).type === 'string'
  );
}

/** Routes /api inconnues. */
export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(new NotFoundError(`Route introuvable : ${req.method} ${req.path}`));
}

/**
 * Point unique de conversion des erreurs en réponses HTTP.
 * Aucune stack trace ni détail interne n'est renvoyé au client.
 */
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ZodError) {
    const details = err.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
    }));
    return sendError(res, 400, 'VALIDATION_ERROR', 'Données invalides', details);
  }

  if (err instanceof AppError) {
    return sendError(res, err.statusCode, err.code, err.message, err.details);
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') return sendError(res, 409, 'CONFLICT', 'Cette ressource existe déjà');
    if (err.code === 'P2025') return sendError(res, 404, 'NOT_FOUND', 'Ressource introuvable');
  }

  // Erreurs levées par express.json() (JSON mal formé, corps trop volumineux…).
  if (hasType(err)) {
    if (err.type === 'entity.parse.failed') {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Corps de requête JSON invalide');
    }
    if (err.type === 'entity.too.large') {
      return sendError(res, 413, 'VALIDATION_ERROR', 'Corps de requête trop volumineux');
    }
  }

  logger.error({ err, method: req.method, path: req.path }, 'Erreur non gérée');
  const message = isProduction
    ? 'Une erreur interne est survenue'
    : `Erreur interne : ${err instanceof Error ? err.message : String(err)}`;
  sendError(res, 500, 'INTERNAL_ERROR', message);
}
