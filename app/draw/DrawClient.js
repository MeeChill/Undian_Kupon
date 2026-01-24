'use client';
import { useState } from 'react';
import { drawWinner } from './actions';
import Modal from '../../components/Modal';

export default function DrawClient() {
    const [display, setDisplay] = useState('00000000');
    const [winner, setWinner] = useState(null);
    const [isRolling, setIsRolling] = useState(false);
    
    // New states for category selection
    const [category, setCategory] = useState('rw'); // 'rw' or 'rt'
    const [selectedRT, setSelectedRT] = useState('1');

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [confirmMessage, setConfirmMessage] = useState('');

    const initiateDraw = () => {
        if (isRolling) return;
        
        const message = category === 'rw' 
            ? 'Yakin ingin mengundi GRAND PRIZE?' 
            : `Yakin ingin mengundi DOORPRIZE untuk RT ${selectedRT}?`;
            
        setConfirmMessage(message);
        setIsModalOpen(true);
    };

    const handleConfirmDraw = async () => {
        setIsModalOpen(false);
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
            
            const revealInterval = setInterval(() => {
                revealedCount += 2;
                
                const revealedPart = targetNumber.substring(0, revealedCount);
                const remainingLength = 8 - revealedCount;
                let randomPart = '';
                if (remainingLength > 0) {
                     randomPart = Math.floor(Math.random() * Math.pow(10, remainingLength))
                        .toString()
                        .padStart(remainingLength, '0');
                }
                
                setDisplay(revealedPart + randomPart);

                if (revealedCount >= 8) {
                    clearInterval(revealInterval);
                    clearInterval(shuffleInterval);
                    setIsRolling(false);
                    setWinner(result.winner);
                }
            }, 1250); 

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
        <div className="card draw-card">
            <h2 className="draw-title">🎲 Acak Pemenang</h2>
            
            <div className="category-selector">
                <div className="radio-group">
                    <label className={`radio-label ${category === 'rw' ? 'active' : ''}`}>
                        <input 
                            type="radio" 
                            name="category" 
                            value="rw" 
                            checked={category === 'rw'} 
                            onChange={(e) => setCategory(e.target.value)}
                        />
                        <span>🏆 Grand Prize (Semua RW)</span>
                    </label>
                    <label className={`radio-label ${category === 'rt' ? 'active' : ''}`}>
                        <input 
                            type="radio" 
                            name="category" 
                            value="rt" 
                            checked={category === 'rt'} 
                            onChange={(e) => setCategory(e.target.value)}
                        />
                        <span>🎁 Doorprize per RT</span>
                    </label>
                </div>

                {category === 'rt' && (
                    <div className="rt-selector">
                        <label>Pilih RT: </label>
                        <select 
                            value={selectedRT} 
                            onChange={(e) => setSelectedRT(e.target.value)}
                        >
                            <option value="1">RT 01</option>
                            <option value="2">RT 02</option>
                            <option value="3">RT 03</option>
                            <option value="4">RT 04</option>
                        </select>
                    </div>
                )}
            </div>
            
            <div className="drum-display">
                <div className="drum-numbers">{display}</div>
            </div>
            
            {winner && (
                <div className="winner-card">
                    <div className="winner-badge">🎉 PEMENANG 🎉</div>
                    <div className="winner-name">{winner.name}</div>
                    <div className="winner-details">RT 0{winner.rt} / RW 0{winner.rw}</div>
                </div>
            )}

            <button 
                onClick={initiateDraw} 
                className="btn btn-draw" 
                disabled={isRolling}
            >
                {isRolling ? '🎰 Mengacak...' : 'UNDI SEKARANG!'}
            </button>

            <Modal 
                isOpen={isModalOpen}
                title="Konfirmasi Undian"
                message={confirmMessage}
                onConfirm={handleConfirmDraw}
                onCancel={() => setIsModalOpen(false)}
                confirmText="Ya, Mulai Undian!"
            />

            <style jsx>{`
                .draw-card {
                    text-align: center;
                    background: linear-gradient(to bottom, #ffffff, #f8fafc);
                    border: 1px solid #e2e8f0;
                }
                .draw-title {
                    color: var(--primary);
                    font-size: 2rem;
                    margin-bottom: 2rem;
                }
                .category-selector {
                    background: white;
                    padding: 1.5rem;
                    border-radius: var(--radius-lg);
                    box-shadow: var(--shadow-sm);
                    margin-bottom: 2rem;
                    border: 1px solid var(--border);
                }
                .radio-group {
                    display: flex;
                    justify-content: center;
                    gap: 1rem;
                    flex-wrap: wrap;
                    margin-bottom: 1rem;
                }
                .radio-label {
                    display: flex;
                    align-items: center;
                    padding: 0.75rem 1.25rem;
                    border: 2px solid var(--border);
                    border-radius: var(--radius-md);
                    cursor: pointer;
                    transition: all 0.2s;
                    font-weight: 600;
                }
                .radio-label:hover {
                    border-color: var(--primary);
                    background: #f0f9ff;
                }
                .radio-label.active {
                    border-color: var(--primary);
                    background: #e0e7ff;
                    color: var(--primary);
                }
                .radio-label input {
                    margin-right: 0.5rem;
                    width: auto;
                }
                .rt-selector select {
                    width: auto;
                    padding: 0.5rem 2rem 0.5rem 1rem;
                    font-weight: 600;
                    border: 2px solid var(--border);
                }
                .drum-display {
                    background: #1e293b;
                    padding: 2rem;
                    border-radius: var(--radius-lg);
                    margin: 2rem auto;
                    max-width: 600px;
                    box-shadow: inset 0 2px 10px rgba(0,0,0,0.5);
                    border: 4px solid #334155;
                }
                .drum-numbers {
                    font-family: 'Courier New', monospace;
                    font-size: 3.5rem;
                    font-weight: bold;
                    color: #4ade80;
                    text-shadow: 0 0 10px rgba(74, 222, 128, 0.5);
                    letter-spacing: 0.5rem;
                }
                .winner-card {
                    animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    background: #f0fdf4;
                    border: 2px solid #22c55e;
                    padding: 2rem;
                    border-radius: var(--radius-lg);
                    margin-bottom: 2rem;
                }
                .winner-badge {
                    color: #166534;
                    font-weight: bold;
                    letter-spacing: 2px;
                    margin-bottom: 0.5rem;
                }
                .winner-name {
                    font-size: 2.5rem;
                    font-weight: 800;
                    color: #15803d;
                    margin-bottom: 0.5rem;
                }
                .winner-details {
                    font-size: 1.2rem;
                    color: #166534;
                }
                .btn-draw {
                    font-size: 1.25rem;
                    padding: 1rem 3rem;
                    background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%);
                    box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.3);
                }
                .btn-draw:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 10px 15px -3px rgba(79, 70, 229, 0.4);
                }
                .btn-draw:disabled {
                    background: #94a3b8;
                    transform: none;
                }
                @keyframes popIn {
                    from { transform: scale(0.8); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
                @media (max-width: 768px) {
                    .drum-numbers { font-size: 2rem; letter-spacing: 0.2rem; }
                    .radio-group { flex-direction: column; }
                    .radio-label { width: 100%; justify-content: center; }
                }
            `}</style>
        </div>
    );
}
