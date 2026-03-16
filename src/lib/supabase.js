import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file for VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'Content-Type': 'application/json',
    }
  },
  // Real-time subscriptions
  realtime: {
    params: {
      eventsPerSecond: 10,
    }
  }
});

/**
 * Error handler for Supabase operations
 */
export const handleSupabaseError = (error, context = '') => {
  if (!error) return null;

  const errorMessage = error?.message || 'Unknown error';
  const status = error?.status || 500;

  console.error(`[Supabase Error in ${context}]`, {
    message: errorMessage,
    status,
    code: error?.code,
    details: error?.details
  });

  // Return user-friendly error message
  if (status === 401) {
    return { message: 'Authentication failed. Please log in again.' };
  } else if (status === 403) {
    return { message: 'You do not have permission to perform this action.' };
  } else if (status === 404) {
    return { message: 'The requested resource was not found.' };
  } else if (status >= 500) {
    return { message: 'Server error. Please try again later.' };
  }

  return { message: errorMessage };
};

/**
 * Retry wrapper for failed queries
 */
export const withRetry = async (queryFn, maxRetries = 3, delayMs = 1000) => {
  let lastError;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await queryFn();
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries - 1) {
        const delay = delayMs * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
};

