'use client';
import { useState } from 'react';
import { drawWinner } from './actions';

export default function DrawClient() {
    const [display, setDisplay] = useState('00000000');
    const [winner, setWinner] = useState(null);
    const [isRolling, setIsRolling] = useState(false);

    const handleDraw = async () => {
        if (isRolling) return;
        
        setWinner(null);
        setIsRolling(true);
        
        const interval = setInterval(() => {
            setDisplay(Math.floor(Math.random() * 99999999).toString().padStart(8, '0'));
        }, 50);

        try {
            // Delay to simulate tension
            await new Promise(r => setTimeout(r, 2000));
            const result = await drawWinner();
            
            clearInterval(interval);
            setIsRolling(false);

            if (result.success) {
                setDisplay(result.winner.luckyNumber);
                setWinner(result.winner);
            } else {
                setDisplay('--------');
                alert(result.message);
            }
        } catch (error) {
            clearInterval(interval);
            setIsRolling(false);
            alert('Terjadi kesalahan.');
        }
    };

    return (
        <div className="card" style={{ textAlign: 'center' }}>
            <h2>Acak Pemenang</h2>
            <p>Klik tombol di bawah untuk mengundi pemenang dari peserta yang hadir.</p>
            
            <div className="drum" style={{
                fontSize: '3em',
                fontFamily: 'monospace',
                padding: '40px',
                background: '#333',
                color: '#0f0',
                borderRadius: '10px',
                margin: '20px 0',
                letterSpacing: '5px'
            }}>
                {display}
            </div>
            
            {winner && (
                <div className="winner-display" style={{ display: 'block', border: '2px solid #28a745', padding: '20px', margin: '20px 0', borderRadius: '10px' }}>
                    <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#28a745' }}>{winner.name}</div>
                    <div style={{ fontSize: '0.8em', color: '#333' }}>RT {winner.rt} / RW {winner.rw}</div>
                </div>
            )}

            <button 
                onClick={handleDraw} 
                className="btn btn-success" 
                style={{ fontSize: '1.5em', padding: '15px 40px' }}
                disabled={isRolling}
            >
                {isRolling ? 'Mengacak...' : 'UNDI SEKARANG!'}
            </button>
        </div>
    );
}
