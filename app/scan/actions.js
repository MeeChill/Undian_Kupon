'use server'
import prisma from '../../lib/prisma';

function buildLuckyNumber(rawValue, scannerRt) {
  const trimmed = String(rawValue || '').trim();

  if (!trimmed) {
    throw new Error('Nomor undian wajib diisi.');
  }

  if (/^\d{8}$/.test(trimmed)) {
    return trimmed;
  }

  if (/^\d{3}$/.test(trimmed) && scannerRt) {
    const prefix = `${String(scannerRt).padStart(2, '0')}040`;
    return `${prefix}${trimmed}`;
  }

  if (/^\d{3}$/.test(trimmed)) {
    throw new Error('Scanner belum memiliki RT yang terdaftar.');
  }

  throw new Error('Format nomor undian tidak valid.');
}

export async function verifyCoupon(qrCodeText, options = {}) {
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

  if (options.type === 'manual') {
    try {
      luckyNumber = buildLuckyNumber(qrCodeText, options.scannerRt);
    } catch (error) {
      return { success: false, message: error.message };
    }
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
