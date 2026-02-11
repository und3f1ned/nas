const BITRATE_TABLE: Record<string, Record<string, number>> = {
  '1080p': { h264: 6, h265: 3, h265plus: 1.8 },
  '2k': { h264: 8, h265: 4, h265plus: 2.4 },
  '4k': { h264: 16, h265: 8, h265plus: 4.8 },
};

export interface SurveillanceCalcParams {
  cameras: number;
  resolution: '1080p' | '2k' | '4k';
  fps: number;
  codec: 'h264' | 'h265' | 'h265plus';
  days: number;
  motionOnly: boolean;
}

export function calcSurveillanceStorageTB(params: SurveillanceCalcParams): number {
  const baseBitrate = BITRATE_TABLE[params.resolution][params.codec];
  const fpsAdjusted = baseBitrate * (params.fps / 25);
  const motionMultiplier = params.motionOnly ? 0.4 : 1.0;

  // GB = cameras × bitrate(Mbps) × 3600 × 24 × days / 8 / 1024
  const storageGB =
    params.cameras * fpsAdjusted * motionMultiplier * 3600 * 24 * params.days / 8 / 1024;

  return (storageGB * 1.15) / 1024; // Convert GB to TB, +15% overhead
}

export function calcSurveillanceBandwidthMbps(params: SurveillanceCalcParams): number {
  const baseBitrate = BITRATE_TABLE[params.resolution][params.codec];
  const fpsAdjusted = baseBitrate * (params.fps / 25);
  return params.cameras * fpsAdjusted;
}
