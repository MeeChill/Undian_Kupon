'use client';

import { useEffect, useState, useRef } from 'react';
import QrScanner from 'qr-scanner';
import { verifyCoupon } from './actions';
import Swal from 'sweetalert2';

// Toast mixin: notif kecil di pojok, auto-hilang, gak nutupin layar
const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 2000,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.onmouseenter = Swal.stopTimer;
    toast.onmouseleave = Swal.resumeTimer;
  }
});

export default function QRScanner({ session }) {
  const [manualInput, setManualInput] = useState('');
  const [manualLoading, setManualLoading] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [zoomCapable, setZoomCapable] = useState(false);
  const [zoomRange, setZoomRange] = useState({ min: 1, max: 3, step: 0.1 });
  const videoRef = useRef(null);
  const scannerRef = useRef(null);
  const trackRef = useRef(null);
  const isProcessing = useRef(false);

  useEffect(() => {
    // Small timeout to ensure DOM is ready
    const timer = setTimeout(() => {
        if (!videoRef.current || scannerRef.current) return;

        QrScanner.WORKER_PATH = '/qr-scanner-worker.min.js';

        const scanner = new QrScanner(
            videoRef.current,
            (result) => {
                if (isProcessing.current) return;
                isProcessing.current = true;

                const decodedText = result.data;

                try {
                    scanner.stop();
                } catch (e) {
                    console.warn("Failed to stop scanner", e);
                }

                handleScan(decodedText).then(() => {
                    // Resume scanning after 2.5 seconds
                    setTimeout(() => {
                        isProcessing.current = false;
                        if (scannerRef.current) {
                            scannerRef.current.start().catch(e => console.warn("Failed to resume scanner", e));
                        }
                    }, 2500);
                });
            },
            {
                returnDetailedScanResult: true,
                highlightScanRegion: false, // matiin bawaan, kita pake bracket CSS statis biar gak nge-restrict area scan
                highlightCodeOutline: true,
                maxScansPerSecond: 10,
                preferredCamera: 'environment', // paksa kamera belakang, gak mirror
                calculateScanRegion: (video) => {
                    // Scan SELURUH frame video, bukan cuma kotak tengah.
                    // Jadi QR gak wajib align persis ke bracket, posisi/jarak bebas
                    // asal masih kefoto & cukup fokus.
                    const smallestDimension = Math.min(video.videoWidth, video.videoHeight);
                    const scanRegionSize = Math.round(smallestDimension); // full, gak di-crop
                    return {
                        x: 0,
                        y: 0,
                        width: video.videoWidth,
                        height: video.videoHeight,
                        // downscale buat performa, bukan buat batasin area
                        downScaledWidth: Math.min(scanRegionSize, 900),
                        downScaledHeight: Math.round(
                            Math.min(scanRegionSize, 900) * (video.videoHeight / video.videoWidth)
                        ),
                    };
                },
            }
        );

        scannerRef.current = scanner;

        scanner.start()
          .then(() => applyHighResAndFocus())
          .catch(e => console.warn("Failed to start scanner", e));

    }, 100);

    return () => {
        clearTimeout(timer);
        if (scannerRef.current) {
            try {
                scannerRef.current.stop();
                scannerRef.current.destroy();
            } catch (e) {
                console.warn("Error clearing scanner", e);
            }
            scannerRef.current = null;
        }
        trackRef.current = null;
    };
  }, []);

  // Maksa resolusi tinggi + continuous autofocus + baca capability zoom
  async function applyHighResAndFocus() {
    try {
        const track = videoRef.current?.srcObject?.getVideoTracks?.()[0];
        if (!track) return;
        trackRef.current = track;

        const capabilities = track.getCapabilities?.() || {};
        const advanced = {};

        if (capabilities.width && capabilities.height) {
            advanced.width = { ideal: Math.min(capabilities.width.max, 3840) };
            advanced.height = { ideal: Math.min(capabilities.height.max, 2160) };
        }
        if (capabilities.focusMode?.includes('continuous')) {
            advanced.focusMode = 'continuous';
        }

        if (capabilities.zoom) {
            setZoomCapable(true);
            setZoomRange({
                min: capabilities.zoom.min,
                max: capabilities.zoom.max,
                step: capabilities.zoom.step || 0.1,
            });
            // auto zoom dikit biar QR kecil lebih gede di frame
            const targetZoom = Math.min(capabilities.zoom.max, capabilities.zoom.min + 1.5);
            advanced.zoom = targetZoom;
            setZoomLevel(targetZoom);
        }

        if (Object.keys(advanced).length > 0) {
            await track.applyConstraints({ advanced: [advanced] });
        }
    } catch (e) {
        console.warn('Gagal apply advanced constraints', e);
    }
  }

  // Handler slider zoom manual (dipakai kalau device support native zoom)
  async function handleZoomChange(value) {
    setZoomLevel(value);
    if (trackRef.current) {
        try {
            await trackRef.current.applyConstraints({ advanced: [{ zoom: value }] });
        } catch (e) {
            console.warn('Gagal set zoom', e);
        }
    }
  }

  // Fallback CSS zoom kalau device gak support native zoom capability
  const cssZoomStyle = !zoomCapable ? { transform: `scale(${zoomLevel})`, transformOrigin: 'center' } : {};

  async function handleScan(text) {
      try {
        const res = await verifyCoupon(text);

        if (res.success) {
            Toast.fire({
                icon: 'success',
                title: `${res.participant.name} — RT ${res.participant.rt}`
            });
        } else {
            Toast.fire({
                icon: 'error',
                title: res.message || 'Verifikasi gagal'
            });
        }
      } catch (err) {
        Toast.fire({
            icon: 'error',
            title: 'Kesalahan sistem'
        });
      }
  }

  async function handleManualSubmit(e) {
    e.preventDefault();
    if (!manualInput.trim()) {
      Toast.fire({
          icon: 'error',
          title: 'Masukkan 3 digit terakhir nomor undian.'
      });
      return;
    }

    setManualLoading(true);
    try {
      const res = await verifyCoupon(manualInput, {
        type: 'manual',
        scannerRt: session?.rt,
      });

      if (res.success) {
        Toast.fire({
          icon: 'success',
          title: `${res.participant.name} — RT ${res.participant.rt}`
        });
        setManualInput('');
      } else {
        Toast.fire({
          icon: 'error',
          title: res.message || 'Verifikasi gagal'
        });
      }
    } catch (err) {
      Toast.fire({
          icon: 'error',
          title: 'Kesalahan sistem'
      });
    } finally {
      setManualLoading(false);
    }
  }

  return (
    <div className="scanner-container">
      {session?.rt ? (
        <div className="scanner-info">
          <strong>Scanner RT {String(session.rt).padStart(2, '0')}</strong>
          <div>Prefix otomatis: {`${String(session.rt).padStart(2, '0')}040`}</div>
        </div>
      ) : (
        <div className="scanner-info">
          <strong>Mode manual</strong>
          <div>Masukkan 3 digit terakhir atau 8 digit penuh.</div>
        </div>
      )}

      <form className="manual-form" onSubmit={handleManualSubmit}>
        <label htmlFor="manual-number">Input nomor undian</label>
        <div className="manual-input-row">
          <input
            id="manual-number"
            type="text"
            inputMode="numeric"
            maxLength={8}
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value.replace(/\D/g, ''))}
            placeholder={session?.rt ? 'Contoh: 123 (3 digit) atau 8 digit' : '3 digit atau 8 digit'}
          />
          <button type="submit" className="btn" disabled={manualLoading}>
            {manualLoading ? 'Memproses...' : 'Verifikasi'}
          </button>
        </div>
        <small>
          {session?.rt
            ? `Scanner RT ${String(session.rt).padStart(2, '0')} hanya perlu memasukkan 3 digit terakhir, karena prefix otomatis adalah ${String(session.rt).padStart(2, '0')}040.`
            : 'Masukkan 3 digit terakhir atau 8 digit penuh.'}
        </small>
      </form>

      <div className="video-wrapper">
        <video ref={videoRef} className="qr-video" style={cssZoomStyle}></video>
        {/* Bracket ini cuma visual guide, TIDAK membatasi area scan sebenarnya.
            Area scan sudah full-frame lewat calculateScanRegion di atas. */}
        <div className="scan-guide">
          <span className="corner corner-tl"></span>
          <span className="corner corner-tr"></span>
          <span className="corner corner-bl"></span>
          <span className="corner corner-br"></span>
        </div>
      </div>

      <p className="scan-hint">
        Arahkan QR ke area kamera — tidak perlu pas di dalam kotak, boleh dari jarak berapapun asal masih fokus.
      </p>

      <div className="zoom-control">
        <label htmlFor="zoom-slider">
          Zoom kamera {zoomCapable ? '(native)' : '(digital)'}
        </label>
        <input
          id="zoom-slider"
          type="range"
          min={zoomRange.min}
          max={zoomRange.max}
          step={zoomRange.step}
          value={zoomLevel}
          onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
        />
      </div>

      <style jsx>{`
        .scanner-container {
            width: 100%;
            max-width: 500px;
            margin: 0 auto;
            position: relative;
        }
        .scanner-info {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 12px 14px;
            margin-bottom: 16px;
            text-align: center;
        }
        .manual-form {
            margin-bottom: 18px;
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        .manual-form label {
            font-weight: 600;
        }
        .manual-input-row {
            display: flex;
            gap: 8px;
        }
        .manual-input-row input {
            flex: 1;
            padding: 10px 12px;
            border: 1px solid #cbd5e1;
            border-radius: 8px;
        }
        .manual-input-row button {
            white-space: nowrap;
        }
        .video-wrapper {
            width: 100%;
            border-radius: 8px;
            overflow: hidden;
            background-color: #000;
            position: relative;
        }
        .qr-video {
            width: 100%;
            display: block;
            transition: transform 0.1s ease-out;
        }
        .scan-guide {
            position: absolute;
            inset: 12%;
            pointer-events: none;
        }
        .corner {
            position: absolute;
            width: 28px;
            height: 28px;
            border: 3px solid #eab308;
        }
        .corner-tl {
            top: 0; left: 0;
            border-right: none;
            border-bottom: none;
            border-top-left-radius: 6px;
        }
        .corner-tr {
            top: 0; right: 0;
            border-left: none;
            border-bottom: none;
            border-top-right-radius: 6px;
        }
        .corner-bl {
            bottom: 0; left: 0;
            border-right: none;
            border-top: none;
            border-bottom-left-radius: 6px;
        }
        .corner-br {
            bottom: 0; right: 0;
            border-left: none;
            border-top: none;
            border-bottom-right-radius: 6px;
        }
        .scan-hint {
            font-size: 13px;
            color: #64748b;
            text-align: center;
            margin-top: 8px;
        }
        .zoom-control {
            margin-top: 10px;
            display: flex;
            flex-direction: column;
            gap: 4px;
        }
        .zoom-control label {
            font-size: 13px;
            color: #475569;
        }
        .zoom-control input[type="range"] {
            width: 100%;
        }
      `}</style>
    </div>
  );
}