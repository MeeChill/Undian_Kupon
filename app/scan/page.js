import Link from 'next/link';
import QRScanner from './QRScanner';

export default function ScanPage() {
  return (
    <div className="container">
      <h1 style={{ textAlign: 'center', marginBottom: '20px' }}>Scan QR Code</h1>
      <div className="card">
        <div style={{ padding: '20px' }}>
          <QRScanner />
        </div>
      </div>
      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <Link href="/participants" className="btn">Kembali ke Daftar Peserta</Link>
      </div>
    </div>
  );
}
