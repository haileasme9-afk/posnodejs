const links = [
    { href: '/', label: 'Dashboard' },
    { href: '/api/products', label: 'Products' },
    { href: '/api/orders', label: 'Orders' },
    { href: '/api/stock', label: 'Stock' },
];

export function Sidebar() {
    return (
        <nav className="w-56 shrink-0 border-r bg-white p-4 dark:bg-zinc-900">
            <ul className="space-y-2">
                {links.map((link) => (
                    <li key={link.href}>
                        <a href={link.href} className="block rounded px-3 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                            {link.label}
                        </a>
                    </li>
                ))}
            </ul>
        </nav>
    );
}