/**
 * Color Cut Calculator
 * Calculates gel sheets needed based on color frame sizes
 */

// Standard gel sheet size (all manufacturers)
const GEL_SHEET_WIDTH = 20; // inches
const GEL_SHEET_HEIGHT = 24; // inches

export interface FrameSize {
  width: number;
  height: number;
  original: string; // Original text for display
}

export interface ColorCutItem {
  gelCode: string;
  manufacturer: string;
  frameSize: string;
  cutsNeeded: number;
  cutsPerSheet: number;
  sheetsNeeded: number;
}

/**
 * Parse color frame size from text
 * Supports formats:
 * - Square: "6.25 x 6.25", "6.25\" x 6.25\"", "6.25 by 6.25"
 * - Round: "7.5 Round", "7.5\" Round", "7.5 inch round"
 * - Single dimension: "6.25", "6.25\""
 */
export function parseFrameSize(frameSizeText: string | null | undefined): FrameSize | null {
  if (!frameSizeText) return null;

  const text = frameSizeText.trim();

  // Round frame (e.g., "7.5 Round", "7.5\" Round")
  const roundMatch = text.match(/^([\d.]+)\s*(?:"|inch|in)?\s*(?:round|diameter|dia)/i);
  if (roundMatch) {
    const diameter = parseFloat(roundMatch[1]);
    if (!isNaN(diameter) && diameter > 0) {
      // For round frames, use diameter as both dimensions
      return { width: diameter, height: diameter, original: text };
    }
  }

  // Square/rectangular frame (e.g., "6.25 x 6.25", "6.25\" x 6.25\"")
  const rectMatch = text.match(/([\d.]+)\s*(?:"|inch|in)?\s*(?:x|by|×)\s*([\d.]+)/i);
  if (rectMatch) {
    const width = parseFloat(rectMatch[1]);
    const height = parseFloat(rectMatch[2]);
    if (!isNaN(width) && !isNaN(height) && width > 0 && height > 0) {
      return { width, height, original: text };
    }
  }

  // Single dimension (assume square, e.g., "6.25", "6.25\"")
  const singleMatch = text.match(/^([\d.]+)\s*(?:"|inch|in)?$/);
  if (singleMatch) {
    const size = parseFloat(singleMatch[1]);
    if (!isNaN(size) && size > 0) {
      return { width: size, height: size, original: text };
    }
  }

  // If no match, return null
  return null;
}

/**
 * Calculate how many cuts fit on a single gel sheet
 * Uses full-size cuts (no optimization/packing)
 */
export function calculateCutsPerSheet(frameSize: FrameSize): number {
  const { width, height } = frameSize;

  // Calculate how many cuts fit horizontally and vertically
  const cutsHorizontal = Math.floor(GEL_SHEET_WIDTH / width);
  const cutsVertical = Math.floor(GEL_SHEET_HEIGHT / height);

  // Total cuts = horizontal * vertical
  const totalCuts = cutsHorizontal * cutsVertical;

  return totalCuts > 0 ? totalCuts : 1; // Minimum 1 cut per sheet
}

/**
 * Calculate sheets needed for a given number of cuts
 */
export function calculateSheetsNeeded(cutsNeeded: number, cutsPerSheet: number): number {
  if (cutsPerSheet <= 0) return cutsNeeded; // Fallback: 1 sheet per cut
  return Math.ceil(cutsNeeded / cutsPerSheet);
}

/**
 * Format frame size for display
 */
export function formatFrameSize(frameSize: FrameSize): string {
  if (frameSize.width === frameSize.height) {
    return `${frameSize.width}" × ${frameSize.height}"`;
  }
  return `${frameSize.width}" × ${frameSize.height}"`;
}
