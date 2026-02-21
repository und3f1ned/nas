import { Button } from '../ui/Button';

interface PdfExportProps {
  config: unknown;
}

export function PdfExport(_props: PdfExportProps) {
  const handleExport = () => {
    window.print();
  };

  return (
    <Button onClick={handleExport} variant="secondary">
      Скачать PDF
    </Button>
  );
}
