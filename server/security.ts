import crypto from 'crypto';
import { Request } from 'express';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory rate limiting store
const rateLimitMap = new Map<string, RateLimitEntry>();

// In-memory OTP store
interface OtpEntry {
  code: string;
  account: string;
  expiresAt: number;
  attempts: number;
}

const otpStore = new Map<string, OtpEntry>();

// Automatic garbage collection of expired entries every 3 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap.entries()) {
    if (now > entry.resetAt) {
      rateLimitMap.delete(key);
    }
  }
  for (const [key, entry] of otpStore.entries()) {
    if (now > entry.expiresAt) {
      otpStore.delete(key);
    }
  }
}, 3 * 60 * 1000);

/**
 * Extracts real client IP safely, accounting for reverse proxies (Vercel, Cloud Run, Cloudflare)
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  if (Array.isArray(forwarded) && forwarded.length > 0) {
    return forwarded[0].trim();
  }
  return req.ip || (req.socket && req.socket.remoteAddress) || '127.0.0.1';
}

/**
 * Rate limit check
 */
export function checkRateLimit(
  key: string,
  maxAttempts: number,
  windowMs: number
): { allowed: boolean; remaining: number; retryAfterSec?: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxAttempts - 1 };
  }

  if (entry.count >= maxAttempts) {
    const retryAfterSec = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
    return { allowed: false, remaining: 0, retryAfterSec };
  }

  entry.count += 1;
  return { allowed: true, remaining: maxAttempts - entry.count };
}

/**
 * Reset rate limit counter on successful action
 */
export function resetRateLimit(key: string): void {
  rateLimitMap.delete(key);
}

/**
 * Generates a cryptographically secure 6-digit OTP
 */
export function createPasswordResetOtp(accountIdentifier: string): { code: string; expiresMinutes: number } {
  // 6-digit numeric OTP
  const code = crypto.randomInt(100000, 999999).toString();
  const expiresMinutes = 10;
  const expiresAt = Date.now() + expiresMinutes * 60 * 1000;

  const normalized = accountIdentifier.toLowerCase().trim();
  otpStore.set(normalized, {
    code,
    account: normalized,
    expiresAt,
    attempts: 0,
  });

  return { code, expiresMinutes };
}

/**
 * Verifies the password reset OTP or Master Recovery Key
 */
export function verifyPasswordResetOtp(
  accountIdentifier: string,
  inputCode: string,
  masterRecoveryKey?: string
): { success: boolean; error?: string } {
  const normalized = accountIdentifier.toLowerCase().trim();
  const codeClean = String(inputCode || '').trim();

  if (!codeClean) {
    return { success: false, error: 'Verification code or Master Recovery Key is required.' };
  }

  // 1. Check if user provided the Master Recovery Key
  if (masterRecoveryKey && codeClean.toUpperCase() === masterRecoveryKey.toUpperCase().trim()) {
    otpStore.delete(normalized);
    return { success: true };
  }

  // 2. Check active 6-digit OTP in cache
  const entry = otpStore.get(normalized);
  if (!entry) {
    return {
      success: false,
      error: 'No active verification code found or the code has expired. Please request a new code.',
    };
  }

  const now = Date.now();
  if (now > entry.expiresAt) {
    otpStore.delete(normalized);
    return { success: false, error: 'Verification code has expired (10 minute limit). Please request a new code.' };
  }

  if (entry.attempts >= 4) {
    otpStore.delete(normalized);
    return {
      success: false,
      error: 'Too many incorrect verification attempts. This code has been revoked for security. Please request a new code.',
    };
  }

  if (entry.code !== codeClean) {
    entry.attempts += 1;
    const remaining = 4 - entry.attempts;
    return {
      success: false,
      error: `Invalid verification code. ${remaining > 0 ? `${remaining} attempts remaining.` : 'Code revoked.'}`,
    };
  }

  // Successfully verified! Revoke immediately to prevent replay attacks
  otpStore.delete(normalized);
  return { success: true };
}

/**
 * Masks an email for safe display (e.g. "ed***@chronicle-daily.org")
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return 'your registered email';
  const [local, domain] = email.split('@');
  if (local.length <= 2) {
    return `${local[0]}***@${domain}`;
  }
  return `${local.slice(0, 2)}***${local.slice(-1)}@${domain}`;
}

/**
 * Masks a phone number for safe display (e.g. "+88017*****00")
 */
export function maskPhone(phone: string): string {
  if (!phone || phone.length < 6) return 'your registered mobile number';
  const clean = phone.trim();
  return `${clean.slice(0, 5)}*****${clean.slice(-2)}`;
}
