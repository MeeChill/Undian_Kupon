'use client';

export default function PrintButton() {
    return <button onClick={() => window.print()} className="btn" style={{ marginRight: '10px' }}>Cetak Kupon</button>;
}
