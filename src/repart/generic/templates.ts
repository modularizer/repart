/**
 * Template functions for building common RegExp patterns with specific flags.
 * These functions provide convenient shortcuts for common regex operations.
 */
import {re, stack} from "../re";
import {any, anything, endLine, space, startLine} from "./patterns";



/**
 * Creates a RegExp that matches the pattern with optional whitespace padding.
 * The pattern is wrapped with \s* on both sides to allow for leading/trailing whitespace.
 *
 * @param strings - Template string array from tagged template literal
 * @param vals - Array of values to interpolate
 * @returns A RegExp that matches the pattern with optional whitespace
 *
 * @example
 * const pattern = padded`(?<word>.*)`; // matches with all spaces (\s*) before and after
*/
export function padded(strings: TemplateStringsArray, ...vals: Array<string | number | RegExp>) {
    return re`\s*${re(strings, ...vals)}\s*`;
}

/** Alias for the padded function - provides a shorter name for convenience */
export const p = padded;

/**
 * Creates a RegExp that matches a complete line using multiline mode.
 * Uses ^ and $ anchors with the multiline flag to match start/end of lines.
 * Warning: This does not include padding - use paddedmline for padded matching.
 *
 * @param strings - Template string array from tagged template literal
 * @param vals - Array of values to interpolate
 * @returns A RegExp that matches a complete line in multiline mode
 *
 * @example
 * const pattern = mline`hello`; // /^hello$/m
 */
export function mline(strings: TemplateStringsArray, ...vals: Array<string | number | RegExp>) {
    return re`^${re(strings, ...vals)}$`.addFlags('m')
}

/**
 * Creates a RegExp that matches a padded line using multiline mode.
 * Combines mline and padded functionality for flexible line matching.
 *
 * @example
 * const pattern = paddedmline`hello`;
*/
export const paddedmline = stack(mline, p);

/**
 * Creates a RegExp that matches a complete line without using multiline mode.
 * Uses startLine and endLine patterns instead of ^ and $ anchors.
 *
 * @param strings - Template string array from tagged template literal
 * @param vals - Array of values to interpolate
 * @returns A RegExp that matches a complete line without multiline mode
 *
 * @example
 * const pattern = line`hello`; // Uses startLine and endLine patterns
 */
export function line(strings: TemplateStringsArray, ...vals: Array<string | number | RegExp>) {
    return re`${startLine}${re(strings, ...vals)}\s*${endLine}`;
}

/**
 * Creates a RegExp that matches a padded line without using multiline mode.
 * Combines line and padded functionality for flexible line matching.
 *
 * @example
 * const pattern = paddedline`hello`; // Padded version of line matching
 */
export const paddedline = stack(line, padded);





/**
 * Creates a RegExp that captures content before and after a separator pattern.
 * Uses named groups to capture the before, match, and after portions.
 *
 * @param strings - Template string array from tagged template literal
 * @param vals - Array of values to interpolate
 * @returns A RegExp with named groups for before, match, and after content
 *
 * @example
 * const pattern = separator`;`; // Captures content around semicolons
 * // Groups: before, match, after
 */
export function separator(strings: TemplateStringsArray, ...vals: Array<string | number | RegExp>) {
    return  re`(?<before>${any}*?)(?<match>${re(strings, ...vals)})(?<after>${any}*)`
}

/** Alias for the separator function - provides a shorter name for convenience */
export const sep = separator;