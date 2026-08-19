import './globals.css';
import SiteHeader from '../components/SiteHeader';
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
        {session && <SiteHeader session={session} />}
        <main className="container">
            {children}
        </main>
      </body>
    </html>
  );
}
