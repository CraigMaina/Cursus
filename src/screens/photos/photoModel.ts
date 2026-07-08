import { diffDays } from '../today/dates';

/**
 * Pure helpers for the progress-photo timeline (PRD 4.1 #7). No React, no Supabase —
 * the day-walk and the canvas resize math live here so they are unit-testable in
 * isolation (see photoModel.test.ts). The screen and its hook compose these.
 *
 * All dates are ISO calendar strings 'YYYY-MM-DD', parsed as UTC midnight so day
 * arithmetic is DST-proof (same convention as ../today/dates).
 */

/** ISO date `n` days after `iso` (n may be negative). UTC-safe. */
export function addDays(iso: string, n: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + n));
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(dt.getUTCDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

export interface PhotoDay {
  /** ISO calendar date for this day of the challenge. */
  date: string;
  /** 1-based day index within the challenge. */
  dayNumber: number;
}

/**
 * The days a progress photo can exist for: from the challenge start through the
 * earlier of today and the final challenge day, newest first (the timeline reads
 * top-down from the most recent day). Returns [] before the challenge has started.
 */
export function buildPhotoDays(
  startDate: string,
  durationDays: number,
  today: string,
): PhotoDay[] {
  const lastDay = addDays(startDate, durationDays - 1);
  const end = today < lastDay ? today : lastDay;
  const span = diffDays(startDate, end); // 0 on the start day, negative if upcoming
  const days: PhotoDay[] = [];
  for (let i = 0; i <= span; i += 1) {
    days.push({ date: addDays(startDate, i), dayNumber: i + 1 });
  }
  days.reverse();
  return days;
}

/**
 * Fit a source image into a square bound on its longest edge, preserving aspect
 * ratio. Never upscales (a smaller image is returned unchanged). Pure integer math,
 * split out from the canvas work so the scaling is directly testable.
 */
export function fitDimensions(
  width: number,
  height: number,
  maxEdge: number,
): { width: number; height: number } {
  const longest = Math.max(width, height);
  if (longest <= maxEdge || longest === 0) return { width, height };
  const scale = maxEdge / longest;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

export const MAX_PHOTO_BYTES = 25 * 1024 * 1024; // reject absurd uploads before decode
export const COMPRESS_MAX_EDGE = 1600;
export const COMPRESS_QUALITY = 0.8;

/** Human-readable guard failure, thrown before any network or canvas work. */
export class PhotoValidationError extends Error {}

/** Reject non-images and unreasonably large files up front. */
export function validatePhotoFile(file: File, maxBytes = MAX_PHOTO_BYTES): void {
  if (!file.type.startsWith('image/')) {
    throw new PhotoValidationError('That file is not an image. Choose a photo.');
  }
  if (file.size > maxBytes) {
    throw new PhotoValidationError('That image is too large. Choose one under 25 MB.');
  }
}

/**
 * Client-side compression: decode the file, scale its longest edge down to
 * `maxEdge`, and re-encode as JPEG at `quality`. Keeps uploads small so the free
 * storage tier lasts (PRD 4.1 #7). Runs entirely in the browser; the raw file never
 * leaves the device un-shrunk. Uses `createImageBitmap` where available with an
 * `HTMLImageElement` fallback.
 */
export async function compressImage(
  file: File,
  opts: { maxEdge?: number; quality?: number } = {},
): Promise<Blob> {
  const maxEdge = opts.maxEdge ?? COMPRESS_MAX_EDGE;
  const quality = opts.quality ?? COMPRESS_QUALITY;
  validatePhotoFile(file);

  const source = await decodeImage(file);
  const { width, height } = fitDimensions(source.width, source.height, maxEdge);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new PhotoValidationError('Could not process the image on this device.');
  ctx.drawImage(source.image as CanvasImageSource, 0, 0, width, height);
  if ('close' in source) source.close();

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, 'image/jpeg', quality);
  });
  if (!blob) throw new PhotoValidationError('Could not compress the image.');
  return blob;
}

type DecodedImage =
  | { image: ImageBitmap; width: number; height: number; close: () => void }
  | { image: HTMLImageElement; width: number; height: number };

async function decodeImage(file: File): Promise<DecodedImage> {
  if (typeof createImageBitmap === 'function') {
    const bitmap = await createImageBitmap(file);
    return {
      image: bitmap,
      width: bitmap.width,
      height: bitmap.height,
      close: () => bitmap.close(),
    };
  }
  const url = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new PhotoValidationError('Could not read that image.'));
      img.src = url;
    });
    return { image, width: image.naturalWidth, height: image.naturalHeight };
  } finally {
    URL.revokeObjectURL(url);
  }
}
