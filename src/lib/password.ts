import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

/** Minimum length for agent passwords. */
export const MIN_PASSWORD_LENGTH = 12;

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

// Compared against when the email is unknown, so a failed lookup takes as
// long as a real password check and cannot be used to enumerate accounts.
const DUMMY_HASH = bcrypt.hashSync('timing-equaliser-not-a-real-password', SALT_ROUNDS);

export function verifyPassword(plain: string, hash: string | null): Promise<boolean> {
  return bcrypt.compare(plain, hash ?? DUMMY_HASH);
}
