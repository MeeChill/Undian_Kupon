import prisma from '../lib/prisma';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const total = await prisma.participant.count();
  const present = await prisma.participant.count({ where: { status: 'present' } });
  const winners = await prisma.participant.count({ where: { isWinner: true } });
  
  // Count per RT
  const rtCounts = await prisma.participant.groupBy({
    by: ['rt'],
    _count: {
      _all: true
    },
    orderBy: {
      rt: 'asc'
    }
  });

  // Map to simple object for easy access
  const rtData = {};
  rtCounts.forEach(item => {
      rtData[item.rt] = item._count._all;
  });

  return (
    <div className="container">
        <div className="card">
            <h2>Statistik</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '1rem', color: '#64748b', marginBottom: '5px' }}>Total Peserta</h3>
                    <strong style={{ fontSize: '1.5rem', color: '#1e293b' }}>{total}</strong>
                </div>
                <div style={{ background: '#f0fdf4', padding: '15px', borderRadius: '10px', border: '1px solid #bbf7d0' }}>
                    <h3 style={{ fontSize: '1rem', color: '#166534', marginBottom: '5px' }}>Peserta Hadir</h3>
                    <strong style={{ fontSize: '1.5rem', color: '#15803d' }}>{present}</strong>
                </div>
                <div style={{ background: '#fffbeb', padding: '15px', borderRadius: '10px', border: '1px solid #fde68a' }}>
                    <h3 style={{ fontSize: '1rem', color: '#92400e', marginBottom: '5px' }}>Pemenang</h3>
                    <strong style={{ fontSize: '1.5rem', color: '#b45309' }}>{winners}</strong>
                </div>
            </div>

            <h3 style={{ marginTop: '20px', fontSize: '1.1rem', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>Detail per RT</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginTop: '10px' }}>
                {[1, 2, 3, 4].map(rt => (
                    <div key={rt} style={{ textAlign: 'center', padding: '10px', background: '#f1f5f9', borderRadius: '8px' }}>
                        <span style={{ display: 'block', fontSize: '0.9rem', color: '#64748b' }}>RT 0{rt}</span>
                        <strong style={{ fontSize: '1.2rem' }}>{rtData[rt] || 0}</strong>
                    </div>
                ))}
            </div>
        </div>

        <div className="card">
            <h2>Menu Cepat</h2>
            <Link href="/participants" className="btn">Tambah Peserta Baru</Link>
            <Link href="/scan" className="btn" style={{ marginLeft: '10px', backgroundColor: '#6c5ce7' }}>Scan QR Code</Link>
            <Link href="/draw" className="btn btn-success" style={{ marginLeft: '10px' }}>Mulai Undian</Link>
        </div>
    </div>
  );
}
