export interface NavItem {
    key: string;
    href: string;
    label: string;
}

export const NAV_ITEMS: NavItem[] = [
    { key: 'dashboard', href: '/dashboard', label: 'Dashboard' },
    { key: 'pos', href: '/pos', label: 'POS Terminal' },
    { key: 'products', href: '/products', label: 'Products' },
    { key: 'categories', href: '/categories', label: 'Categories' },
    { key: 'suppliers', href: '/suppliers', label: 'Suppliers' },
    { key: 'customers', href: '/customers', label: 'Customers' },
    { key: 'receiving', href: '/receiving', label: 'Receiving' },
    { key: 'transfers', href: '/transfers', label: 'Transfers' },
    { key: 'stock', href: '/stock', label: 'Stock' },
    { key: 'orders', href: '/orders', label: 'Orders' },
    { key: 'reports', href: '/reports', label: 'Reports' },
    { key: 'users', href: '/users', label: 'Users' },
    { key: 'settings', href: '/settings', label: 'Settings' },
];

export const ROLE_ALLOWED: Record<string, string[]> = {
    admin: NAV_ITEMS.map((i) => i.key),
    manager: NAV_ITEMS.filter((i) => i.key !== 'users').map((i) => i.key),
    cashier: ['dashboard', 'pos', 'products', 'orders', 'stock', 'customers'],
};