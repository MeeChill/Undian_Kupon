import prisma from '../../../lib/prisma';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function Scan({ params }) {
  const luckyNumber = params.number;
  const participant = await prisma.participant.findUnique({ where: { luckyNumber } });

  let success = false;
  let message = '';

  if (!participant) {
    message = 'Kupon tidak valid!';
  } else {
    // Update status
    await prisma.participant.update({
        where: { id: participant.id },
        data: { status: 'present' }
    });
    success = true;
  }

  return (
    <div className="container scan-result">
        {success ? (
            <>
                <div style={{ color: 'green', fontSize: '5em' }}>✅</div>
                <h1>Peserta Terverifikasi!</h1>
                <h2>Status: HADIR</h2>
                
                <div className="card" style={{ display: 'inline-block', textAlign: 'left', minWidth: '300px' }}>
                    <p><strong>Nama:</strong> {participant.name}</p>
                    <p><strong>RT:</strong> {participant.rt}</p>
                    <p><strong>Nomor Undian:</strong></p>
                    <h1 style={{ textAlign: 'center' }}>{participant.luckyNumber}</h1>
                </div>
                
                <p>Silakan masukkan potongan kupon ke dalam kotak undian.</p>
            </>
        ) : (
            <>
                <div style={{ color: 'red', fontSize: '5em' }}>❌</div>
                <h1>Gagal!</h1>
                <h2>{message}</h2>
            </>
        )}
        
        <br />
        <Link href="/" className="btn">Ke Halaman Utama</Link>
    </div>
  );
}
