import { neon } from '@neondatabase/serverless';

let query: ReturnType<typeof neon> | undefined;

function getQuery() {
    if (!query) {
        const url = process.env.DATABASE_URL;
        if (!url) {
            throw new Error('DATABASE_URL environment variable is not set');
        }
        query = neon(url);
    }
    return query;
}

export async function sql(
    strings: TemplateStringsArray | string,
    ...params: unknown[]
): Promise<Record<string, any>[]> {
    const q = getQuery();
    if (typeof strings === 'string') {
        return q.query(strings, params) as Promise<Record<string, any>[]>;
    }
    return q(strings, ...params) as Promise<Record<string, any>[]>;
}