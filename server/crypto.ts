import crypto from 'crypto';

// Master encryption secret derived from environment or fixed secure server seed
const MASTER_SECRET = process.env.ENCRYPTION_SECRET || process.env.JWT_SECRET || 'chronicle-master-secret-runtime-aes256-2026';
const SALT = 'chronicle-cloud-service-salt-v1';

// Derive deterministic 32-byte key for AES-256-GCM
const CIPHER_KEY = crypto.scryptSync(MASTER_SECRET, SALT, 32);

/**
 * Encrypts an object or string into AES-256-GCM format: iv:authTag:ciphertext
 */
export function encryptCredentials(plainData: any): string {
  try {
    const text = typeof plainData === 'string' ? plainData : JSON.stringify(plainData);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', CIPHER_KEY, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  } catch (err: any) {
    console.error('Encryption error:', err);
    throw new Error('Failed to encrypt sensitive cloud credentials');
  }
}

/**
 * Decrypts AES-256-GCM formatted string back into object or string
 */
export function decryptCredentials<T = any>(encryptedString: string): T | null {
  if (!encryptedString || typeof encryptedString !== 'string') return null;

  try {
    const parts = encryptedString.split(':');
    if (parts.length !== 3) {
      // Not encrypted format (e.g. legacy plain text)
      try {
        return JSON.parse(encryptedString);
      } catch {
        return encryptedString as any;
      }
    }

    const [ivHex, authTagHex, encryptedHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-gcm', CIPHER_KEY, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    try {
      return JSON.parse(decrypted);
    } catch {
      return decrypted as any;
    }
  } catch (err: any) {
    console.error('Decryption failed (credential key or data mismatch):', err.message);
    return null;
  }
}

/**
 * Helper to mask sensitive keys for browser display (e.g. "eyJhbG...••••••••")
 */
export function maskKey(val?: string, visibleChars = 6): string {
  if (!val) return '';
  if (val.length <= visibleChars) return '••••••••••••';
  const prefix = val.substring(0, Math.min(visibleChars, 8));
  return `${prefix}••••••••••••••••`;
}
