import { readFileSync } from 'node:fs';
import { Client } from '@neondatabase/serverless';

const url = process.env.DATABASE_URL;
if (!url) {
    console.error('DATABASE_URL not set');
    process.exit(1);
}

const schema = readFileSync(new URL('../schema.sql', import.meta.url), 'utf8');

const client = new Client(url);
await client.connect();

try {
    const res = await client.query(schema);
    console.log('Schema applied. Command summary:');
    res.forEach((r) => console.log(`  ${r.command}`));
} catch (err) {
    console.error('Applying schema failed:', err.message);
    if (err.position) {
        console.error(`Error at character position ${err.position}`);
        console.error(schema.slice(Math.max(0, err.position - 120), err.position + 120));
    }
    process.exitCode = 1;
} finally {
    await client.end();
}