/**
 * Theme layer barrel (Frontend-owned). Token-driven helpers and classical motif
 * SVGs that the primitives kit composes. Nothing here hardcodes hex; all color and
 * texture comes from tailwind.config.js tokens.
 */
export { cx, type ClassValue } from './cx';
export { plasterGrainClass, grainOpacity } from './texture';
export { PlasterTexture } from './PlasterTexture';
export { Meander, Laurel } from './motifs';
export { agedCard, type EdgeVariant } from './edges';
