import prisma from '../../../lib/prisma';
import QRCode from 'qrcode';

import PrintToolbar from './PrintToolbar';

function generateSunburstDataUri(primaryColor) {
  const W = 1400, H = 600;
  const cx = W / 2, cy = H / 2;
  const r = W * 0.42;

  const toRad = (d) => (d * Math.PI) / 180;

  const wedgePath = (startDeg, endDeg, fill) => {
    const x1 = cx + r * Math.cos(toRad(startDeg));
    const y1 = cy + r * Math.sin(toRad(startDeg));
    const x2 = cx + r * Math.cos(toRad(endDeg));
    const y2 = cy + r * Math.sin(toRad(endDeg));
    return `<path d="M${cx},${cy} L${x1.toFixed(2)},${y1.toFixed(2)} L${x2.toFixed(2)},${y2.toFixed(2)} Z" fill="${fill}"/>`;
  };

  const paths = [];
  for (let deg = 0; deg < 360; deg += 8) {
    const fill = deg % 16 < 8 ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.12)';
    paths.push(wedgePath(deg, deg + 4, fill));
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}">
    <defs>
      <radialGradient id="sunburstGlow" cx="50%" cy="50%" r="70%">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="0.95" />
        <stop offset="35%" stop-color="${primaryColor}" stop-opacity="1" />
        <stop offset="100%" stop-color="${primaryColor}" stop-opacity="1" />
      </radialGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="${primaryColor}" />
    <circle cx="${cx}" cy="${cy}" r="${r * 0.82}" fill="url(#sunburstGlow)" />
    ${paths.join('')}
    <circle cx="${cx}" cy="${cy}" r="${r * 0.48}" fill="#ffffff" opacity="0.08" />
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// Ganti path/nama file ini sesuai logo yang lu taro di folder /public
const SPONSOR_LOGOS = [
  '/LOGO_REKAT.png',
  '/Logo_Rt0.png',
  '/Logo_Rt2.jpeg',
  '/logo_rekrut.png',
  '/Logo_rw.jpeg',
  '/Logo_KarangTaruna-removebg-preview.png',
];

