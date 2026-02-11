import { useState } from 'react';
import { Button } from '../ui/Button';
import type { NASConfig } from '../../types/config';
import { formatPrice, formatTB, formatTiB } from '../../utils/formatters';

interface PdfExportProps {
  config: NASConfig;
}

export function PdfExport({ config }: PdfExportProps) {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const { default: jsPDF } = await import('jspdf');
      const doc = new jsPDF();

      let y = 20;
      const margin = 20;
      const lineHeight = 7;

      // Title
      doc.setFontSize(18);
      doc.text('NAS Configuration - Xpenology', margin, y);
      y += lineHeight * 2;

      // Components
      doc.setFontSize(12);
      doc.text('Components:', margin, y);
      y += lineHeight;

      doc.setFontSize(10);
      const components = [
        `Case: ${config.case.name}`,
        `Board/CPU: ${config.motherboard.name}`,
        `RAM: ${config.ramModules}`,
        `Drives: ${config.storageBreakdown.driveCount}x ${config.drives[0]?.name || 'N/A'}`,
        `RAID: ${config.raidType.toUpperCase()}`,
        `PSU: ${config.psuWatts}W`,
        ...(config.ups ? [`UPS: ${config.ups}`] : []),
        ...(config.ssdCache.length > 0 ? [`SSD Cache: ${config.ssdCache.length}x ${config.ssdCache[0].name}`] : []),
      ];

      components.forEach((line) => {
        doc.text(line, margin + 5, y);
        y += lineHeight;
      });

      y += lineHeight;

      // Storage
      doc.setFontSize(12);
      doc.text('Storage:', margin, y);
      y += lineHeight;

      doc.setFontSize(10);
      doc.text(`RAW: ${formatTB(config.storageBreakdown.rawTB)}`, margin + 5, y);
      y += lineHeight;
      doc.text(`Usable: ${formatTiB(config.storageBreakdown.usableTiB)}`, margin + 5, y);
      y += lineHeight * 2;

      // Price
      doc.setFontSize(12);
      doc.text('Price Breakdown:', margin, y);
      y += lineHeight;

      doc.setFontSize(10);
      const prices = [
        `Hardware: ${formatPrice(config.priceBreakdown.hardware)}`,
        `Drives: ${formatPrice(config.priceBreakdown.drives)}`,
        ...(config.priceBreakdown.ssdCache > 0 ? [`SSD Cache: ${formatPrice(config.priceBreakdown.ssdCache)}`] : []),
        `Accessories: ${formatPrice(config.priceBreakdown.accessories)}`,
        `Assembly: ${formatPrice(config.priceBreakdown.assembly)}`,
        `TOTAL: ${formatPrice(config.priceBreakdown.total)}`,
      ];

      prices.forEach((line) => {
        doc.text(line, margin + 5, y);
        y += lineHeight;
      });

      y += lineHeight;

      // Synology comparison
      doc.setFontSize(12);
      doc.text('vs Synology:', margin, y);
      y += lineHeight;

      doc.setFontSize(10);
      doc.text(`Synology ${config.synologyComparison.model.model}: ${formatPrice(config.synologyComparison.synologyTotal)}`, margin + 5, y);
      y += lineHeight;
      doc.text(`Xpenology: ${formatPrice(config.synologyComparison.xpenologyTotal)}`, margin + 5, y);
      y += lineHeight;
      if (config.synologyComparison.savings > 0) {
        doc.text(`Savings: ${formatPrice(config.synologyComparison.savings)}`, margin + 5, y);
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
