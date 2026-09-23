export function Footer() {
    return (
        <footer className="no-print border-t border-border bg-surface px-4 py-4 text-xs text-muted sm:px-6">
            <div className="flex flex-col items-center justify-between gap-1 sm:flex-row">
                <p>&copy; {new Date().getFullYear()} POS System</p>
                <p>Main Store · 123 Main Street · 0123456789</p>
            </div>
        </footer>
    );
}
