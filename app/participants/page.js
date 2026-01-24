import prisma from '../../lib/prisma';
import ParticipantsClient from './ParticipantsClient';

export const dynamic = 'force-dynamic';

async function addParticipant(formData) {
  'use server';
  const rt = parseInt(formData.get('rt'));
  const quantity = parseInt(formData.get('quantity') || '1');
  const rw = 4;
  const rtStr = rt.toString().padStart(2, '0');
  const rwStr = rw.toString().padStart(2, '0');

  // Find the last participant for this RT to determine the next sequence
  const lastParticipant = await prisma.participant.findFirst({
    where: { rt },
    orderBy: { luckyNumber: 'desc' }
  });

  let lastSequence = 0;
  if (lastParticipant) {
    // luckyNumber format: RRWRWWSSSS (RT:2, RW:2, Seq:4)
    // Extract the last 4 digits
    const lastSeqStr = lastParticipant.luckyNumber.slice(-4);
    lastSequence = parseInt(lastSeqStr);
  }

  const newParticipants = [];
  for (let i = 1; i <= quantity; i++) {
    const sequence = (lastSequence + i).toString().padStart(4, '0');
    const luckyNumber = `${rtStr}${rwStr}${sequence}`;
    
    newParticipants.push({
      name: `Warga RT ${rt}`,
      rt,
      rw,
      luckyNumber,
      status: 'registered',
      isWinner: false
    });
  }

  await prisma.participant.createMany({
    data: newParticipants,
    skipDuplicates: true,
  });

  revalidatePath('/participants');
}

async function deleteParticipant(formData) {
  'use server';
  const id = parseInt(formData.get('id'));
  await prisma.participant.delete({ where: { id } });
  revalidatePath('/participants');
}

async function resetAllParticipants() {
  'use server';
  // Delete all participants
  await prisma.participant.deleteMany({});
  revalidatePath('/participants');
}

export default async function Participants() {
  const participants = await prisma.participant.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="container">
      <div className="card">
        <h2>Tambah Peserta (Massal)</h2>
        <form action={addParticipant}>
            <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                    <label>RT (1-4):</label><br/>
                    <input type="number" name="rt" required min="1" max="4" defaultValue="1" style={{ width: '100%', padding: '8px' }} />
                </div>
                <div style={{ flex: 1 }}>
                    <label>Jumlah Peserta:</label><br/>
                    <input type="number" name="quantity" required min="1" defaultValue="1" style={{ width: '100%', padding: '8px' }} />
                </div>
            </div>
            <div style={{ marginTop: '10px' }}>
                <button type="submit" className="btn">Generate Kupon</button>
            </div>
        </form>
      </div>

      <ParticipantsClient 
          initialParticipants={participants} 
          resetAction={resetAllParticipants}
          deleteAction={deleteParticipant}
      />
    </div>
  );
}
