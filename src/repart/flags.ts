import {asString} from "./re";

/**
 * Removes duplicate characters from a string, keeping only the first occurrence of each character.
 * 
 * @param s - The input string to deduplicate
 * @returns A new string with duplicate characters removed
 * 
 * @example
 * dedup("aabbcc") // "abc"
 * dedup("hello") // "helo"
 */
export const dedup = (s: string) =>  [...new Set(s)].join("");

/**
 * Regular expression flags quick reference and type definitions.
 * Provides constants and types for working with RegExp flags.
 */

/** Union type of all valid RegExp flags */
export type RegExpFlag = 'i' | 'g' | 'm' | 's' | 'u' | 'y' | 'd';

/** 
 * Named constants for RegExp flags for better readability.
 * Maps descriptive names to their corresponding flag characters.
 */
export const RegExpFlags: Record<string, RegExpFlag> = {
    GLOBAL: 'g',
    IGNORE_CASE: 'i',
    MULTILINE: 'm',
    DOTALL: 's',
    UNICODE: 'u',
    STICKY: 'y',
    HAS_INDICES: 'd'
}

/**
 * Human-readable descriptions of what each RegExp flag does.
 * Useful for documentation and debugging.
 */
export const RegExpFlagMeanings: Record<RegExpFlag, string> = {
    g: "Global search (find all matches, not just the first)",
    i: "Ignore case (case-insensitive match)",
    m: "Multiline (treat ^ and $ as start/end of each line)",
    s: "Dotall (dot `.` matches newlines too)",
    u: "Unicode (treat pattern as a sequence of Unicode code points)",
    y: "Sticky (match only from lastIndex position in the target string)",
    d: "hasIndices"
};

/** Array of all valid RegExp flags */
export const allRegExpFlags: RegExpFlag[] = ['i', 'g', 'm', 's', 'u', 'y', 'd'];

/** Union type for various ways to specify RegExp flags */
export type RegExpFlags = string | number | RegExpFlag |  RegExpFlag[];

/**
 * Normalizes and validates RegExp flags, removing duplicates and invalid characters.
 * Converts various flag formats to a clean string of valid flags.
 * 
 * @param flags - The flags to normalize (string, array, or undefined)
 * @returns A deduplicated string of valid RegExp flags
 * 
 * @example
 * regexpFlags(['g', 'i', 'g']) // "gi"
 * regexpFlags("gim") // "gim"
 * regexpFlags("xyz") // "" (invalid flags removed)
 */
export function regexpFlags(flags: RegExpFlags | undefined): string {
    const s = Array.isArray(flags)?flags.join(""):flags ?? "";
    return dedup(Array.from(s).filter(v => allRegExpFlags.includes(v as RegExpFlag)).join(""));
}

/**
 * Creates a new RegExp with the specified flags, replacing any existing flags.
 * Preserves parsers from the original RegExp if present.
 * 
 * @param rx - The input RegExp, string, or number to convert
 * @param flags - The new flags to apply (optional, uses existing flags if not provided)
 * @returns A new RegExp with the specified flags and preserved parsers
 * 
 * @example
 * withFlags(/abc/i, 'g') // /abc/g
 * withFlags('hello', 'i') // /hello/i
 */
export function withFlags(rx: string | number | RegExp, flags?: RegExpFlags) {
    const oldFlags = (rx instanceof RegExp)?rx.flags:"";
    return (new RegExp(asString(rx), regexpFlags(flags ??oldFlags))).withParsers((rx instanceof RegExp)?rx.parsers:{});
}

/**
 * Adds new flags to an existing RegExp without removing existing ones.
 * Preserves parsers from the original RegExp if present.
 * 
 * @param rx - The input RegExp, string, or number to convert
 * @param flags - The flags to add to existing flags
 * @returns A new RegExp with combined flags and preserved parsers
 * 
 * @example
 * addFlags(/abc/i, 'g') // /abc/gi
 * addFlags('hello', 'im') // /hello/im
 */
export function addFlags(rx: string | number | RegExp, flags?: RegExpFlags) {
    const oldFlags = (rx instanceof RegExp)?rx.flags:"";
    const newFlags = regexpFlags(flags ?? '');
    const reflags = dedup(oldFlags + newFlags);
    return (new RegExp(asString(rx), reflags)).withParsers((rx instanceof RegExp)?rx.parsers:{});
}

/**
 * Removes specified flags from an existing RegExp.
 * Preserves parsers from the original RegExp if present.
 * 
 * @param rx - The input RegExp, string, or number to convert
 * @param flags - The flags to remove from existing flags
 * @returns A new RegExp with specified flags removed and preserved parsers
 * 
 * @example
 * removeFlags(/abc/gi, 'i') // /abc/g
 * removeFlags(/hello/im, 'm') // /hello/i
 */
export function removeFlags(rx: string | number | RegExp, flags?: RegExpFlags) {
    if (rx instanceof RegExp) {
        const removedFlags = regexpFlags(flags);
        const newFlags = Array.from(rx.flags ?? '').filter(v => !removedFlags.includes(v as RegExpFlag)).join("")
        return (new RegExp(rx.source, newFlags)).withParsers((rx instanceof RegExp)?rx.parsers:{});
    }else{
        return new RegExp('' + rx)
    }
}
