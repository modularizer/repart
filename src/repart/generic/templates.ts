/**
 * Template functions for building common RegExp patterns with specific flags.
 * These functions provide convenient shortcuts for common regex operations.
 */
import {re} from "..";
import {any, newLine} from "./patterns";



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
    return re`\s*(?<content>${re(strings, ...vals)})\s*`.template("padded", (g: any) => g.content);
}


/** Alias for the padded function - provides a shorter name for convenience */
export function p(strings: TemplateStringsArray, ...vals: Array<string | number | RegExp>) {
    return padded(strings, ...vals).as('p')
}

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
    return re`(?:^)(?<content>${re(strings, ...vals)})(?:$)`.withFlags('m').template("mline", (g: any) => g.content)
}

/**
 * Creates a RegExp that matches a padded line using multiline mode.
 * Combines mline and padded functionality for flexible line matching.
 *
 * @example
 * const pattern = paddedmline`hello`;
*/
export function paddedmline(strings: TemplateStringsArray, ...vals: Array<string | number | RegExp>) {
    return re`(?:^)\s*(?<content>${re(strings, ...vals)})\s*(?:$)`.withFlags('m').template("paddedmline", (g: any) => g.content)
}

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
    return re`(?<=^|\n)(?<content>${re(strings, ...vals)})\s*(?=(?:(?:${newLine})|$))`.template("line",  (g: any) => g.content);
}

/**
 * Creates a RegExp that matches a padded line without using multiline mode.
 * Combines line and padded functionality for flexible line matching.
 *
 * @example
 * const pattern = paddedline`hello`; // Padded version of line matching
 */
export function paddedline(strings: TemplateStringsArray, ...vals: Array<string | number | RegExp>) {
    return re`(?<=(?:^|\n))\s*(?<content>${re(strings, ...vals)})\s*(?=(?:(?:${newLine})|$))`.template("paddedline", g => g.content);
}





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
    const pat = re(strings, ...vals);
    return  re`(?<before>${any}*?)(?<match>${pat})(?=(?<after>${any}*))`.template('separator')
}


export function gseparator(strings: TemplateStringsArray, ...vals: Array<string | number | RegExp>) {
    const pat = re(strings, ...vals);
    return re`(?<before>${any}*?)(?<match>${pat})(?=(?<after>${any}*?)(?=${pat}|$))`.withFlags('g')
}

/** Alias for the separator function - provides a shorter name for convenience */
export function sep(strings: TemplateStringsArray, ...vals: Array<string | number | RegExp>) {
    return  separator(strings, ...vals).as('sep')
}

export function gsep(strings: TemplateStringsArray, ...vals: Array<string | number | RegExp>) {
   return gseparator(strings, ...vals)
}