import { useEffect, useId, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Icon } from '@/components/primitives';
import { cx, PlasterTexture } from '@/theme';
import { formatLongDate } from '../today/dates';
import type { PhotoRow } from './usePhotos';

/**
 * One day of the progress-photo timeline (PRD 4.1 #7). Shows the day's thumbnail on a
 * plaster tessera, or an empty framed tile when no photo exists yet. A labelled file
 * input lets the owner add or replace that day's photo. Signed URLs are fetched
 * lazily — only once the tile scrolls into view — and never logged or placed in a
 * query string. Reads only through the hook's `getSignedUrl` (DAL); no Supabase here.
 */
export function PhotoTile({
  row,
  uploading,
  onPick,
  getSignedUrl,
}: {
  row: PhotoRow;
  uploading: boolean;
  onPick: (date: string, file: File) => void;
  getSignedUrl: (path: string) => Promise<string>;
}) {
  const reduce = useReducedMotion();
  const inputId = useId();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [inView, setInView] = useState(false);

  // Lazy-load: defer the signed-URL request until the tile is near the viewport.
  useEffect(() => {
    const node = containerRef.current;
    if (!node || inView) return;
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true);
          io.disconnect();
        }
      },
      { rootMargin: '200px' },
    );
    io.observe(node);
    return () => io.disconnect();
  }, [inView]);

  const path = row.photoPath;
  const urlQuery = useQuery({
    // Keyed by path only, not logged; the path is an opaque per-user storage key.
    queryKey: ['photo-url', path],
    queryFn: () => getSignedUrl(path!),
    enabled: inView && Boolean(path),
    staleTime: 5 * 60_000, // signed URLs are short-lived; refetch after a few minutes
    refetchOnWindowFocus: false,
  });

  const dateLabel = formatLongDate(row.date);
  const hasPhoto = Boolean(path);
  const altText = hasPhoto
    ? `Progress photo for day ${row.dayNumber}, ${dateLabel}`
    : `No progress photo for day ${row.dayNumber} yet`;

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) onPick(row.date, file);
    e.target.value = ''; // allow re-picking the same file
  }

  return (
    <motion.figure
      ref={containerRef}
      className="group relative"
      initial={reduce ? undefined : { opacity: 0, y: 8 }}
      whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -40px 0px' }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <div
        className={cx(
          'relative aspect-[4/5] overflow-hidden rounded-tessera bg-plaster-deep',
          'shadow-[inset_0_0_0_1px] shadow-ink/15',
        )}
      >
        <PlasterTexture variant="card" />

        {hasPhoto && urlQuery.data ? (
          <img
            src={urlQuery.data}
            alt={altText}
            loading="lazy"
            decoding="async"
            className="relative h-full w-full object-cover"
          />
        ) : (
          <div
            className="relative flex h-full w-full flex-col items-center justify-center gap-2 text-ink/35"
            role="img"
            aria-label={altText}
          >
            {hasPhoto && (urlQuery.isLoading || urlQuery.isFetching) ? (
              <span className="font-serif text-xs uppercase tracking-[0.16em] text-ink/45">
                Uncovering
              </span>
            ) : (
              <>
                <Icon slot="photo" size="lg" decorative />
                <span className="font-sans text-[0.62rem] uppercase tracking-[0.16em] text-ink/40">
                  No photo
                </span>
              </>
            )}
          </div>
        )}

        {uploading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-ink/40">
            <span className="font-sans text-[0.62rem] uppercase tracking-[0.18em] text-plaster">
              Setting the stone
            </span>
          </div>
        ) : null}
      </div>

      <figcaption className="mt-2 flex items-baseline justify-between gap-2">
        <span className="font-display text-lg text-ink">Day {row.dayNumber}</span>
        <label
          htmlFor={inputId}
          className={cx(
            'cursor-pointer font-sans text-[0.62rem] uppercase tracking-[0.16em]',
            'text-pompeian-red underline-offset-4 hover:underline',
            'focus-within:underline',
            uploading && 'pointer-events-none opacity-50',
          )}
        >
          {hasPhoto ? 'Replace' : 'Add photo'}
        </label>
        <input
          id={inputId}
          type="file"
          accept="image/*"
          className="sr-only"
          disabled={uploading}
          onChange={handleChange}
          aria-label={`${hasPhoto ? 'Replace' : 'Add'} progress photo for day ${row.dayNumber}, ${dateLabel}`}
        />
      </figcaption>
    </motion.figure>
  );
}
