export interface AuthUser {
  id: string;
}

declare global {
  namespace Express {
    interface Request {
      /** Défini par le middleware requireAuth. */
      user?: AuthUser;
    }
  }
}
