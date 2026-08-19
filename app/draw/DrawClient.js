'use client';
import { useState } from 'react';
import { drawWinner } from './actions';
import Modal from '../../components/Modal';

export default function DrawClient() {
    const [display, setDisplay] = useState('00000000');
    const [winner, setWinner] = useState(null);
    const [winnerData, setWinnerData] = useState(null);
    const [isRolling, setIsRolling] = useState(false);
    const [isRevealing, setIsRevealing] = useState(false);
    const [targetNumber, setTargetNumber] = useState('00000000');
    const [revealedCount, setRevealedCount] = useState(0);
    
    const [category, setCategory] = useState('rw');
    const [selectedRT, setSelectedRT] = useState('1');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [confirmMessage, setConfirmMessage] = useState('');

    const initiateDraw = () => {
        if (isRolling || isRevealing) return;
        
        const message = category === 'rw' 
            ? 'Yakin ingin mengundi GRAND PRIZE?' 
            : `Yakin ingin mengundi DOORPRIZE untuk RT ${selectedRT}?`;
            
        setConfirmMessage(message);
        setIsModalOpen(true);
    };

    const handleConfirmDraw = async () => {
        setIsModalOpen(false);
        setWinner(null);
        setWinnerData(null);
        setTargetNumber('00000000');
        setRevealedCount(0);
        setDisplay('00000000');

        // Langsung mulai rolling untuk efek visual
        setIsRolling(true);
        const rollingInterval = setInterval(() => {
            setDisplay(Math.floor(Math.random() * 99999999).toString().padStart(8, '0'));
        }, 50);

        try {
            const result = await drawWinner(category, selectedRT);

            if (!result.success) {
                clearInterval(rollingInterval);
                setIsRolling(false);
                setDisplay('--------');
                alert(result.message);
                return;
            }

            const finalNumber = String(result.winner.luckyNumber).padStart(8, '0');
            setTargetNumber(finalNumber);
            setWinnerData(result.winner);

            // Setelah fetch selesai, lanjut rolling selama 10 detik
            setTimeout(() => {
                clearInterval(rollingInterval);

                // Reveal 2 digit pertama, sisanya jadi 0
                const revealed = finalNumber.substring(0, 2);
                const masked = finalNumber.substring(2).replace(/\d/g, '0');
                setDisplay(revealed + masked);
                setRevealedCount(2);
                setIsRolling(false);
                setIsRevealing(true);
            }, 5000);

        } catch (error) {
            clearInterval(rollingInterval);
            setIsRolling(false);
            alert('Terjadi kesalahan.');
        }
    };

    const handleRevealNext = () => {
        if (!isRevealing || !winnerData || revealedCount >= 8) return;

        const fixedPart = targetNumber.substring(0, revealedCount);
        const rollingLength = 8 - revealedCount;

        // Mulai rolling untuk sisa angka yang belum ter-reveal
        setIsRevealing(false);
        setIsRolling(true);

        const subInterval = setInterval(() => {
            const randomPart = Math.floor(Math.random() * Math.pow(10, rollingLength))
                .toString()
                .padStart(rollingLength, '0');
            setDisplay(fixedPart + randomPart);
        }, 50);

        // Rolling 5 detik, lalu reveal 2 digit berikutnya
        setTimeout(() => {
            clearInterval(subInterval);

            const nextCount = revealedCount + 2;
            const newFixed = targetNumber.substring(0, nextCount);
            const newRollingLength = 8 - nextCount;

            let newDisplay = newFixed;
            if (newRollingLength > 0) {
                newDisplay += targetNumber.substring(nextCount).replace(/\d/g, '0');
            }

            setDisplay(newDisplay);
            setRevealedCount(nextCount);
            setIsRolling(false);

            if (nextCount >= 8) {
                // Semua digit sudah ter-reveal
                setDisplay(targetNumber);
                setIsRevealing(false);
                setWinner(winnerData);
            } else {
                // Masih ada sisa, tampilkan tombol reveal lagi
                setIsRevealing(true);
            }
        }, 5000);
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
                            disabled={isRolling || isRevealing}
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
                            disabled={isRolling || isRevealing}
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
                            disabled={isRolling || isRevealing}
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

            <div className="draw-actions">
                <button 
                    onClick={initiateDraw} 
                    className="btn btn-draw" 
                    disabled={isRolling || isRevealing}
                >
                    {isRolling ? '🎰 Mengacak...' : 'UNDI SEKARANG!'}
                </button>

                {isRevealing && (
                    <button 
                        onClick={handleRevealNext}
                        className="btn btn-secondary"
                    >
                        Tampilkan 2 digit berikutnya
                    </button>
                )}
            </div>

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
                    max-width: 900px;
                    margin: 2rem auto;
                    padding: 2.5rem 2rem;
                    min-height: 70vh;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                }
                .draw-title {
                    color: var(--primary);
                    font-size: 2.6rem;
                    margin-bottom: 2rem;
                }
                .category-selector {
                    background: white;
                    padding: 1.75rem;
                    border-radius: var(--radius-lg);
                    box-shadow: var(--shadow-sm);
                    margin-bottom: 2rem;
                    border: 1px solid var(--border);
                    width: 100%;
                    max-width: 700px;
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
                    opacity: 1;
                }
                .radio-label:hover:not(:has(input:disabled)) {
                    border-color: var(--primary);
                    background: #f0f9ff;
                }
                .radio-label.active {
                    border-color: var(--primary);
                    background: #e0e7ff;
                    color: var(--primary);
                }
                .radio-label:has(input:disabled) {
                    opacity: 0.6;
                    cursor: not-allowed;
                }
                .radio-label input {
                    margin-right: 0.5rem;
                    width: auto;
                }
                .rt-selector {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                }
                .rt-selector select {
                    width: auto;
                    padding: 0.5rem 2rem 0.5rem 1rem;
                    font-weight: 600;
                    border: 2px solid var(--border);
                }
                .drum-display {
                    background: #1e293b;
                    padding: 2.5rem 3rem;
                    border-radius: var(--radius-lg);
                    margin: 1rem auto 2rem;
                    width: 100%;
                    max-width: 700px;
                    box-shadow: inset 0 2px 10px rgba(0,0,0,0.5);
                    border: 4px solid #334155;
                }
                .drum-numbers {
                    font-family: 'Courier New', monospace;
                    font-size: 4.2rem;
                    font-weight: bold;
                    color: #4ade80;
                    text-shadow: 0 0 10px rgba(74, 222, 128, 0.5);
                    letter-spacing: 0.7rem;
                }
                .winner-card {
                    animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    background: #f0fdf4;
                    border: 2px solid #22c55e;
                    padding: 2rem 2.5rem;
                    border-radius: var(--radius-lg);
                    margin-bottom: 2rem;
                    width: 100%;
                    max-width: 700px;
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
                    font-size: 1.3rem;
                    padding: 1.1rem 3.2rem;
                    background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%);
                    box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.3);
                }
                .btn-draw:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 10px 15px -3px rgba(79, 70, 229, 0.4);
                }
                .btn-draw:disabled {
                    background: #94a3b8;
                    transform: none;
                    cursor: not-allowed;
                }
                .btn-secondary {
                    background: #0f766e;
                    color: white;
                }
                .draw-actions {
                    display: flex;
                    justify-content: center;
                    gap: 1rem;
                    flex-wrap: wrap;
                    width: 100%;
                }
                @keyframes popIn {
                    from { transform: scale(0.8); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
                @media (max-width: 768px) {
                    .draw-card { padding: 1.5rem 1rem; min-height: auto; }
                    .draw-title { font-size: 2rem; }
                    .drum-numbers { font-size: 2.3rem; letter-spacing: 0.3rem; }
                    .radio-group { flex-direction: column; }
                    .radio-label { width: 100%; justify-content: center; }
                }
            `}</style>
        </div>
    );
}