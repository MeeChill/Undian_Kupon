import prisma from '../lib/prisma';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const total = await prisma.participant.count();
  const present = await prisma.participant.count({ where: { status: 'present' } });
  const winners = await prisma.participant.count({ where: { isWinner: true } });

  return (
    <div className="container">
        <div className="card">
            <h2>Statistik</h2>
            <p>Total Peserta Terdaftar: <strong>{total}</strong></p>
            <p>Peserta Hadir (Finish): <strong>{present}</strong></p>
            <p>Pemenang Undian: <strong>{winners}</strong></p>
        </div>

        <div className="card">
            <h2>Menu Cepat</h2>
            <Link href="/participants" className="btn">Tambah Peserta Baru</Link>
            <Link href="/draw" className="btn btn-success" style={{ marginLeft: '10px' }}>Mulai Undian</Link>
        </div>
    </div>
  );
}
