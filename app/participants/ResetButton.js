'use client';
import { useState, useRef } from 'react';
import Modal from '../../components/Modal';

export default function ResetButton({ onReset, filterRT = 'all', filterStatus = 'all', filterWinner = 'all' }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const formRef = useRef(null);

  let filterDesc = [];
  if (filterRT !== 'all') filterDesc.push(`RT ${filterRT}`);
  if (filterStatus === 'present') filterDesc.push('Hadir');
  if (filterStatus === 'registered') filterDesc.push('Belum Hadir');
  if (filterWinner === 'yes') filterDesc.push('Pemenang');
  if (filterWinner === 'no') filterDesc.push('Belum Menang');

  const filterString = filterDesc.length > 0 ? filterDesc.join(', ') : 'Semua Data';

  const message = filterDesc.length === 0
    ? 'Yakin ingin me-reset status kehadiran dan status pemenang SEMUA data peserta?' 
    : `Yakin ingin me-reset status peserta dengan filter (${filterString})?`;

  const handleConfirm = () => {
      setIsModalOpen(false);
      formRef.current?.requestSubmit();
  };

  return (
    <>
        <form ref={formRef} action={onReset}>
            <input type="hidden" name="rt" value={filterRT} />
            <input type="hidden" name="status" value={filterStatus} />
            <input type="hidden" name="winner" value={filterWinner} />
            <button 
                type="button" 
                onClick={() => setIsModalOpen(true)}
                className="btn btn-danger" 
                style={{ backgroundColor: '#c0392b' }}
            >
                {filterDesc.length === 0 ? 'Reset Semua Status' : `Reset Status (${filterString})`}
            </button>
        </form>
        
        <Modal 
            isOpen={isModalOpen}
            title="Konfirmasi Reset Data"
            message={message}
            onConfirm={handleConfirm}
            onCancel={() => setIsModalOpen(false)}
            confirmText="Ya, Reset Status"
            isDanger={false}
        />
    </>
  );
}
