import prisma from '../../lib/prisma';
import Link from 'next/link';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

async function addParticipant(formData) {
  'use server';
  const name = formData.get('name');
  const rt = parseInt(formData.get('rt'));
  const rw = 4;

  const count = await prisma.participant.count({ where: { rt } });
  const sequence = (count + 1).toString().padStart(4, '0');
  const rtStr = rt.toString().padStart(2, '0');
  const rwStr = rw.toString().padStart(2, '0');
  const luckyNumber = `${rtStr}${rwStr}${sequence}`;

  await prisma.participant.create({
    data: {
        name,
        rt,
        rw,
        luckyNumber
    }
  });

  revalidatePath('/participants');
}

async function deleteParticipant(formData) {
  'use server';
  const id = parseInt(formData.get('id'));
  await prisma.participant.delete({ where: { id } });
  revalidatePath('/participants');
}

export default async function Participants() {
  const participants = await prisma.participant.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="container">
        <div className="card">
            <h2>Tambah Peserta</h2>
            <form action={addParticipant}>
                <div style={{ marginBottom: '10px' }}>
                    <label>Nama Peserta:</label><br/>
                    <input type="text" name="name" required style={{ width: '100%', padding: '8px' }} />
                </div>
                <div style={{ marginBottom: '10px' }}>
                    <label>RT (1-10):</label><br/>
                    <input type="number" name="rt" required min="1" max="10" style={{ width: '100%', padding: '8px' }} />
                </div>
                <button type="submit" className="btn">Simpan</button>
            </form>
        </div>

        <div className="card">
            <h2>Daftar Peserta</h2>
            <table>
                <thead>
                    <tr>
                        <th>Nama</th>
                        <th>RT</th>
                        <th>Nomor Undian</th>
                        <th>Status</th>
                        <th>Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    {participants.map(p => (
                    <tr key={p.id}>
                        <td>{p.name}</td>
                        <td>{p.rt}</td>
                        <td>{p.luckyNumber}</td>
                        <td>
                            {p.status === 'present' ? (
                                <span style={{ color: 'green', fontWeight: 'bold' }}>Hadir</span>
                            ) : (
                                <span style={{ color: 'grey' }}>Terdaftar</span>
                            )}
                            {p.isWinner && <span style={{ color: 'gold' }}> 🏆</span>}
                        </td>
                        <td>
                            <Link href={`/coupon/${p.id}`} className="btn" style={{ padding: '5px 10px', fontSize: '0.8em', marginRight: '5px' }}>Kupon</Link>
                            <form action={deleteParticipant} style={{ display: 'inline' }}>
                                <input type="hidden" name="id" value={p.id} />
                                <button type="submit" className="btn btn-danger" style={{ padding: '5px 10px', fontSize: '0.8em' }}>Hapus</button>
                            </form>
                        </td>
                    </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
  );
}
