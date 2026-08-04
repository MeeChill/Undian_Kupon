import prisma from '../../../lib/prisma';
import QRCode from 'qrcode';

import PrintToolbar from './PrintToolbar';

export default async function PrintRTPage({ searchParams }) {
  const rtParam = searchParams.rt;
  let whereClause = {};
  let title = "Semua RT";
  let filename = "kupon-semua-rt.pdf";

  if (rtParam && rtParam !== 'all') {
      const rt = parseInt(rtParam);
      if (isNaN(rt)) {
          return <div>Parameter RT tidak valid.</div>;
      }
      whereClause = { rt };
      title = `RT ${rt}`;
      filename = `kupon-rt-${rt}.pdf`;
  } else if (!rtParam) {
       return <div>Parameter RT tidak valid.</div>;
  }

  const participants = await prisma.participant.findMany({
    where: whereClause,
    orderBy: [
        { rt: 'asc' },
        { luckyNumber: 'asc' }
    ]
  });

  // Generate QR Codes
  const participantsWithQR = await Promise.all(participants.map(async (p) => {
    const host = process.env.NEXT_PUBLIC_HOST || 'localhost:3000';
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    const qrData = `${protocol}://${host}/scan/${p.luckyNumber}`;
    
    const qrCode = await QRCode.toDataURL(qrData);
    return { ...p, qrCode };
  }));

  const getColorByRT = (rt) => {
      switch (parseInt(rt)) {
          case 1: return { primary: '#fcf100', dark: '#a3a500', accent: '#990000' }; // Yellow
          case 2: return { primary: '#1ee13b', dark: '#0a801b', accent: '#990000' }; // Green
          case 3: return { primary: '#2a2df1', dark: '#0d0d8a', accent: '#990000' }; // Blue
          case 4: return { primary: '#f71a1a', dark: '#900909', accent: '#990000' }; // Red
          default: return { primary: '#f71a1a', dark: '#900909', accent: '#990000' }; // Default Red
      }
  };

  return (
    <div className="print-container">
      <h1 className="no-print" style={{ textAlign: 'center' }}>Cetak Kupon (Model Gelang) {title}</h1>
      
      <PrintToolbar filename={filename} />

      <div id="coupon-content" className="wristband-grid">
        {participantsWithQR.map(p => {
            const colors = getColorByRT(p.rt);
            return (
            <div key={p.id} className="wristband" style={{ '--primary': colors.primary, '--dark': colors.dark, '--accent': colors.accent }}>
                
                <div className="wb-left">
                    <div className="wb-sunburst"></div>
                    
                    <h2 className="wb-title">JALAN SANTAI</h2>
                    
                    <div className="wb-panel">
                        <div className="wb-panel-inner">
                            <div className="wb-panel-qr-container">
                                <div className="wb-qr-bg"></div>
                                <div className="wb-qr-fg">
                                    <img src={p.qrCode} alt="QR Code" />
                                </div>
                            </div>
                            <div className="wb-panel-box-right">
                                <div className="wb-rt">RT {String(p.rt).padStart(2, '0')}</div>
                                <div className="wb-rw">RW {String(p.rw).padStart(2, '0')}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="wb-stub">
                    <div className="wb-silhouette"></div>
                    <div className="wb-stub-content">
                        <div className="wb-stub-title">JALAN<br/>SANTAI</div>
                        <div className="wb-stub-num-box">
                            <div className="wb-stub-label">NO. KUPON</div>
                            <div className="wb-stub-num">{p.luckyNumber}</div>
                        </div>
                    </div>
                </div>
                
            </div>
        )})}
      </div>

      <style>{`
        .wristband-grid {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 15px;
            padding: 20px;
            background: #f0f0f0;
        }
        
        .wristband {
            display: flex;
            width: 250mm;
            height: 35mm;
            background: #fff;
            font-family: 'Arial Black', Impact, sans-serif;
            position: relative;
            overflow: hidden;
            page-break-inside: avoid;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            border: 1px solid #ccc;
        }

        .wb-left {
            flex: 1;
            position: relative;
            background: var(--primary);
            overflow: hidden;
            display: flex;
            align-items: center;
        }

        .wb-sunburst {
            position: absolute;
            top: 50%;
            left: 50%;
            width: 200%;
            height: 300%;
            background: repeating-conic-gradient(
                var(--primary) 0 4deg,
                rgba(255,255,255,0.6) 4deg 8deg
            );
            transform: translate(-50%, -50%);
            z-index: 1;
        }

        /* .wb-whiteband removed */

        .wb-title {
            position: relative;
            z-index: 3;
            color: #fff;
            font-size: 34px;
            margin: 0;
            margin-left: 20px;
            text-transform: uppercase;
            transform: skewX(-12deg);
            text-shadow: 
                1px 1px 0px var(--accent),
                2px 2px 0px var(--accent),
                3px 3px 0px var(--accent),
                4px 4px 0px var(--accent),
                5px 5px 0px rgba(0,0,0,0.2);
            letter-spacing: 1px;
            white-space: nowrap;
        }

        .wb-panel {
            position: absolute;
            right: 15px;
            height: 70%;
            width: 200px;
            z-index: 4;
            display: flex;
            align-items: center;
        }

        .wb-panel-inner {
            display: flex;
            border: 2px solid var(--accent);
            background: #fff;
            height: 100%;
            width: 100%;
            align-items: stretch;
            box-shadow: 3px 3px 0 rgba(0,0,0,0.15);
        }

        .wb-panel-qr-container {
            flex: 2.1;
            position: relative;
            background: var(--primary);
            border-right: 1px solid var(--accent);
        }

        .wb-qr-bg {
            position: absolute;
            top: 5px; left: 5px; right: 5px; bottom: 5px;
            background: #fff;
            border: 1px solid var(--accent);
            transform: rotate(-3deg);
            box-shadow: 2px 2px 4px rgba(0,0,0,0.2);
        }

        .wb-qr-fg {
            position: absolute;
            top: 5px; left: 5px; right: 5px; bottom: 5px;
            background: #fff;
            border: 2px solid var(--accent);
            padding: 2px;
            display: flex;
            justify-content: center;
            align-items: center;
            transform: rotate(3deg);
        }

        .wb-qr-fg img {
            width: 100%;
            height: 100%;
            object-fit: contain;
        }

        .wb-panel-box-right {
            flex: 0.9;
            background: rgba(255,255,255,0.9);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            color: var(--accent);
            font-weight: 900;
            font-size: 15px;
            line-height: 1.2;
        }

        .wb-stub {
            width: 65mm;
            background: var(--dark);
            border-left: 2px dashed #fff;
            position: relative;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            overflow: hidden;
            flex-shrink: 0;
        }

        .wb-silhouette {
            position: absolute;
            bottom: 0;
            left: -10%;
            width: 120%;
            height: 70%;
            background-image: url('data:image/svg+xml;utf8,<svg viewBox="0 0 100 50" xmlns="http://www.w3.org/2000/svg"><path fill="%23000" opacity="0.15" d="M5,50 c0,-10 5,-15 10,-15 c5,0 10,5 10,15 M20,50 c0,-15 5,-20 15,-20 c10,0 15,5 15,20 M40,50 c0,-12 5,-18 10,-18 c5,0 10,6 10,18 M55,50 c0,-16 6,-22 15,-22 c9,0 15,6 15,22 M75,50 c0,-10 5,-15 10,-15 c5,0 10,5 10,15"/><circle fill="%23000" opacity="0.15" cx="15" cy="30" r="4"/><circle fill="%23000" opacity="0.15" cx="35" cy="24" r="5"/><circle fill="%23000" opacity="0.15" cx="50" cy="27" r="4.5"/><circle fill="%23000" opacity="0.15" cx="70" cy="22" r="5.5"/><circle fill="%23000" opacity="0.15" cx="85" cy="30" r="4"/></svg>');
            background-size: cover;
            background-position: bottom;
            z-index: 1;
        }
        
        .wb-stub-content {
            position: relative;
            z-index: 2;
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
        }

        .wb-stub-title {
            text-align: center;
            font-size: 22px;
            color: #fff;
            line-height: 0.95;
            transform: skewX(-10deg);
            text-shadow: 
                1px 1px 0px var(--accent),
                2px 2px 0px var(--accent);
            margin-bottom: 20px;
        }

        .wb-stub-num-box {
            position: absolute;
            bottom: 6px;
            width: 86%;
            left: 7%;
        }

        .wb-stub-label {
            color: #fff;
            font-size: 7px;
            font-family: sans-serif;
            font-weight: bold;
            margin-bottom: 2px;
            text-align: left;
            padding-left: 2px;
        }

        .wb-stub-num {
            background: #fff;
            color: var(--accent);
            border: 1px solid var(--accent);
            padding: 3px;
            font-size: 12px;
            font-weight: bold;
            text-align: center;
            border-radius: 2px;
            letter-spacing: 0.5px;
        }

        @media print {
            @page {
                size: landscape;
                margin: 5mm;
            }
            * {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }
            .no-print { display: none !important; }
            body { margin: 0; padding: 0; background: #fff; }
            .print-container { width: 100%; }
            .wristband-grid { 
                display: block; 
                padding: 0; 
                margin: 0;
                background: transparent;
            }
            .wristband {
                margin: 0 auto 10px auto;
                box-shadow: none;
                border: 1px dashed #ccc;
                page-break-inside: avoid;
                break-inside: avoid;
                max-width: 100%;
            }
        }
      `}</style>
    </div>
  );
}