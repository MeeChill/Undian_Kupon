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
      const PDF_SIZE_SCALE = 0.7;

      const COUPON_W = USABLE_W * PDF_SIZE_SCALE;
      const COUPON_H = COUPON_W / ASPECT_RATIO;
      const COUPON_GAP = 1;
      const X_OFFSET = PAGE_MARGIN + (USABLE_W - COUPON_W) / 2;
      const COUPONS_PER_PAGE = Math.max(
        1,
        Math.floor((USABLE_H + COUPON_GAP) / (COUPON_H + COUPON_GAP))
      );

      const scale = 1.3;
      const MIN_PX_W = 300 * 3.7795275591 * PDF_SIZE_SCALE;
      const MIN_PX_H = 30 * 3.7795275591 * PDF_SIZE_SCALE;

      // Inset kira-kira dari tepi kotak QR container ke gambar QR asli
      // (border 2px + padding 2px + offset 5px pada CSS aslinya), dalam CSS px.
      const QR_INSET_PX = 9;

      // ---------------------------------------------------------------
      // MODE TURBO: background/logo/sunburst identik dalam satu warna RT,
      // jadi cuma di-screenshot SEKALI per grup (bukan per-kupon).
      // QR code TIDAK ikut di-screenshot/di-composite ke canvas sama sekali
      // -- dia ditempel belakangan langsung ke PDF sebagai PNG asli (lossless,
      // tanpa rotasi, tanpa kompresi JPEG) supaya tetap tajam dan gampang discan.
      // ---------------------------------------------------------------

      const renderTemplate = async (referenceEl) => {
        const clone = referenceEl.cloneNode(true);
        clone.style.position = 'fixed';
        clone.style.top = '-10000px';
        clone.style.left = '0';
        clone.style.margin = '0';
        clone.style.zIndex = '-1';

        // kosongkan QR & nomor kupon di template (biar gak ke-bake punya 1 peserta doang)
        const qrImg = clone.querySelector('.wb-qr-fg img');
        if (qrImg) {
          qrImg.removeAttribute('src');
          qrImg.style.visibility = 'hidden';
        }
        const numEl = clone.querySelector('.wb-stub-num');
        if (numEl) numEl.textContent = '\u00A0'; // ganti dari ''

        // QR kita tempel belakangan dalam posisi LURUS (gak dirotasi) supaya tetap
        // tajam & scannable. Biar gak ada celah/selisih sama bingkai dekoratif di
        // belakangnya, bingkai wb-qr-bg/wb-qr-fg pada template ini juga diluruskan
        // (rotasi CSS-nya dimatikan), jadi dua-duanya konsisten sejajar.
        const qrBgEl = clone.querySelector('.wb-qr-bg');
        if (qrBgEl) qrBgEl.style.transform = 'none';
        const qrFgEl = clone.querySelector('.wb-qr-fg');
        if (qrFgEl) qrFgEl.style.transform = 'none';

        document.body.appendChild(clone);
        await waitForImages(clone);
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

        const wbRect = clone.getBoundingClientRect();
        const qrContainerEl = clone.querySelector('.wb-panel-qr-container');
        const numTargetEl = clone.querySelector('.wb-stub-num');
        const qrRect = qrContainerEl ? qrContainerEl.getBoundingClientRect() : null;
        const numRect = numTargetEl ? numTargetEl.getBoundingClientRect() : null;

        // PENTING: getComputedStyle() balikin objek "live" yang nilainya reset
        // ke default begitu elemen-nya dicabut dari DOM (document.body.removeChild
        // di bawah). Makanya nilai-nilainya harus dibaca & disalin ke variabel
        // biasa DI SINI, sebelum clone-nya dihapus -- bukan setelahnya.
        let numFontSnapshot = null;
        if (numTargetEl) {
          const numStyle = window.getComputedStyle(numTargetEl);
          numFontSnapshot = {
            sizePx: parseFloat(numStyle.fontSize),
            weight: numStyle.fontWeight,
            family: numStyle.fontFamily,
            color: numStyle.color,
          };
        }

        const canvas = await html2canvas(clone, {
          scale,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          logging: false,
          imageTimeout: 15000,
          width: Math.max(wbRect.width, MIN_PX_W),
          height: Math.max(wbRect.height, MIN_PX_H),
          windowWidth: Math.max(window.innerWidth, wbRect.width),
          scrollX: 0,
          scrollY: 0,
        });

        document.body.removeChild(clone);

        if (!qrRect || !numRect || !numFontSnapshot) return null;

        // Semua koordinat di bawah ini disimpan dalam "raw DOM px" (relatif ke
        // wbRect, TANPA dikonversi ke canvas px) supaya gampang dipetakan ke mm
        // saat kupon ditaruh di halaman PDF nanti.
        return {
          canvas,
          wbWidthPx: wbRect.width,
          wbHeightPx: wbRect.height,
          qrBoxPx: {
            x: qrRect.left - wbRect.left + QR_INSET_PX,
            y: qrRect.top - wbRect.top + QR_INSET_PX,
            w: qrRect.width - QR_INSET_PX * 2,
            h: qrRect.height - QR_INSET_PX * 2,
          },
          numBoxPx: {
            x: numRect.left - wbRect.left,
            y: numRect.top - wbRect.top,
            w: numRect.width,
            h: numRect.height,
          },
          numFont: numFontSnapshot,
        };
      };

      const renderBackgroundOnly = async (template, numText) => {
        const ratio = template.canvas.width / template.wbWidthPx;
        const out = document.createElement('canvas');
        out.width = template.canvas.width;
        out.height = template.canvas.height;
        const ctx = out.getContext('2d');
        ctx.drawImage(template.canvas, 0, 0);

        const nb = template.numBoxPx;
        ctx.save();
        ctx.fillStyle = template.numFont.color;
        ctx.font = `${template.numFont.weight} ${template.numFont.sizePx * ratio}px ${template.numFont.family}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(
          numText,
          (nb.x + nb.w / 2) * ratio,
          (nb.y + nb.h / 2) * ratio
        );
        ctx.restore();

        // PNG (lossless) supaya garis tipis seperti border merah kotak nomor
        // gak hancur/blur kena kompresi JPEG. Konten ini didominasi flat-color
        // + garis tajam, jadi ukuran file PNG gak akan bengkak drastis.
        return out.toDataURL('image/png');
      };

      const renderSlow = async (el) => {
        await waitForImages(el);
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
        return { imgData: canvas.toDataURL('image/png'), qrSrc: null, qrBoxPx: null, wbWidthPx: rect.width, wbHeightPx: rect.height };
      };

      // Kelompokkan kupon berdasarkan warna primer (identik dalam 1 RT)
      const groups = new Map();
      wristbands.forEach((el) => {
        const key = el.style.getPropertyValue('--primary') || 'default';
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(el);
      });

      setProgress('Menyiapkan template...');
      const templates = new Map();
      for (const [key, els] of groups.entries()) {
        try {
          const tpl = await renderTemplate(els[0]);
          if (tpl) templates.set(key, tpl);
        } catch (e) {
          console.warn('Gagal bikin template untuk grup', key, e);
        }
      }

      let done = 0;
      const total = wristbands.length;
      const results = await processInBatches(
        wristbands,
        async (el) => {
          const key = el.style.getPropertyValue('--primary') || 'default';
          const tpl = templates.get(key);
          const qrSrc = el.querySelector('.wb-qr-fg img')?.getAttribute('src') || null;
          const numText = el.querySelector('.wb-stub-num')?.textContent || '';

          let result;
          try {
            if (!tpl || !qrSrc) throw new Error('no template / no qr');
            const imgData = await renderBackgroundOnly(tpl, numText);
            result = {
              imgData,
              qrSrc, // PNG asli dari QRCode.toDataURL(), belum disentuh sama sekali
              qrBoxPx: tpl.qrBoxPx,
              wbWidthPx: tpl.wbWidthPx,
              wbHeightPx: tpl.wbHeightPx,
            };
          } catch (e) {
            // fallback aman: render manual (QR ikut ke-bake di gambar, tapi tetap tampil)
            result = await renderSlow(el);
          }
          done += 1;
          if (done % 10 === 0 || done === total) {
            setProgress(`Memproses kupon ${done}/${total}...`);
          }
          return result;
        },
        8
      );

      setProgress('Menyusun PDF...');

      const pdf = new jsPDF({
        unit: 'mm',
        format: 'a4',
        orientation: 'landscape',
        compress: true,
      });

      results.forEach((res, i) => {
        if (i > 0 && i % COUPONS_PER_PAGE === 0) {
          pdf.addPage('a4', 'landscape');
        }
        const row = i % COUPONS_PER_PAGE;
        const y = PAGE_MARGIN + row * (COUPON_H + COUPON_GAP);

        // 1) Background + nomor kupon (raster, PNG lossless)
        pdf.addImage(res.imgData, 'PNG', X_OFFSET, y, COUPON_W, COUPON_H);

        // 2) QR code asli ditempel di atasnya, PNG lossless, tanpa rotasi/kompresi.
        // QR wajib persegi (1:1) -- kalau dipaksa isi kotak yang gak persegi,
        // modul QR-nya jadi gepeng/distorsi dan susah discan.
        if (res.qrSrc && res.qrBoxPx) {
          const mmPerPxX = COUPON_W / res.wbWidthPx;
          const mmPerPxY = COUPON_H / res.wbHeightPx;
          const boxWmm = res.qrBoxPx.w * mmPerPxX;
          const boxHmm = res.qrBoxPx.h * mmPerPxY;
          const boxXmm = X_OFFSET + res.qrBoxPx.x * mmPerPxX;
          const boxYmm = y + res.qrBoxPx.y * mmPerPxY;

          const qrSize = Math.min(boxWmm, boxHmm);
          const qrX = boxXmm + (boxWmm - qrSize) / 2;
          const qrY = boxYmm + (boxHmm - qrSize) / 2;
          pdf.addImage(res.qrSrc, 'PNG', qrX, qrY, qrSize, qrSize);
        }
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
          {isGenerating ? '⏳ Memproses...' : '📄 Export PDF (Cepat)'}
        </button>
      </div>
      {progress && <div style={{ fontSize: '0.9em', color: '#666' }}>{progress}</div>}
    </div>
  );
}