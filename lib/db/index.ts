import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema';

const connectionString =
  process.env.DATABASE_URL ?? 'postgres://alexl@localhost:5433/qubators';

const client = postgres(connectionString);
export const db = drizzle(client, { schema });
