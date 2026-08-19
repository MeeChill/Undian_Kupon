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
      const PAGE_MARGIN = 5;
      const COUPON_W = PAGE_W - PAGE_MARGIN * 2;
      const COUPON_H = COUPON_W * (30 / 300);
      const COUPON_GAP = 1;
      const COUPONS_PER_PAGE = 6;
      // Keep enough resolution for QR codes while avoiding oversized bitmap pages.
      const scale = 1.5;

      const pdf = new jsPDF({
        unit: 'mm',
        format: 'a4',
        orientation: 'landscape',
        compress: true,
      });

      for (let i = 0; i < wristbands.length; i++) {
        const el = wristbands[i];
        setProgress(`Memproses kupon ${i + 1}/${wristbands.length}...`);

        await waitForImages(el);
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

        const rect = el.getBoundingClientRect();
        const canvas = await html2canvas(el, {
          scale,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          logging: false,
          imageTimeout: 15000,
          width: Math.max(rect.width, 300 * 3.7795275591),
          height: Math.max(rect.height, 30 * 3.7795275591),
          windowWidth: Math.max(window.innerWidth, rect.width),
          scrollX: 0,
          scrollY: 0,
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.68);

        if (i > 0 && i % COUPONS_PER_PAGE === 0) {
          pdf.addPage('a4', 'landscape');
        }

        const row = i % COUPONS_PER_PAGE;
        const y = PAGE_MARGIN + row * (COUPON_H + COUPON_GAP);
        pdf.addImage(imgData, 'JPEG', PAGE_MARGIN, y, COUPON_W, COUPON_H);
      }

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