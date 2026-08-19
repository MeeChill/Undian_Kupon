import Link from 'next/link';
import QRScanner from './QRScanner';
import { getSession } from '../../lib/session';

export default async function ScanPage() {
  const session = await getSession();

  return (
    <div className="container">
      <h1 style={{ textAlign: 'center', marginBottom: '20px' }}>Scan QR Code</h1>
      <div className="card">
        <div style={{ padding: '20px' }}>
          <QRScanner session={session} />
        </div>
      </div>
      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <Link href="/participants" className="btn">Kembali ke Daftar Peserta</Link>
      </div>
    </div>
  );
}
