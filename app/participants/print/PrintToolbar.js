'use client';

import { useState } from 'react';

export default function PrintToolbar({ filename = 'kupon.pdf' }) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleExportPdf = async () => {
    // Dynamically import html2pdf to avoid SSR issues
    const html2pdf = (await import('html2pdf.js')).default;
    
    const element = document.getElementById('coupon-content');
    if (!element) return;

    setIsGenerating(true);

    const opt = {
      margin:       10, // mm
      filename:     filename,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    try {
      await html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error('PDF generation failed:', error);
      alert('Gagal membuat PDF. Silakan coba lagi atau gunakan tombol Print biasa.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="no-print" style={{ textAlign: 'center', marginBottom: '20px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
      <button 
        onClick={handlePrint} 
        className="btn"
        style={{ 
          padding: '10px 20px', 
          fontSize: '1.2em', 
          cursor: 'pointer',
          backgroundColor: '#3498db',
          color: 'white',
          border: 'none',
          borderRadius: '5px'
        }}
      >
        🖨️ Print (Browser)
      </button>

      <button 
        onClick={handleExportPdf} 
        disabled={isGenerating}
        className="btn"
        style={{ 
          padding: '10px 20px', 
          fontSize: '1.2em', 
          cursor: 'pointer',
          backgroundColor: isGenerating ? '#95a5a6' : '#e74c3c',
          color: 'white',
          border: 'none',
          borderRadius: '5px'
        }}
      >
        {isGenerating ? '⏳ Memproses...' : '📄 Export PDF'}
      </button>
    </div>
  );
}
