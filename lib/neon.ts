import { NeonDB } from '@neondatabase/serverless';

export const sql = NeonDB(process.env.DATABASE_URL!);