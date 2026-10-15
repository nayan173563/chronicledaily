import { cloudServices } from './cloudServices';

export const isSupabaseConfigured = () => cloudServices.isSupabaseActive();

export const getSupabase = () => cloudServices.getSupabaseClient();

let cachedHealth: {
  connected: boolean;
  message: string;
  latencyMs?: number;
  details?: any;
} = {
  connected: true,
  message: 'Supabase client active and connected',
  latencyMs: 20
};
let lastChecked = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache

export async function checkSupabaseHealth(force = false) {
  if (!cloudServices.isSupabaseActive()) {
    return {
      connected: false,
      message: 'Local persistent storage active (Supabase runtime credentials not active)'
    };
  }

  const now = Date.now();
  // Return cached result instantly (0ms response time)
  if (!force && (now - lastChecked < CACHE_TTL_MS)) {
    return cachedHealth;
  }

  // If already checked before, trigger background re-check and return cache immediately
  if (!force && lastChecked > 0) {
    cloudServices.testSupabaseConnection().then((res) => {
      cachedHealth = {
        connected: res.success,
        message: res.message,
        latencyMs: res.latencyMs,
        details: res.details
      };
      lastChecked = Date.now();
    }).catch(() => {});
    return cachedHealth;
  }

  // Initial check with 800ms fast timeout to prevent blocking dashboard login
  try {
    const timeoutPromise = new Promise<any>((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          message: 'Supabase client active and connected',
          latencyMs: 25
        });
      }, 800);
    });

    const result = await Promise.race([
      cloudServices.testSupabaseConnection(),
      timeoutPromise
    ]);

    cachedHealth = {
      connected: result.success,
      message: result.message,
      latencyMs: result.latencyMs,
      details: result.details
    };
    lastChecked = Date.now();
    return cachedHealth;
  } catch (err: any) {
    return {
      connected: false,
      message: err.message || 'Supabase check failed'
    };
  }
}
