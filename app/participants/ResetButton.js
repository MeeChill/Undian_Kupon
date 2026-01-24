'use client';

export default function ResetButton({ onReset }) {
  return (
    <form action={onReset} onSubmit={(e) => { 
        if(!confirm('Yakin ingin menghapus SEMUA data peserta?')) {
            e.preventDefault();
        }
    }}>
        <button type="submit" className="btn btn-danger" style={{ backgroundColor: '#c0392b' }}>Reset Semua Data</button>
    </form>
  );
}
