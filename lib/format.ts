export function num(v: unknown): number {
    const n = parseFloat(String(v ?? ''));
    return Number.isFinite(n) ? n : 0;
}

export function money(v: unknown, symbol = 'Br'): string {
    return `${symbol} ${num(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const pad = (x: number) => String(x).padStart(2, '0');

export function dateTime(v: unknown): string {
    if (!v) return '-';
    const d = new Date(v as string);
    if (Number.isNaN(d.getTime())) return String(v);
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function dateOnly(v: unknown): string {
    if (!v) return '-';
    const d = new Date(v as string);
    if (Number.isNaN(d.getTime())) return String(v);
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