import { loginSchema, registerSchema } from '@taskapp/shared';
import type { Request, Response } from 'express';
import { clearAuthCookie, setAuthCookie } from '../../lib/auth-cookie.js';
import { UnauthorizedError } from '../../lib/errors.js';
import { signAccessToken } from '../../lib/jwt.js';
import { getAuthUser } from '../../middlewares/require-auth.js';
import type { AuthService } from './auth.service.js';

export function createAuthController(authService: AuthService) {
  return {
    async register(req: Request, res: Response) {
      const input = registerSchema.parse(req.body);
      const user = await authService.register(input);
      setAuthCookie(res, signAccessToken(user.id));
      res.status(201).json({ data: user });
    },

    async login(req: Request, res: Response) {
      const input = loginSchema.parse(req.body);
      const user = await authService.login(input);
      setAuthCookie(res, signAccessToken(user.id));
      res.status(200).json({ data: user });
    },

    logout(_req: Request, res: Response) {
      clearAuthCookie(res);
      res.status(204).end();
    },

    async me(req: Request, res: Response) {
      try {
        const user = await authService.getCurrentUser(getAuthUser(req).id);
        res.status(200).json({ data: user });
      } catch (err) {
        // Compte supprimé entre-temps : on invalide aussi le cookie côté client.
        if (err instanceof UnauthorizedError) clearAuthCookie(res);
        throw err;
      }
    },
  };
}

export type AuthController = ReturnType<typeof createAuthController>;
