'use client';
import { useState, useRef } from 'react';
import Modal from '../../components/Modal';

export default function ResetButton({ onReset, filterRT = 'all' }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const formRef = useRef(null);

  const message = filterRT === 'all' 
    ? 'Yakin ingin menghapus SEMUA data peserta? Tindakan ini tidak dapat dibatalkan.' 
    : `Yakin ingin menghapus SEMUA data peserta RT ${filterRT}? Tindakan ini tidak dapat dibatalkan.`;

  const handleConfirm = () => {
      setIsModalOpen(false);
      formRef.current?.requestSubmit();
  };

  return (
    <>
        <form ref={formRef} action={onReset}>
            <input type="hidden" name="rt" value={filterRT} />
            <button 
                type="button" 
                onClick={() => setIsModalOpen(true)}
                className="btn btn-danger" 
                style={{ backgroundColor: '#c0392b' }}
            >
                {filterRT === 'all' ? 'Reset Semua Data' : `Reset Data RT ${filterRT}`}
            </button>
        </form>
        
        <Modal 
            isOpen={isModalOpen}
            title="Konfirmasi Reset Data"
            message={message}
            onConfirm={handleConfirm}
            onCancel={() => setIsModalOpen(false)}
            confirmText="Ya, Hapus Semua"
            isDanger={true}
        />
    </>
  );
}
