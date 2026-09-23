export function Footer() {
    return (
        <footer className="border-t bg-white px-6 py-4 text-center text-sm text-zinc-500 dark:bg-zinc-900">
            &copy; {new Date().getFullYear()} POS System
        </footer>
    );
}