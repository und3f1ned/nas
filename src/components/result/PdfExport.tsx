import { useState } from 'react';
import { Button } from '../ui/Button';

interface PdfExportProps {
  config: unknown; // only needed to trigger re-render, we screenshot the DOM
}

export function PdfExport(_props: PdfExportProps) {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ]);

      // Capture the result content (everything inside <main>)
      const target = document.querySelector('main');
      if (!target) return;

      const canvas = await html2canvas(target as HTMLElement, {
        backgroundColor: '#0f172a', // bg-primary
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      const doc = new jsPDF('p', 'mm', 'a4');

      let heightLeft = imgHeight;
      let position = 0;

      // First page
      doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Additional pages if content is taller than one page
      while (heightLeft > 0) {
        position -= pageHeight;
        doc.addPage();
        doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      doc.save('nas-configuration.pdf');
    } catch (err) {
      console.error('PDF generation failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button onClick={handleExport} variant="secondary" disabled={loading}>
      {loading ? 'Генерация...' : 'Скачать PDF'}
    </Button>
  );
}
