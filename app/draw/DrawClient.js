'use client';
import { useState } from 'react';
import { drawWinner } from './actions';

export default function DrawClient() {
    const [display, setDisplay] = useState('00000000');
    const [winner, setWinner] = useState(null);
    const [isRolling, setIsRolling] = useState(false);
    
    // New states for category selection
    const [category, setCategory] = useState('rw'); // 'rw' or 'rt'
    const [selectedRT, setSelectedRT] = useState('1');

    const handleDraw = async () => {
        if (isRolling) return;
        
        setWinner(null);
        setIsRolling(true);
        
        // Start rapid shuffling animation
        const interval = setInterval(() => {
            setDisplay(Math.floor(Math.random() * 99999999).toString().padStart(8, '0'));
        }, 50);

        try {
            // Fetch winner from server immediately
            const result = await drawWinner(category, selectedRT);
            
            // Stop shuffling
            clearInterval(interval);

            if (!result.success) {
                setIsRolling(false);
                setDisplay('--------');
                alert(result.message);
                return;
            }

            // Start 5-second reveal animation
            // Reveal 2 digits at a time
            const targetNumber = result.winner.luckyNumber; // e.g. "01040015"
            let revealedCount = 0;
            
            // Total time = 5000ms. We have 4 pairs (8 digits).
            // Each pair reveal takes ~1250ms
            
            // Helper to generate mixed string: "01" + random(6) -> "0104" + random(4) -> ...
            const revealInterval = setInterval(() => {
                revealedCount += 2;
                
                // Get the revealed part
                const revealedPart = targetNumber.substring(0, revealedCount);
                
                // Generate random part for the rest
                const remainingLength = 8 - revealedCount;
                let randomPart = '';
                if (remainingLength > 0) {
                     randomPart = Math.floor(Math.random() * Math.pow(10, remainingLength))
                        .toString()
                        .padStart(remainingLength, '0');
                }
                
                setDisplay(revealedPart + randomPart);

                // If fully revealed
                if (revealedCount >= 8) {
                    clearInterval(revealInterval);
                    clearInterval(shuffleInterval); // Ensure randomizer is stopped
                    setIsRolling(false);
                    setWinner(result.winner);
                }
            }, 5000); // 5000ms / 4 steps = 1250ms per step

            // Keep the unrevealed part shuffling rapidly
            const shuffleInterval = setInterval(() => {
                if (revealedCount >= 8) return;
                
                const revealedPart = targetNumber.substring(0, revealedCount);
                const remainingLength = 8 - revealedCount;
                
                if (remainingLength > 0) {
                     const randomPart = Math.floor(Math.random() * Math.pow(10, remainingLength))
                        .toString()
                        .padStart(remainingLength, '0');
                     setDisplay(revealedPart + randomPart);
                }
            }, 50);

        } catch (error) {
            clearInterval(interval);
            setIsRolling(false);
            alert('Terjadi kesalahan.');
        }
    };

    return (
        <div className="card" style={{ textAlign: 'center' }}>
            <h2>Acak Pemenang</h2>
            <p>Pilih kategori undian di bawah ini:</p>
            
            <div style={{ margin: '20px 0', padding: '15px', background: '#f8f9fa', borderRadius: '10px' }}>
                <div style={{ marginBottom: '15px' }}>
                    <label style={{ marginRight: '15px', cursor: 'pointer' }}>
                        <input 
                            type="radio" 
                            name="category" 
                            value="rw" 
                            checked={category === 'rw'} 
                            onChange={(e) => setCategory(e.target.value)}
                        />
                        <span style={{ marginLeft: '5px', fontWeight: 'bold' }}>Grand Prize (Semua RW)</span>
                    </label>
                    <label style={{ cursor: 'pointer' }}>
                        <input 
                            type="radio" 
                            name="category" 
                            value="rt" 
                            checked={category === 'rt'} 
                            onChange={(e) => setCategory(e.target.value)}
                        />
                        <span style={{ marginLeft: '5px', fontWeight: 'bold' }}>Doorprize per RT</span>
                    </label>
                </div>

                {category === 'rt' && (
                    <div style={{ animation: 'fadeIn 0.3s' }}>
                        <label>Pilih RT: </label>
                        <select 
                            value={selectedRT} 
                            onChange={(e) => setSelectedRT(e.target.value)}
                            style={{ padding: '5px', marginLeft: '10px', borderRadius: '5px' }}
                        >
                            <option value="1">RT 01</option>
                            <option value="2">RT 02</option>
                            <option value="3">RT 03</option>
                            <option value="4">RT 04</option>
                        </select>
                    </div>
                )}
            </div>
            
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
