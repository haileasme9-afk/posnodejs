import { sql } from '@/lib/neon';

export function num(v: unknown): number {
    const n = parseFloat(String(v ?? ''));
    return Number.isFinite(n) ? n : 0;
}

export function formatMoney(v: unknown, symbol = 'Br'): string {
    const n = num(v);
    return `${symbol} ${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDate(v: unknown): string {
    if (!v) return '-';
    const d = new Date(v as string);
    if (Number.isNaN(d.getTime())) return String(v);
    const pad = (x: number) => String(x).padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function formatDateShort(v: unknown): string {
    if (!v) return '-';
    const d = new Date(v as string);
    if (Number.isNaN(d.getTime())) return String(v);
    const pad = (x: number) => String(x).padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function threeDigits(n: number): string {
    const parts: string[] = [];
    if (n >= 100) {
        parts.push(ONES[Math.floor(n / 100)], 'Hundred');
        n %= 100;
    }
    if (n >= 20) {
        parts.push(TENS[Math.floor(n / 10)]);
        n %= 10;
    }
    if (n > 0) parts.push(ONES[n]);
    return parts.join(' ');
}

export function numberToWords(v: number): string {
    if (!Number.isFinite(v) || v < 0) return '';
    const scales = ['', 'Thousand', 'Million', 'Billion'];
    const parts: string[] = [];
    let scale = 0;
    while (v > 0) {
        const chunk = Math.floor(v % 1000);
        if (chunk > 0) {
            parts.unshift(...[threeDigits(chunk), scales[scale]].filter(Boolean));
        }
        v = Math.floor(v / 1000);
        scale += 1;
    }
    return parts.join(' ') || 'Zero';
}

export function amountToWords(v: unknown): string {
    const amount = num(v);
    const birr = Math.floor(amount);
    const cents = Math.round((amount - birr) * 100);
    let out = `${numberToWords(birr)} Birr`;
    if (cents > 0) out += ` and ${numberToWords(cents)} Cents`;
    return `${out} Only`;
}

export async function getSettings(): Promise<Record<string, string>> {
    const rows = await sql`SELECT setting_key, setting_value FROM settings`;
    const settings: Record<string, string> = {};
    for (const r of rows) settings[r.setting_key] = String(r.setting_value ?? '');
    return settings;
}

export async function getInvoicePrefix(): Promise<string> {
    const rows = await sql`SELECT setting_value FROM settings WHERE setting_key = 'invoice_prefix'`;
    return rows[0]?.setting_value || 'CA';
}

export async function getNextInvoiceNumber(): Promise<string> {
    const rows = await sql`
        UPDATE settings SET setting_value = (COALESCE(setting_value::int, 0) + 1)::text
        WHERE setting_key = 'invoice_number_next'
        RETURNING setting_value
    `;
    const seq = Number(rows[0]?.setting_value ?? 1);
    const prefix = await getInvoicePrefix();
    return `${prefix}-${String(seq).padStart(8, '0')}`;
}

export async function getNextFsNumber(): Promise<string> {
    const rows = await sql`
        UPDATE settings SET setting_value = (COALESCE(setting_value::int, 0) + 1)::text
        WHERE setting_key = 'fs_number_next'
        RETURNING setting_value
    `;
    const seq = Number(rows[0]?.setting_value ?? 1);
    return String(seq).padStart(8, '0');
}

export async function generateOrderNumber(): Promise<string> {
    const d = new Date();
    const pad = (x: number) => String(x).padStart(2, '0');
    const dateStr = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
    const rows = await sql`
        SELECT count(*)::int AS n FROM orders WHERE order_number LIKE ${'ORD' + dateStr + '%'}
    `;
    return `ORD${dateStr}${String((rows[0]?.n ?? 0) + 1).padStart(4, '0')}`;
}

export async function generateBarcode(): Promise<string> {
    let barcode = '';
    let found = false;
    while (!found) {
        barcode = String(Math.floor(10000000 + Math.random() * 89999999));
        const rows = await sql`SELECT id FROM products WHERE barcode = ${barcode}`;
        found = rows.length === 0;
    }
    return barcode;
}

export function slugify(s: string): string {
    return s
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
}

export function toPgRule(key: string): string {
    return (
        key
            .toUpperCase()
            .replace(/[^A-Z0-9_]/g, '_')
            .replace(/^_+|_+$/g, '') || 'KEY'
    );
}