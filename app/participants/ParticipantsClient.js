'use client';
import { useState } from 'react';
import Link from 'next/link';
import ResetButton from './ResetButton';
import Modal from '../../components/Modal';

export default function ParticipantsClient({ initialParticipants, resetAction, deleteAction }) {
  const [filterRT, setFilterRT] = useState('all');
  
  // Delete Modal State
  const [deleteId, setDeleteId] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const filteredParticipants = filterRT === 'all' 
    ? initialParticipants 
    : initialParticipants.filter(p => p.rt.toString() === filterRT);

  const confirmDelete = (id) => {
      setDeleteId(id);
      setIsDeleteModalOpen(true);
  };

  const executeDelete = () => {
      if (deleteId) {
          const formData = new FormData();
          formData.append('id', deleteId);
          deleteAction(formData);
          setIsDeleteModalOpen(false);
          setDeleteId(null);
      }
  };

  return (
    <>
      <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <h2>Daftar Peserta</h2>
                
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <select 
                        value={filterRT} 
                        onChange={(e) => setFilterRT(e.target.value)}
                        style={{ padding: '8px', borderRadius: '5px' }}
                    >
                        <option value="all">Semua RT</option>
                        <option value="1">RT 01</option>
                        <option value="2">RT 02</option>
                        <option value="3">RT 03</option>
                        <option value="4">RT 04</option>
                    </select>
                    
                    {filterRT !== 'all' && (
                        <Link 
                            href={`/participants/print?rt=${filterRT}`} 
                            target="_blank"
                            className="btn"
                            style={{ backgroundColor: '#27ae60', textDecoration: 'none' }}
                        >
                            🖨️ Cetak Kupon RT {filterRT}
                        </Link>
                    )}

                    <ResetButton onReset={resetAction} filterRT={filterRT} />
                </div>
            </div>
            
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '15px' }}>
                    <thead>
                        <tr style={{ background: '#f8f9fa', textAlign: 'left' }}>
                            <th style={{ padding: '10px' }}>Nama</th>
                            <th style={{ padding: '10px' }}>RT</th>
                            <th style={{ padding: '10px' }}>Nomor Undian</th>
                            <th style={{ padding: '10px' }}>Status</th>
                            <th style={{ padding: '10px' }}>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredParticipants.length > 0 ? (
                            filteredParticipants.map(p => (
                            <tr key={p.id} style={{ borderBottom: '1px solid #eee' }}>
                                <td style={{ padding: '10px' }}>{p.name}</td>
                                <td style={{ padding: '10px' }}>{p.rt}</td>
                                <td style={{ padding: '10px', fontFamily: 'monospace', fontWeight: 'bold' }}>{p.luckyNumber}</td>
                                <td style={{ padding: '10px' }}>
                                    {p.status === 'present' ? (
                                        <span style={{ color: 'green', fontWeight: 'bold' }}>Hadir</span>
                                    ) : (
                                        <span style={{ color: 'grey' }}>Terdaftar</span>
                                    )}
                                    {p.isWinner && <span style={{ color: 'gold' }}> 🏆</span>}
                                </td>
                                <td style={{ padding: '10px' }}>
                                    <Link href={`/coupon/${p.id}`} className="btn" style={{ padding: '5px 10px', fontSize: '0.8em', marginRight: '5px', textDecoration: 'none' }}>Kupon</Link>
                                    <button 
                                        onClick={() => confirmDelete(p.id)}
                                        className="btn btn-danger" 
                                        style={{ padding: '5px 10px', fontSize: '0.8em' }}
                                    >
                                        Hapus
                                    </button>
                                </td>
                            </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: '#888' }}>
                                    Tidak ada data peserta untuk RT ini.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
      </div>
      
      <Modal 
        isOpen={isDeleteModalOpen}
        title="Konfirmasi Hapus Peserta"
        message="Yakin ingin menghapus peserta ini? Tindakan ini tidak dapat dibatalkan."
        onConfirm={executeDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
        confirmText="Ya, Hapus"
        isDanger={true}
      />
    </>
  );
}
