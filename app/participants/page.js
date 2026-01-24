import prisma from '../../lib/prisma';
import ParticipantsClient from './ParticipantsClient';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

async function addParticipant(formData) {
  'use server';
  const rt = parseInt(formData.get('rt'));
  let quantity = parseInt(formData.get('quantity') || '1');
  
  // Limit max batch size
  if (quantity > 1000) quantity = 1000;
  
  // Check total limit
  const currentTotal = await prisma.participant.count();
  if (currentTotal + quantity > 5000) {
      // If adding this batch exceeds 5000, do not add or add only up to 5000
      // For simplicity, we just stop if it exceeds
      return; 
  }

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
  revalidatePath('/'); // Update dashboard stats
}

async function deleteParticipant(formData) {
  'use server';
  const id = parseInt(formData.get('id'));
  await prisma.participant.delete({ where: { id } });
  revalidatePath('/participants');
  revalidatePath('/');
}

async function resetAllParticipants(formData) {
  'use server';
  const rtFilter = formData.get('rt');
  
  const whereClause = {};
  if (rtFilter && rtFilter !== 'all') {
      whereClause.rt = parseInt(rtFilter);
  }

  await prisma.participant.deleteMany({
      where: whereClause
  });
  
  revalidatePath('/participants');
  revalidatePath('/');
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
                    <label>Jumlah Peserta (Max 1000):</label><br/>
                    <input type="number" name="quantity" required min="1" max="1000" defaultValue="1" style={{ width: '100%', padding: '8px' }} />
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
