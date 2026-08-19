'use client';

import { useState } from 'react';

export default function PrintToolbar({ filename = 'kupon.pdf' }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState('');

  const handlePrint = () => {
    window.print();
  };

  const waitForImages = async (container) => {
    const imgs = Array.from(container.querySelectorAll('img'));
    await Promise.all(
      imgs.map((img) => {
        if (img.complete && img.naturalWidth > 0) return Promise.resolve();
        return new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve;
          if (img.decode) {
            img.decode().then(resolve).catch(resolve);
          }
        });
      })
    );
  };

  // Proses beberapa kupon sekaligus (bukan satu-satu) biar lebih cepet.
  // Naikin angka ini kalau laptop/PC lu kenceng, turunin kalau nge-lag/nge-freeze.
  const RENDER_CONCURRENCY = 4;

  const processInBatches = async (items, worker, concurrency) => {
    const results = new Array(items.length);
    let cursor = 0;
    const runners = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
      while (cursor < items.length) {
        const current = cursor++;
        results[current] = await worker(items[current], current);
      }
    });
    await Promise.all(runners);
    return results;
  };

  const handleExportPdf = async () => {
    const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
      import('html2canvas'),
      import('jspdf'),
    ]);

    const wristbands = Array.from(document.querySelectorAll('.wristband'));
    if (wristbands.length === 0) return;

    setIsGenerating(true);

    try {
      const PAGE_W = 297;
      const PAGE_H = 210;
      const PAGE_MARGIN = 5;
      const USABLE_W = PAGE_W - PAGE_MARGIN * 2;
      const USABLE_H = PAGE_H - PAGE_MARGIN * 2;

      // Rasio asli kupon (lebar:tinggi = 300:30 = 10:1)
      const ASPECT_RATIO = 300 / 30;

      // 🔧 UBAH ANGKA INI BUAT NGATUR SEBERAPA KECIL KUPONNYA (0.1 - 1)
      // 1 = full lebar halaman (ukuran lama), makin kecil makin mungil kuponnya
      const PDF_SIZE_SCALE = 0.7;

      const COUPON_W = USABLE_W * PDF_SIZE_SCALE;
      const COUPON_H = COUPON_W / ASPECT_RATIO;
      const COUPON_GAP = 1;

      // Biar kupon tetep di tengah halaman secara horizontal
      const X_OFFSET = PAGE_MARGIN + (USABLE_W - COUPON_W) / 2;

      // Hitung otomatis berapa kupon muat per halaman berdasarkan ukuran baru
      const COUPONS_PER_PAGE = Math.max(
        1,
        Math.floor((USABLE_H + COUPON_GAP) / (COUPON_H + COUPON_GAP))
      );

      // Resolusi canvas ikut mengecil proporsional sama PDF_SIZE_SCALE, karena
      // kupon yg dicetak sekarang lebih kecil jadi gak butuh bitmap sebesar dulu.
      const scale = 1.3;
      const MIN_PX_W = 300 * 3.7795275591 * PDF_SIZE_SCALE;
      const MIN_PX_H = 30 * 3.7795275591 * PDF_SIZE_SCALE;

      // Semua gambar (QR, logo sponsor, background) udah ke-render pas halaman
      // dimuat, jadi cukup dicek sekali di awal, bukan diulang tiap kupon.
      setProgress('Menyiapkan gambar...');
      await Promise.all(wristbands.map((el) => waitForImages(el)));
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

      let done = 0;
      const imageDataList = await processInBatches(
        wristbands,
        async (el) => {
          const rect = el.getBoundingClientRect();
          const canvas = await html2canvas(el, {
            scale,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            logging: false,
            imageTimeout: 15000,
            width: Math.max(rect.width, MIN_PX_W),
            height: Math.max(rect.height, MIN_PX_H),
            windowWidth: Math.max(window.innerWidth, rect.width),
            scrollX: 0,
            scrollY: 0,
          });
          const data = canvas.toDataURL('image/jpeg', 0.68);
          done += 1;
          setProgress(`Memproses kupon ${done}/${wristbands.length}...`);
          return data;
        },
        RENDER_CONCURRENCY
      );

      setProgress('Menyusun PDF...');

      const pdf = new jsPDF({
        unit: 'mm',
        format: 'a4',
        orientation: 'landscape',
        compress: true,
      });

      imageDataList.forEach((imgData, i) => {
        if (i > 0 && i % COUPONS_PER_PAGE === 0) {
          pdf.addPage('a4', 'landscape');
        }
        const row = i % COUPONS_PER_PAGE;
        const y = PAGE_MARGIN + row * (COUPON_H + COUPON_GAP);
        pdf.addImage(imgData, 'JPEG', X_OFFSET, y, COUPON_W, COUPON_H);
      });

      pdf.save(filename);
    } catch (error) {
      console.error('PDF generation failed:', error);
      alert('Gagal membuat PDF. Silakan coba lagi atau gunakan tombol Print biasa.');
    } finally {
      setIsGenerating(false);
      setProgress('');
    }
  };

  return (
    <div className="no-print" style={{ textAlign: 'center', marginBottom: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
        <button
          onClick={handlePrint}
          style={{ padding: '10px 20px', fontSize: '1.2em', cursor: 'pointer', backgroundColor: '#3498db', color: 'white', border: 'none', borderRadius: '5px' }}
        >
          🖨️ Print (Browser)
        </button>

        <button
          onClick={handleExportPdf}
          disabled={isGenerating}
          style={{ padding: '10px 20px', fontSize: '1.2em', cursor: 'pointer', backgroundColor: isGenerating ? '#95a5a6' : '#e74c3c', color: 'white', border: 'none', borderRadius: '5px' }}
        >
          {isGenerating ? '⏳ Memproses...' : '📄 Export PDF'}
        </button>
      </div>
      {progress && <div style={{ fontSize: '0.9em', color: '#666' }}>{progress}</div>}
    </div>
  );
}