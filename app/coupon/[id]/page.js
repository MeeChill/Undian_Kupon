import prisma from '../../../lib/prisma';
import QRCode from 'qrcode';
import Link from 'next/link';
import { headers } from 'next/headers';
import PrintButton from './PrintButton';

export const dynamic = 'force-dynamic';

export default async function Coupon({ params }) {
  const id = parseInt(params.id);
  const participant = await prisma.participant.findUnique({ where: { id } });

  if (!participant) return <div>Not Found</div>;

  const headersList = headers();
  const host = headersList.get('host') || 'localhost:3000';
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  
  const scanUrl = `${protocol}://${host}/scan/${participant.luckyNumber}`;
  const qrCodeData = await QRCode.toDataURL(scanUrl);

  return (
    <div className="container" style={{ textAlign: 'center' }}>
        <div className="coupon-card">
            <h2>KUPON JALAN SANTAI</h2>
            <h3>RW 04</h3>
            <hr />
            <p><strong>Nama:</strong> {participant.name}</p>
            <p><strong>RT:</strong> {participant.rt}</p>
            <p><strong>Nomor Undian:</strong></p>
            <h1 style={{ margin: '5px 0', letterSpacing: '5px' }}>{participant.luckyNumber}</h1>
            
            <div style={{ margin: '20px 0' }}>
                <img src={qrCodeData} alt="QR Code" style={{ width: '150px', height: '150px' }} />
            </div>
            
            <p style={{ fontSize: '0.8em', color: '#666' }}>Tunjukkan QR Code ini di garis finish.</p>
        </div>
        
        <br />
        <PrintButton />
        <Link href="/participants" className="btn btn-danger">Kembali</Link>
    </div>
  );
}
