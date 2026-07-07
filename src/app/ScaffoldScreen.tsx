import { APP_NAME, APP_TAGLINE } from '@/config/app';

/**
 * Temporary placeholder used by the routing map until the Frontend agent delivers
 * the real screen for each route. It intentionally exercises the design tokens
 * (Cinzel display, plaster ground, meander rule) so a runnable `main` visibly
 * proves the token layer works. Delete usages as real screens land.
 */
export function ScaffoldScreen({ title, phase }: { title: string; phase: string }) {
  return (
    <main className="mx-auto flex min-h-full max-w-3xl flex-col justify-center px-6 py-16">
      <p className="font-sans text-sm uppercase tracking-[0.3em] text-ochre">{APP_NAME}</p>
      <h1 className="mt-3 font-display text-5xl text-pompeian-red">{title}</h1>
      <div className="my-6 h-px w-40 bg-ink/30" aria-hidden />
      <p className="max-w-prose font-serif text-lg text-ink/80">{APP_TAGLINE}</p>
      <p className="mt-4 font-sans text-sm text-ink/60">
        Scaffold placeholder. Real screen arrives in {phase}.
      </p>
    </main>
  );
}
