import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from './db';

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'pg' }),
  emailAndPassword: { enabled: true, minPasswordLength: 8 },
  session: { expiresIn: 60 * 60 * 24 * 7 },
  rateLimit: {
    enabled: true,
    window: 60,
    max: 100,
    customRules: {
      '/sign-in/email': { window: 300, max: 20 },
      '/sign-up/email': { window: 3600, max: 20 }
    }
  }
});
