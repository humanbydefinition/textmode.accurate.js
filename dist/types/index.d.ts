import type { TextmodePlugin } from 'textmode.js';
/**
 * Creates a textmode.js plugin that provides an accurate glyph matching conversion strategy.
 * @returns A textmode.js plugin instance.
 */
export declare const createAccurateConversionPlugin: () => TextmodePlugin;
export type { TextmodeConversionStrategy } from 'textmode.js';
