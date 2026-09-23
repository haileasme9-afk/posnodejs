import { neon } from '@neondatabase/serverless';

export type Row = Record<string, unknown>;

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
): Promise<Row[]> {
    const q = getQuery();
    if (typeof strings === 'string') {
        return q.query(strings, params) as Promise<Row[]>;
    }
    return q(strings, ...params) as Promise<Row[]>;
}
