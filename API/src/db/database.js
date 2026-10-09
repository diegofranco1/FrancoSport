import { neon } from '@neondatabase/serverless';
import { config } from '../config/env.js';

export const sql = neon(config.databaseUrl);
