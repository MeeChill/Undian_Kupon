'use client';

import { useEffect, useState, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { verifyCoupon } from './actions';

export default function QRScanner({ session }) {
  const [toast, setToast] = useState(null);
  const [manualInput, setManualInput] = useState('');
  const [manualLoading, setManualLoading] = useState(false);
  const scannerRef = useRef(null);
  const isProcessing = useRef(false);
  const toastTimeoutRef = useRef(null);

  const showToast = (nextToast, duration = 1800) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
      toastTimeoutRef.current = null;
    }

    if (!nextToast) {
      setToast(null);
      return;
    }

    setToast(nextToast);
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
      toastTimeoutRef.current = null;
    }, duration);
  };

  useEffect(() => {
    // Small timeout to ensure DOM is ready
    const timer = setTimeout(() => {
        if (scannerRef.current) return;

        const scanner = new Html5QrcodeScanner(
          "reader",
          { fps: 10, qrbox: { width: 250, height: 250 } },
          false
        );
        scannerRef.current = scanner;

        scanner.render(onScanSuccess, onScanFailure);

        function onScanSuccess(decodedText) {
          if (isProcessing.current) return;
          isProcessing.current = true;
          
          try {
            scanner.pause(true);
          } catch (e) {
            console.warn("Failed to pause scanner", e);
          }

          handleScan(decodedText).then(() => {
             // Resume scanning after 2 seconds
             setTimeout(() => {
                // Check if scanner is still active/mounted
                if (!scannerRef.current) return;
                
                isProcessing.current = false;
                showToast(null);
                
                try {
                    scanner.resume();
                } catch (e) {
                    console.warn("Failed to resume scanner", e);
                    // If resume fails, it might be in a weird state, try to re-render or reload page?
                    // For now just log it.
                }
             }, 2000);
          });
        }

        function onScanFailure(error) {}
    }, 100);

    return () => {
        clearTimeout(timer);
        if (toastTimeoutRef.current) {
          clearTimeout(toastTimeoutRef.current);
          toastTimeoutRef.current = null;
        }
        if (scannerRef.current) {
            try {
                // Use a local variable to capture the current scanner instance
                const scannerToClear = scannerRef.current;
                scannerToClear.clear().catch(error => {
                    console.warn("Failed to clear html5-qrcode scanner", error);
                });
            } catch (e) {
                console.warn("Error clearing scanner", e);
            }
            scannerRef.current = null;
        }
    };
  }, []);

  async function handleScan(text) {
      try {
        const res = await verifyCoupon(text);
        
        if (res.success) {
            showToast({
                type: 'success',
                title: 'VERIFIKASI SUKSES',
                message: `${res.participant.name} - RT ${res.participant.rt}`
            });
        } else {
            showToast({
                type: 'error',
                title: 'GAGAL',
                message: res.message
            }, 2200);
        }
      } catch (err) {
        showToast({ type: 'error', title: 'ERROR', message: 'Kesalahan sistem' }, 2200);
      }
  }

  async function handleManualSubmit(e) {
    e.preventDefault();
    if (!manualInput.trim()) {
      setToast({ type: 'error', title: 'GAGAL', message: 'Masukkan 3 digit terakhir nomor undian.' });
      return;
    }

    setManualLoading(true);
    try {
      const res = await verifyCoupon(manualInput, {
        type: 'manual',
        scannerRt: session?.rt,
      });

      if (res.success) {
        showToast({
          type: 'success',
          title: 'VERIFIKASI SUKSES',
          message: `${res.participant.name} - RT ${res.participant.rt}`,
        });
        setManualInput('');
      } else {
        showToast({ type: 'error', title: 'GAGAL', message: res.message }, 2200);
      }
    } catch (err) {
      showToast({ type: 'error', title: 'ERROR', message: 'Kesalahan sistem' }, 2200);
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
            maxLength={3}
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value.replace(/\D/g, ''))}
            placeholder={session?.rt ? 'Contoh: 123' : '3 digit atau 8 digit'}
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

      <div id="reader"></div>
      
      {toast && (
          <div className={`toast toast-${toast.type}`}>
              <div className="toast-icon">{toast.type === 'success' ? '✅' : '❌'}</div>
              <div>
                  <strong>{toast.title}</strong>
                  <div>{toast.message}</div>
              </div>
          </div>
      )}

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
        .toast {
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            padding: 15px 25px;
            border-radius: 50px;
            color: white;
            font-weight: bold;
            display: flex;
            align-items: center;
            gap: 15px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            z-index: 9999;
            animation: slideDown 0.3s ease-out;
            min-width: 300px;
        }
        .toast-success { background-color: #2ecc71; }
        .toast-error { background-color: #e74c3c; }
        .toast-icon { font-size: 1.5em; }

        @keyframes slideDown {
            from { top: -100px; }
            to { top: 20px; }
        }
      `}</style>
      <style jsx global>{`
        #reader__scan_region {
            background: white;
        }
      `}</style>
    </div>
  );
}
