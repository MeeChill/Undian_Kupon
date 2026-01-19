import './globals.css';
import Link from 'next/link';

export const metadata = {
  title: 'Jalan Santai RW 04',
  description: 'Aplikasi Undian Jalan Santai',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>
        <header>
            <h1>Jalan Santai RW 04</h1>
            <nav>
                <Link href="/">Dashboard</Link>
                <Link href="/participants">Peserta & Kupon</Link>
                <Link href="/draw">Undian Hadiah</Link>
            </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
