import {dedup} from "./flags";
import {withParsers} from "./match";

/**
 * Converts a value to a string representation suitable for regex patterns.
 * If the input is a RegExp, returns its source pattern. Otherwise, converts to string.
 * 
 * @param child - The value to convert (RegExp, string, number, or undefined)
 * @returns The string representation of the input value
 */
export const asString = (child: RegExp | string | number | undefined) => (child instanceof RegExp)?child.source:('' + (child ?? ''));


/**
 * Alias of String.raw
 *
 * Builds a raw string from template literals, allowing substitution of regex patterns.
 * This function processes template strings and interpolates values, converting RegExp objects
 * to their source patterns while keeping other values as strings.
 * 
 * @param strings - Template string array from tagged template literal
 * @param vals - Array of values to interpolate (string, number, or RegExp)
 * @returns The constructed string with interpolated values
 * 
 * @example
 * const pattern = r`word${/\d+/}end`; // "word\\d+end"
 */
export const r = String.raw;

/**
 * Builds a RegExp from a template string, allowing interpolation of regex patterns.
 * This function processes template strings and interpolates values, combining flags
 * and parsers from RegExp objects while converting other values to strings.
 * 
 * @param strings - Template string array from tagged template literal
 * @param vals - Array of values to interpolate (string, number, or RegExp)
 * @returns A new RegExp with combined flags and parsers
 * 
 * @example
 * const count = 5; 
 * const pattern5: RegExp = re`\d{${count}}` // equivalent to /\d{5}/
 * re`abc${5}def${6}ghi` => re(["abc", "def", "ghi"], 5, 6)
 */
export function re(strings: TemplateStringsArray, ...vals: Array<string | number | RegExp>) {
    let out = "";
    let flags = "";
    let parsers = {};
    for (let i = 0; i < strings.raw.length; i++) {
        out += strings.raw[i];
        if (i < vals.length) {
            const v = vals[i];
            if (v instanceof RegExp) {
                flags += v.flags;
                if (v.parsers){
                    Object.assign(parsers, v.parsers)
                }
            }
            const s = asString(v);
            out += s;
        }
    }
    return withParsers((new RegExp(out, dedup(flags + "d"))), parsers);
}

type TemplateFunc = (strings: TemplateStringsArray, ...vals: Array<string | number | RegExp>) => any;

/**
 * Creates a function that stacks multiple template functions together.
 * This allows chaining template functions without nested template literals.
 * Functions are applied in reverse order (right to left).
 * 
 * @param funcs - Array of template functions to stack
 * @returns A new template function that applies all functions in sequence
 * 
 * @example
 * // Instead of: a`${b`text${5}`}`
 * // Use: stack(a,b)`text${5}`
 */
export function stack(...funcs: TemplateFunc[]){
    return function (strings: TemplateStringsArray, ...vals: Array<string | number | RegExp>) {
        let pattern = re(strings, ...vals);
        for (let n = funcs.length - 1; n >=0; n--) {
            const f = funcs[n];
            pattern = f`${pattern}`

        }
        return pattern;
    }
}

/**
 * Alias for the stack function.
 * Provides a shorter name for convenience.
 */
export const k = stack;







