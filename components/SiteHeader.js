'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import LogoutButton from './LogoutButton';

export default function SiteHeader({ session }) {
  const pathname = usePathname();
  const isDrawPage = pathname === '/draw' || pathname.startsWith('/draw/');

  return (
    <header>
      <div className="navbar">
        <Link href="/" className="brand">
          <div className="brand-logos">
            <img src="/Logo_KarangTaruna-removebg-preview.png" alt="Logo Karang Taruna" className="brand-logo" />
            <img src="/Logo_RW-removebg-preview.png" alt="Logo RW" className="brand-logo" />
          </div>
          <span className="brand-text">Jalan Santai RW 04</span>
        </Link>

        {!isDrawPage && (
          <nav>
            <Link href="/">Dashboard</Link>
            {session.role === 'admin' && (
              <>
                <Link href="/participants">Peserta</Link>
                <Link href="/draw" target="_blank" rel="noopener noreferrer">
                  Undian
                </Link>
              </>
            )}
            <Link href="/scan">Scan QR</Link>
            <LogoutButton />
          </nav>
        )}
      </div>
    </header>
  );
}
