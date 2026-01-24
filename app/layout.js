import './globals.css';
import Link from 'next/link';
import LogoutButton from '../components/LogoutButton';
import { getSession } from '../lib/session';

export const metadata = {
  title: 'Jalan Santai RW 04',
  description: 'Aplikasi Undian Jalan Santai Modern',
};

export default async function RootLayout({ children }) {
  const session = await getSession();

  return (
    <html lang="id">
      <body>
        {session && (
            <header>
                <div className="navbar">
                    <Link href="/" className="brand">
                        🎉 Jalan Santai RW 04
                    </Link>
                    <nav>
                        <Link href="/">Dashboard</Link>
                        {session.role === 'admin' && (
                            <>
                                <Link href="/participants">Peserta</Link>
                                <Link href="/draw">Undian</Link>
                            </>
                        )}
                        <Link href="/scan">Scan QR</Link>
                        <LogoutButton />
                    </nav>
                </div>
            </header>
        )}
        <main className="container">
            {children}
        </main>
      </body>
    </html>
  );
}
