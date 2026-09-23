import { neon } from '@neondatabase/serverless';

const query = neon(process.env.DATABASE_URL!);

export async function sql(strings: TemplateStringsArray | string, ...params: unknown[]) {
    if (typeof strings === 'string') {
        return query.query(strings, params);
    }
    return query(strings, ...params);
}