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
    // Generate QR with full URL for scanning
    // In production, use your actual domain
    const host = process.env.NEXT_PUBLIC_HOST || 'localhost:3000';
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    const qrData = `${protocol}://${host}/scan/${p.luckyNumber}`;
    
    const qrCode = await QRCode.toDataURL(qrData);
    return { ...p, qrCode };
  }));

  return (
    <div className="print-container">
      <h1 className="no-print" style={{ textAlign: 'center' }}>Cetak Kupon {title}</h1>
      
      <PrintToolbar filename={filename} />

      <div id="coupon-content" className="coupon-grid">
        {participantsWithQR.map(p => (
            <div key={p.id} className="coupon-card">
                <div className="coupon-header">
                    <h3>JALAN SANTAI RW 04</h3>
                    <p>Kupon Undian</p>
                </div>
                <div className="coupon-body">
                    <div className="qr-section">
                        <img src={p.qrCode} alt="QR Code" width="100" height="100" />
                    </div>
                    <div className="info-section">
                        <div className="lucky-number">{p.luckyNumber}</div>
                        <div className="participant-info">
                            {p.name}<br/>
                            RT {p.rt} / RW {p.rw}
                        </div>
                    </div>
                </div>
                <div className="coupon-footer">
                    *Harap bawa potongan ini saat acara
                </div>
                {/* Dotted line for cutting */}
                <div className="cut-line"></div>
            </div>
        ))}
      </div>

      <style>{`
        .coupon-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr); /* 2 Kupon per baris */
            gap: 20px;
            padding: 20px;
        }
        
        .coupon-card {
            border: 2px solid #333;
            border-radius: 10px;
            padding: 15px;
            position: relative;
            page-break-inside: avoid;
        }

        .coupon-header {
            text-align: center;
            border-bottom: 1px solid #ccc;
            padding-bottom: 5px;
            margin-bottom: 10px;
        }
        
        .coupon-header h3 { margin: 0; font-size: 1.2em; }
        .coupon-header p { margin: 0; font-size: 0.8em; color: #666; }

        .coupon-body {
            display: flex;
            align-items: center;
        }

        .qr-section {
            flex: 0 0 100px;
            margin-right: 15px;
        }

        .info-section {
            flex: 1;
            text-align: center;
        }

        .lucky-number {
            font-size: 1.8em;
            font-family: monospace;
            font-weight: bold;
            letter-spacing: 2px;
            margin-bottom: 5px;
        }

        .participant-info {
            font-size: 0.9em;
        }

        .coupon-footer {
            margin-top: 10px;
            text-align: center;
            font-size: 0.7em;
            font-style: italic;
            color: #555;
        }

        @media print {
            .no-print { display: none; }
            body { margin: 0; padding: 0; }
            .print-container { width: 100%; }
            .coupon-grid { display: block; }
            .coupon-card { 
                width: 45%; 
                float: left; 
                margin: 10px 2.5%; 
                border: 1px solid #000;
            }
        }
      `}</style>
    </div>
  );
}