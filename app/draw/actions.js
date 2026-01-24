'use server';
import prisma from '../../lib/prisma';

export async function drawWinner(category, rtValue) {
    const whereClause = {
        status: 'present',
        isWinner: false
    };

    if (category === 'rt') {
        whereClause.rt = parseInt(rtValue);
    }
    // If category is 'rw', we just select from all present participants (RW level)

    const candidates = await prisma.participant.findMany({
        where: whereClause
    });

    if (candidates.length === 0) {
        return { success: false, message: 'Tidak ada peserta yang memenuhi kriteria.' };
    }

    const randomIndex = Math.floor(Math.random() * candidates.length);
    const winner = candidates[randomIndex];

    await prisma.participant.update({
        where: { id: winner.id },
        data: { isWinner: true }
    });

    return { success: true, winner };
}
