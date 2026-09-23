export function MobileMenu() {
    return (
        <div className="fixed inset-x-0 bottom-0 flex gap-4 bg-white p-4 dark:bg-zinc-900 md:hidden">
            <a href="/" className="flex-1 rounded bg-zinc-900 py-2 text-center text-white dark:bg-zinc-100 dark:text-zinc-900">
                Home
            </a>
            <a href="/api/products" className="flex-1 rounded border py-2 text-center">
                Products
            </a>
        </div>
    );
}