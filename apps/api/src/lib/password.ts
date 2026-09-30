import argon2 from 'argon2';

// Paramètres recommandés par l'OWASP pour argon2id.
const HASH_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
} as const;

export function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, HASH_OPTIONS);
}

export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, password);
  } catch {
    return false;
  }
}

let dummyHash: Promise<string> | undefined;

/**
 * Effectue une vérification factice quand l'utilisateur n'existe pas, pour que le temps
 * de réponse du login ne révèle pas si un email est inscrit.
 */
export async function simulatePasswordVerification(password: string): Promise<void> {
  dummyHash ??= hashPassword('dummy-password-for-timing-safety');
  await verifyPassword(await dummyHash, password);
}
