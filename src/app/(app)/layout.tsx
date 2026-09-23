import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getAllowed } from '@/lib/page-guard';
import { Header } from '@/components/header';
import { Sidebar } from '@/components/sidebar';
import { Footer } from '@/components/footer';
import { MobileMenu } from '@/components/mobile-menu';

export const dynamic = 'force-dynamic';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect('/login');
  const allowed = await getAllowed();
  const siteName = (process.env.NEXT_PUBLIC_SITE_NAME as string) || 'POS System';

  return (
    <>
      <Header user={{ username: session.username, full_name: session.full_name, role: session.role }} siteName={siteName} />
      <div className="flex min-h-[calc(100vh-3.5rem)]">
        <Sidebar allowed={allowed} />
        <main className="flex-1 px-4 pb-24 pt-6 sm:px-6 md:pb-6">{children}</main>
      </div>
      <Footer />
      <MobileMenu allowed={allowed} />
    </>
  );
}