/**
 * Single source for app branding. PRD requires the app name to live in one
 * config constant so branding can change without a refactor.
 */
export const APP_NAME = 'Cursus';
export const APP_TAGLINE = 'The course. The path.';
export const APP_DESCRIPTION =
  'A discipline and habit tracker that generalizes the 75 Hard format into challenges of any length.';

/** Milestone day thresholds that trigger a carved milestone quote card (PRD 4.1 #8). */
export const MILESTONE_DAYS = [7, 21, 30, 50, 66, 75, 90, 100] as const;
