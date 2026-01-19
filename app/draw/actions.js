'use server';
import prisma from '../../lib/prisma';

export async function drawWinner() {
    const candidates = await prisma.participant.findMany({
        where: {
            status: 'present',
            isWinner: false
        }
    });

    if (candidates.length === 0) {
        return { success: false, message: 'Tidak ada peserta yang hadir atau semua sudah menang.' };
    }

    const randomIndex = Math.floor(Math.random() * candidates.length);
    const winner = candidates[randomIndex];

    await prisma.participant.update({
        where: { id: winner.id },
        data: { isWinner: true }
    });

    return { success: true, winner };
}
