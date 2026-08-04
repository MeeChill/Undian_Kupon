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
                        <div className="brand-logos">
                            <img src="/Logo_KarangTaruna-removebg-preview.png" alt="Logo Karang Taruna" className="brand-logo" />
                            <img src="/Logo_RW-removebg-preview.png" alt="Logo RW" className="brand-logo" />
                        </div>
                        <span className="brand-text">Jalan Santai RW 04</span>
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
