'use client';

import { useEffect, useState, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { verifyCoupon } from './actions';

export default function QRScanner() {
  const [toast, setToast] = useState(null);
  const scannerRef = useRef(null);
  const isProcessing = useRef(false);

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
                setToast(null);
                
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
            setToast({
                type: 'success',
                title: 'VERIFIKASI SUKSES',
                message: `${res.participant.name} - RT ${res.participant.rt}`
            });
        } else {
            setToast({
                type: 'error',
                title: 'GAGAL',
                message: res.message
            });
        }
      } catch (err) {
        setToast({ type: 'error', title: 'ERROR', message: 'Kesalahan sistem' });
      }
  }

  return (
    <div className="scanner-container">
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
