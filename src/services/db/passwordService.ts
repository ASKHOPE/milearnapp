import bcrypt from 'bcrypt';

// ==============================================================================
// Bcrypt Cryptographic Salt-Hashing & Verification Service (PostgreSQL Users / Vault)
// ==============================================================================

const DEFAULT_SALT_ROUNDS = 10;
const BCRYPT_REGEX = /^\$2[aby]\$[0-9]{2}\$[./A-Za-z0-9]{53}$/;

export class PasswordService {
  /**
   * Hashes a plain-text password using bcrypt with salt rounds
   */
  public async hashPassword(password: string, saltRounds = DEFAULT_SALT_ROUNDS): Promise<string> {
    if (!password) {
      throw new Error('Password cannot be empty');
    }
    const salt = await bcrypt.genSalt(saltRounds);
    return bcrypt.hash(password, salt);
  }

  /**
   * Securely compares a plain-text candidate password against a stored bcrypt hash
   */
  public async verifyPassword(password: string, hash: string): Promise<boolean> {
    if (!password || !hash) {
      return false;
    }
    try {
      return await bcrypt.compare(password, hash);
    } catch {
      return false;
    }
  }

  /**
   * Checks whether a given string is a valid formatted bcrypt hash
   */
  public isBcryptHash(hashCandidate: string): boolean {
    if (!hashCandidate || typeof hashCandidate !== 'string') {
      return false;
    }
    return BCRYPT_REGEX.test(hashCandidate);
  }
}

export const passwordService = new PasswordService();