const SUNBURST_ASSETS = {
  1: '/sunburst_kuning.png',
  2: '/sunburst_hijau.png',
  3: '/sunburst_biru.png',
  4: '/sunburst_merah.jpg',
};

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
            const sunburstAsset = SUNBURST_ASSETS[parseInt(p.rt)] || null;
            const sunburstBg = sunburstAsset ? sunburstAsset : generateSunburstDataUri(colors.primary);
            return (
            <div key={p.id} className="wristband" style={{ '--primary': colors.primary, '--dark': colors.dark, '--accent': colors.accent }}>

                <div className="wb-left">
                    <img
                        className="wb-sunburst"
                        src={sunburstBg}
                        alt=""
                    />

                    <div className="wb-left-main">
                        <div className="wb-text-area">
                            <h2 className="wb-title">JALAN SANTAI</h2>
                        </div>

                        <div className="wb-logos">
                            {SPONSOR_LOGOS.map((src, i) => (
                                <div className="wb-logo-item" key={i}>
                                    <img src={src} alt={`Sponsor ${i + 1}`} />
                                </div>
                            ))}
                        </div>

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

                    <div className="wb-reminder-strip">
                        <span className="wb-reminder-text">
                            Gunakan Gelang Ini Pada Saat Acara Jalan Santai
                        </span>
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

                <div className="wb-adhesive" aria-hidden="true">
                    <div className="wb-adhesive-inner"></div>
                </div>

            </div>
        )})}
      </div>

      <style>{`
        .wristband-grid {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 1mm;
            padding: 0;
            margin: 0;
            background: transparent;
            width: 100%;
        }

        .wristband {
            display: flex;
            width: 300mm;
            height: 30mm;
            max-width: 100%;
            box-sizing: border-box;
            background: #fff;
            font-family: 'Arial Black', Impact, sans-serif;
            position: relative;
            overflow: hidden;
            page-break-inside: avoid;
            break-inside: avoid;
            box-shadow: none;
            border: 0;
            margin: 0;
        }

        .wb-left {
            flex: 1;
            position: relative;
            background: var(--primary);
            overflow: hidden;
            display: flex;
            flex-direction: column;
        }

        .wb-sunburst {
            position: absolute;
            top: 0;
            right: 0;
            bottom: 0;
            left: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
            z-index: 1;
            opacity: 1;
            pointer-events: none;
        }

        .wb-left-main {
            position: relative;
            z-index: 3;
            flex: 1;
            min-height: 0;
            display: flex;
            align-items: center;
        }

        .wb-reminder-strip {
            position: relative;
            z-index: 3;
            flex-shrink: 0;
            height: 5mm;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(0, 0, 0, 0.5);
            border-top: 1px solid rgba(255,255,255,0.45);
        }

        .wb-reminder-text {
            color: #fff;
            font-family: Arial, Helvetica, sans-serif;
            font-weight: 700;
            font-size: 15px;
            letter-spacing: 1.5px;
            text-transform: uppercase;
            white-space: nowrap;
        }

        .wb-text-area {
            flex: 1;
            position: relative;
            z-index: 3;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100%;
            padding-right: 80px;
        }

        .wb-title {
            margin: 0;
            color: #fff;
            font-size: 45px;
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

        .wb-logos {
            position: absolute;
            right: 200px;
            top: 50%;
            transform: translateY(-50%);
            z-index: 3;
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            grid-template-rows: repeat(2, 1fr);
            gap: 2px;
        }

        .wb-logo-item {
            width: 35px;
            height: 35px;
            border-radius: 50%;
            background: rgba(255,255,255,0.92);
            border: 1px solid var(--accent);
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            box-shadow: 1px 1px 0 rgba(0,0,0,0.15);
        }

        .wb-logo-item img {
            width: 100%;
            height: 100%;
            object-fit: contain;
            padding: 1.5px;
            box-sizing: border-box;
        }

        .wb-panel {
            position: relative;
            margin-right: 12px;
            height: 78%;
            width: 170px;
            flex-shrink: 0;
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
            image-rendering: pixelated;
        }

        .wb-panel-box-right {
            background: rgba(255,255,255,0.9);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            color: var(--accent);
            font-weight: 900;
            font-size: 14px;
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

        .wb-stub::before {
            content: '';
            position: absolute;
            top: 0;
            right: 0;
            bottom: 0;
            left: 0;
            background-image: url('/Logo_RW-removebg-preview.png');
            background-size: cover;
            background-position: center;
            opacity: 0.25;
            z-index: 0;
            pointer-events: none;
        }

        .wb-adhesive {
            width: 18mm;
            background: #f7f7f7;
            border-left: 1px dashed #999;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
        }

        .wb-adhesive-inner {
            width: 80%;
            height: 70%;
            border: 1px dashed #999;
            border-radius: 2mm;
            background: #fff;
        }

        .wb-silhouette {
            position: absolute;
            bottom: 0;
            left: -10%;
            width: 120%;
            height: 70%;
            background-image: url('/Logo_RW-removebg-preview.png');
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
            line-height: 14px;   /* baru */
            min-height: 14px;    /* baru */
            font-weight: bold;
            text-align: center;
            border-radius: 2px;
            letter-spacing: 0.5px;
            box-sizing: content-box;  /* baru — pastikan padding ga makan min-height */
        }

        @media print {
            @page {
                size: A4 landscape;
                margin: 5mm;
            }
            * {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }
            .no-print { display: none !important; }
            html, body { margin: 0; padding: 0; background: #fff; }
            .print-container { width: 100%; overflow: visible; }
            .wristband-grid {
                display: block;
                padding: 0;
                margin: 0;
                background: transparent;
            }
            .wristband {
                width: 100%;
                max-width: 287mm;
                margin: 0 auto 1mm auto;
                box-shadow: none;
                border: 0;
                page-break-inside: avoid;
                break-inside: avoid;
            }
        }
      `}</style>
    </div>
  );
}