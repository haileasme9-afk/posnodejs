import './globals.css';
import { Header } from '@/components/header';
import { Sidebar } from '@/components/sidebar';
import { Footer } from '@/components/footer';
import { MobileMenu } from '@/components/mobile-menu';

export const metadata = {
  title: 'POS System',
  description: 'Point of Sale System',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body class="min-h-screen bg-background text-foreground">
        <Header />
        <div class="flex flex-col min-h-screen">
          <Sidebar />
          <main class="flex-1 p-6 overflow-auto">
            {children}
          </main>
        </div>
        <Footer />
        <MobileMenu />
      </body>
    </html>
  );
}