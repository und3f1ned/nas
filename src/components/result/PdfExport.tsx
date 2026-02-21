import { useState } from 'react';
import { Button } from '../ui/Button';
import type { NASConfig } from '../../types/config';
import { formatPrice, formatTB, formatTiB } from '../../utils/formatters';

interface PdfExportProps {
  config: NASConfig;
}

const TIER_LABELS: Record<string, string> = {
  basic: 'Базовый',
  mid: 'Средний',
  heavy: 'Производительный',
  server: 'Серверный',
};

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

      doc.setFontSize(18);
      doc.text('NAS Configuration - Xpenology', margin, y);
      y += lineHeight * 2;

      doc.setFontSize(12);
      doc.text('Hardware Requirements:', margin, y);
      y += lineHeight;

      doc.setFontSize(10);
      const specs = [
        `CPU: ${TIER_LABELS[config.cpu.tier]} - ${config.cpu.minCores} cores / ${config.cpu.minThreads} threads (TDP ${config.cpu.tdpRange[0]}-${config.cpu.tdpRange[1]}W)`,
        ...(config.cpu.needsQuickSync ? [`QuickSync: ${config.cpu.minQuickSyncGen}`] : []),
        `RAM: ${config.ram.minGB}-${config.ram.recommendedGB} GB (ECC: ${config.ram.eccRecommendation})`,
        `Drives: ${config.storage.driveCount}x ${config.storage.minDriveSizeTB}TB+ (${config.storage.driveClass}, CMR, TLER)`,
        `RAID: ${config.storage.raidType.toUpperCase()}`,
        ...(config.ssdCache ? [`SSD Cache: ${config.ssdCache.count}x NVMe ${config.ssdCache.minCapacityGB}GB+ (TLC, DRAM, TBW ${config.ssdCache.minTBW}+)`] : []),
        `Network: ${config.network.recommendedSpeed}`,
        `PSU: ${config.psu.recommendedWatts}W 80+ Gold (~${config.estimatedPowerW}W load)`,
        ...(config.ups ? [`UPS: ${config.ups.minVA}VA+`] : []),
        `Case: ${config.formFactor.minBays35}+ bays, ${config.formFactor.maxMbFormFactor.toUpperCase()}`,
      ];

      specs.forEach((line) => {
        doc.text(line, margin + 5, y);
        y += lineHeight;
      });

      y += lineHeight;

      doc.setFontSize(12);
      doc.text('Storage:', margin, y);
      y += lineHeight;

      doc.setFontSize(10);
      doc.text(`RAW: ${formatTB(config.storageBreakdown.rawTB)}`, margin + 5, y);
      y += lineHeight;
      doc.text(`Usable: ${formatTiB(config.storageBreakdown.usableTiB)}`, margin + 5, y);
      y += lineHeight * 2;

      doc.setFontSize(12);
      doc.text('Estimated Price Range:', margin, y);
      y += lineHeight;

      doc.setFontSize(10);
      const prices = [
        `Hardware: ${formatPrice(config.priceEstimate.hardware.min)} - ${formatPrice(config.priceEstimate.hardware.max)}`,
        `Drives: ${formatPrice(config.priceEstimate.drives.min)} - ${formatPrice(config.priceEstimate.drives.max)}`,
        ...(config.priceEstimate.ssdCache ? [`SSD Cache: ${formatPrice(config.priceEstimate.ssdCache.min)} - ${formatPrice(config.priceEstimate.ssdCache.max)}`] : []),
        `Accessories: ${formatPrice(config.priceEstimate.accessories.min)} - ${formatPrice(config.priceEstimate.accessories.max)}`,
        `Assembly: ${formatPrice(config.priceEstimate.assembly)}`,
        `TOTAL: ${formatPrice(config.priceEstimate.totalRange.min)} - ${formatPrice(config.priceEstimate.totalRange.max)}`,
      ];

      prices.forEach((line) => {
        doc.text(line, margin + 5, y);
        y += lineHeight;
      });

      y += lineHeight;

      doc.setFontSize(12);
      doc.text('vs Synology:', margin, y);
      y += lineHeight;

      doc.setFontSize(10);
      doc.text(`Synology ${config.synologyComparison.model.model}: ${formatPrice(config.synologyComparison.synologyTotal)}`, margin + 5, y);
      y += lineHeight;
      doc.text(`Xpenology (est.): ~${formatPrice(config.synologyComparison.estimatedXpenologyTotal)}`, margin + 5, y);
      y += lineHeight;
      if (config.synologyComparison.savings.min > 0) {
        doc.text(`Savings: ${formatPrice(config.synologyComparison.savings.min)} - ${formatPrice(config.synologyComparison.savings.max)}`, margin + 5, y);
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
