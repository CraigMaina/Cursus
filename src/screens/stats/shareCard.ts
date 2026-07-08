import { readChartPalette } from './chartTokens';

/**
 * Shareable progress card (PRD 4.2). Renders a square Pompeii-styled PNG of a challenge's
 * standing to a canvas, then shares it via the Web Share API where available, or downloads
 * it. Colors come from the resolved CSS token palette (readChartPalette) - no hex literals
 * here, per the aesthetic law. Fonts are the app's own, awaited via document.fonts.ready.
 */
export interface ShareCardData {
  appName: string;
  challengeName: string;
  elapsedDays: number;
  strictness: string;
  currentStreak: number;
  overallPct: number;
}

const SIZE = 1080;

function fitText(ctx: CanvasRenderingContext2D, text: string, max: number, start: number, font: (px: number) => string): number {
  let px = start;
  ctx.font = font(px);
  while (ctx.measureText(text).width > max && px > 24) {
    px -= 4;
    ctx.font = font(px);
  }
  return px;
}

export async function renderShareCardBlob(d: ShareCardData): Promise<Blob> {
  const p = readChartPalette();
  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas unsupported');

  if (typeof document !== 'undefined' && document.fonts?.ready) {
    try {
      await document.fonts.ready;
    } catch {
      /* fall back to system fonts */
    }
  }

  const display = (px: number) => `${px}px "Cinzel", Georgia, serif`;
  const sans = (px: number) => `${px}px "Hanken Grotesk", system-ui, sans-serif`;
  const serif = (px: number) => `${px}px "EB Garamond", Georgia, serif`;

  // Ground + aged frame.
  ctx.fillStyle = p.plaster;
  ctx.fillRect(0, 0, SIZE, SIZE);
  ctx.strokeStyle = p.ochre;
  ctx.lineWidth = 4;
  ctx.strokeRect(56, 56, SIZE - 112, SIZE - 112);
  ctx.strokeStyle = p.plasterDeep;
  ctx.lineWidth = 2;
  ctx.strokeRect(72, 72, SIZE - 144, SIZE - 144);

  ctx.textAlign = 'center';

  // Wordmark.
  ctx.fillStyle = p.red;
  ctx.font = sans(30);
  ctx.fillText(spaced(d.appName.toUpperCase()), SIZE / 2, 180);

  // Challenge name (shrinks to fit).
  ctx.fillStyle = p.ink;
  const namePx = fitText(ctx, d.challengeName, SIZE - 260, 92, display);
  ctx.font = display(namePx);
  ctx.fillText(d.challengeName, SIZE / 2, 340);

  // Sub line.
  ctx.fillStyle = p.ink;
  ctx.globalAlpha = 0.6;
  ctx.font = sans(28);
  ctx.fillText(
    spaced(`DAY ${d.elapsedDays}  /  ${d.strictness.toUpperCase()}`),
    SIZE / 2,
    400,
  );
  ctx.globalAlpha = 1;

  // Medallion with the current streak.
  const cx = SIZE / 2;
  const cy = 640;
  const r = 150;
  ctx.strokeStyle = p.verdigris;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, r - 16, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = p.ink;
  ctx.font = display(140);
  ctx.textBaseline = 'middle';
  ctx.fillText(String(d.currentStreak), cx, cy + 6);
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = p.ink;
  ctx.globalAlpha = 0.6;
  ctx.font = sans(24);
  ctx.fillText(spaced('DAY STREAK'), cx, cy + r + 56);
  ctx.globalAlpha = 1;

  // Completion figure.
  ctx.fillStyle = p.ochre;
  ctx.font = serif(44);
  ctx.fillText(`${d.overallPct}% of the rules kept`, SIZE / 2, 940);

  // Footer.
  ctx.fillStyle = p.ink;
  ctx.globalAlpha = 0.45;
  ctx.font = serif(28);
  ctx.fillText('The course. The path.', SIZE / 2, 1000);
  ctx.globalAlpha = 1;

  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Export failed'))), 'image/png'),
  );
}

function spaced(s: string): string {
  return s.split('').join(' '); // thin spaces for inscriptional letter-spacing
}

/** Share the card via the Web Share API where possible, else download it. */
export async function shareOrDownloadCard(blob: Blob, filename: string): Promise<'shared' | 'downloaded'> {
  const file = new File([blob], filename, { type: 'image/png' });
  const nav = navigator as Navigator & { canShare?: (d: { files: File[] }) => boolean };
  if (nav.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'Cursus' });
      return 'shared';
    } catch {
      /* user cancelled or share failed; fall through to download */
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  return 'downloaded';
}
