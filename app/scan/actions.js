'use server'
import prisma from '../../lib/prisma';

export async function verifyCoupon(qrCodeText) {
  let luckyNumber = qrCodeText;
  
  // Try to extract number from URL if it's a URL
  try {
      if (qrCodeText.startsWith('http')) {
        const url = new URL(qrCodeText);
        const parts = url.pathname.split('/');
        // Assuming path is like /scan/[number]
        // parts will be ['', 'scan', 'NUMBER']
        if (parts.length > 0) {
            luckyNumber = parts[parts.length - 1];
        }
      }
  } catch (e) {
      // Not a valid URL, use original text
  }

  const participant = await prisma.participant.findUnique({ where: { luckyNumber } });

  if (!participant) {
      return { success: false, message: 'Kupon tidak valid / Tidak ditemukan!' };
  }

  // Check if already present
  if (participant.status === 'present') {
      return { 
          success: false, 
          message: 'Kupon SUDAH DIGUNAKAN sebelumnya!',
          participant: {
            name: participant.name,
            rt: participant.rt,
            luckyNumber: participant.luckyNumber
          }
      };
  }

  // Update status to present
  await prisma.participant.update({
      where: { id: participant.id },
      data: { status: 'present' }
  });

  return { 
      success: true, 
      participant: {
          name: participant.name,
          rt: participant.rt,
          luckyNumber: participant.luckyNumber,
          isWinner: participant.isWinner
      }
  };
}
