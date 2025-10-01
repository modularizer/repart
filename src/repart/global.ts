/**
 * Global RegExp prototype extensions for enhanced regex functionality.
 * This module extends the native RegExp prototype with additional methods
 * for flag manipulation and parser management.
 */
import {addFlags, RegExpFlags, removeFlags, withFlags} from "./flags";
import {Parsers, withParsers} from "./match";
import {group, special} from "./generic";
import {asString, re} from "./re";
import {quantifier} from "./generic/builders";
import {p} from "./generic/templates";
import {replacedPattern} from "./generic/transformations";
import {space} from "./generic/patterns";



/**
 * Global type declaration extending the RegExp interface with custom methods.
 * These methods are added to the RegExp prototype to provide enhanced functionality.
 */
declare global {
    interface RegExp {
        /** Custom parsers for processing matched groups */
        parsers: Parsers<string> | undefined;
        /** Creates a new RegExp with specified flags, replacing existing ones
         *
         * @example
         * re`^something&`.withFlags('gm')
         *
         * */
        withFlags(flags?: RegExpFlags): RegExp;

        /** Creates a new RegExp with additional flags added to existing ones
         *
         * @example
         * re`^something&`.addFlags('gm')
         *
         * */
        addFlags(flags?: RegExpFlags): RegExp;

        /**
         * Wraps the current RegExp in a named group or special group type.
         * Creates a new RegExp that captures the current pattern as a named group.
         * 
         * @param name - The name for the group or special group type:
         *   - **Named groups**: Any string creates `(?<name>pattern)`
         *   - **'unnamed'**: Creates `(pattern)` - regular capturing group
         *   - **'noncapturing'**: Creates `(?:pattern)` - non-capturing group
         *   - **'lookahead'**: Creates `(?=pattern)` - positive lookahead
         *   - **'lookbehind'**: Creates `(?<=pattern)` - positive lookbehind
         *   - **'notlookahead'**: Creates `(?!pattern)` - negative lookahead
         *   - **'notlookbehind'**: Creates `(?<!pattern)` - negative lookbehind
         *   - **'optional'**: Creates `(pattern)?` - optional capturing group
         * @returns A new RegExp with the current pattern wrapped in the specified group type
         * 
         * @example
         * const pattern = /\d+/.as('number'); // (?<number>\d+)
         * const email = EMAIL_PATTERN.as('email'); // (?<email>email_pattern)
         * const noncap = /\w+/.as('noncapturing'); // (?:\w+)
         * const lookahead = /\d+/.as('lookahead'); // (?=\d+)
         * const optional = /\w+/.as('optional'); // (\w+)?
         */
        as(name: string | special): RegExp;

        /** Creates a new RegExp with specified flags removed from existing ones */
        removeFlags(flags?: RegExpFlags): RegExp;

        /**
         * Clones pattern and adds custom parsers for processing matched groups.
         * **NOTE**: only has an effect if `match(input, pattern)` or `matchAndExtract(input, pattern)` is called
         *
         * @param rx - The RegExp to add parsers to
         * @param parsers - Object mapping group names to parser functions
         * @returns A new RegExp with the specified parsers attached
         *
         * @example
         * // simple case: perform some conversion, define key: (s: string) => any
         * const regex = re`name: (?<name>\w+)`.withParsers({
         *   name: (s) => s.toUpperCase(),
         * });
         *
         * @example
         * // simple case#2: perform some conversion, define key: (s: string) => any
         * const regex = re`name: (?<name>\w+)`.withParsers({
         *   name: (s) => ({title: s, wasConverted: true}), // instead of getting {name: string} the parsed output will now be {name: {title: string, wasConverted: boolean}}
         * });
         *
         * @example
         * // unnested parser: perform some conversion and unnest the results, replacing the originally captured key, define _key: (s: string) => Record<string, any>
         * const regex = re`name: (?<name>\w+)`.withParsers({
         *   _name: (s) => ({title: s, wasConverted: true}), // due to _ preceding key, instead of getting {name: {title: string, wasConverted: boolean}} the parsed output will now be unnested to {title: string, wasConverted: boolean}
         * });
         *
         * @example
         * // ignore some keys with _key: null
         * const regex = re`(?<prefix>[\s\S]*?)name: (?<name>\w+)`.withParsers({
         *   name: (s) => s.toUpperCase(),
         *   _prefix: null, // using _key: null syntax we can state to ignore the 'prefix' group, so the parsed output is just {name: string} not {name: string, prefix: string}
         * });
         *
         * @example
         * // use 'groups' method to postprocess
         * const regex = re`(?<prefix>[\s\S]*?)name: (?<name>\w+)`.withParsers({
         *   name: (s) => s.toUpperCase(),
         *   groups: (o: Records<string, any>) => ({title: o.name}) // adding a special 'groups' handler allows us to postprocess the extracted result
         * });
         *
         * @example
         * // use _key: RegExp or key: RegExp to break down large complex operations into steps (_ just ignores the originally captured name and unnests the child results)
         * const regex = re`simple: (?<value>\d*), complex: (?<bigblock>\w+)`.withParsers({
         *   _bigblock: re`name: (?<name>\w+)` // using _key: pattern syntax we can break down the regexp into components, so this new match gets evaluates on the bigblock match result, and _ indicates the output groups get unnested
         * });
         *
         * @example
         * // add as many methods as you need
         * const regex = re`name: (?<name>\w+), (?<next>.*?), (?<another>.*?), (?<x>.*)`.withParsers({
         *   name: (s) => s.toUpperCase(),
         *   _x: null, // use _${key}: null to ignore key
         *   _next: (s) => {
         *      // use _${key}: func to define an nunested parser, e.g. put info key at top level
         *      return {"info": s}
         *   },
         *   another: /(?<anotherKey>\w*): (?<anotherValue>\d*)/,
         *   groups: (o) => {
         *      return {
         *          title: o.name,
         *          another: o.another,
         *
         *      }
         *   }
         * });
         */
        withParsers(parsers?: Parsers): RegExp;

        /**
         * Wraps the current RegExp with prefix and suffix patterns.
         * Creates a new RegExp that matches the prefix, then the current pattern, then the suffix.
         * If only one parameter is provided, it's used for both prefix and suffix.
         * 
         * @param before - The pattern to match before the current RegExp
         * @param after - The pattern to match after the current RegExp (optional, defaults to before)
         * @returns A new RegExp with the current pattern wrapped
         * 
         * @example
         * const pattern = /\d+/.wrappedWith('\\s*', '\\s*'); // /\s*\d+\s* /
         * const quoted = /word/.wrappedWith('"'); // /"word"/
         * const bracketed = /\d+/.wrappedWith('[', ']'); // /\[\d+\]/
         */
        wrappedWith(before: string | RegExp | undefined, after?: string | RegExp | undefined): RegExp;

        /**
         * Concatenates the current RegExp with another pattern.
         * Creates a new RegExp that matches the current pattern followed by the given pattern.
         * 
         * @param after - The pattern to match after the current RegExp
         * @returns A new RegExp with the patterns concatenated
         * 
         * @example
         * const pattern = /\d+/.then('\\s*'); // /\d+\s* /
         * const emailPattern = /user/.then('@').then(/domain/); // /user@domain/
         */
        then(after?: string | RegExp): RegExp;

        /**
         * Makes the current RegExp optional (matches 0 or 1 times).
         * Creates a new RegExp that optionally matches the current pattern.
         * Automatically wraps in parentheses if needed for proper grouping.
         * 
         * @returns A new RegExp that optionally matches the current pattern
         * 
         * @example
         * const pattern = /\d+/.optional(); // /\d+?/ or /(\d+)? /
         * const emailPattern = EMAIL_PATTERN.optional(); // Email pattern is optional
         */
        optional(): RegExp;

        /**
         * Makes the current RegExp repeat with specified quantifiers.
         * Creates a new RegExp that matches the current pattern a specified number of times.
         * Automatically wraps in parentheses if needed for proper grouping.
         * 
         * @param minCount - Minimum number of repetitions (default: 0)
         * @param maxCount - Maximum number of repetitions (undefined = unlimited, null = unlimited)
         * @returns A new RegExp with the specified repetition quantifier
         * 
         * @example
         * const pattern = /\d/.repeated(1, 3); // /\d{1,3}/ or /(\d){1,3} /
         * const many = /\w/.repeated(0); // /\w* / or /(\w)* /
         * const unlimited = /\s/.repeated(1, null); // /\s+/ or /(\s)+ /
         */
        repeated(minCount?: number, maxCount?: number | undefined | null): RegExp;

        /**
         * Makes spaces in the pattern flexible by matching consecutive whitespace (excluding newlines).
         * Creates a new RegExp where space characters match any amount of consecutive whitespace.
         * Useful for patterns where spacing might vary but newlines should be preserved.
         * 
         * @returns A new RegExp with flexible whitespace matching
         * 
         * @example
         * const pattern = /hello world/.spaced(); // Matches "hello world", "hello  world", "hello\tworld", etc.
         * const flexible = /name: value/.spaced(); // Matches "name:value", "name: value", "name:  value", etc.
         */
        spaced(): RegExp;
    }
}

/**
 * Adds custom methods to the RegExp prototype for enhanced functionality.
 * This function extends the native RegExp prototype with methods for:
 * - Flag manipulation (withFlags, addFlags, removeFlags)
 * - Parser management (withParsers)
 * - Group creation (as)
 * - Pattern composition (wrappedWith, then)
 * - Quantifier application (optional, repeated)
 * - Flexible whitespace matching (spaced)
 * 
 * The methods are added as non-enumerable, configurable properties to avoid
 * interfering with normal RegExp iteration and serialization.
 * 
 * @example
 * addToPrototype();
 * const regex = /hello/i;
 * const newRegex = regex
 *   .addFlags('g')
 *   .as('greeting')
 *   .spaced()  // Make spaces flexible
 *   .optional()
 *   .withParsers({greeting: (s) => s.toUpperCase()});
 */
export function addToPrototype() {
    /**
     * Helper function to define a method on RegExp.prototype.
     * Creates non-enumerable, configurable properties to avoid interference.
     */
    const def = (k: string, v: Function) => {
        console.log(`setting RegExp.${k}`);
        Object.defineProperty(RegExp.prototype, k, {value: v, configurable: true});
    }

    def('withFlags', function (this: RegExp, flags?: RegExpFlags) {
        return withFlags(this, flags);
    });
    def('addFlags', function (this: RegExp, flags?: RegExpFlags) {
        return addFlags(this, flags);
    });
    def('removeFlags', function (this: RegExp, flags?: RegExpFlags) {
        return removeFlags(this, flags);
    });
    def('withParsers', function (this: RegExp, parsers?: Parsers) {
        return withParsers(this, parsers);
    });
    /**
     * Implementation of the 'as' method - wraps RegExp in a named group.
     * Uses the group function to create a named capture group around the current pattern.
     */
    def('as', function (this: RegExp, name: string | special) {
        return group(name)`${this}`;
    });

    /**
     * Implementation of the 'wrappedWith' method - wraps RegExp with prefix/suffix.
     * Creates a new pattern that matches before + current + after patterns.
     * If only one parameter is provided, it's used for both sides.
     */
    def('wrappedWith', function (this: RegExp, before: string | RegExp | undefined, after?: string | RegExp | undefined ) {
        return re`${before ?? ''}${this}${after ?? before ?? ''}`
    });

    /**
     * Implementation of the 'then' method - concatenates patterns.
     * Creates a new pattern that matches current pattern followed by the given pattern.
     */
    def('then', function (this: RegExp, after: string | RegExp) {
        return re`${this}${after}`
    });

    /**
     * Implementation of the 'optional' method - makes pattern optional.
     * Intelligently adds ? quantifier, wrapping in parentheses only when necessary
     * to avoid breaking the pattern structure.
     */
    def('optional', function (this: RegExp) {
        const s = asString(this);
        if (s.replace(/\\./g, "_").length === 1 || (s.startsWith('(') && s.endsWith(')')) || (s.startsWith('[') && s.endsWith(']'))) {
            return re`${this}?`
        }else{
            return re`(${this})?`
        }

    });

    /**
     * Implementation of the 'repeated' method - applies repetition quantifiers.
     * Intelligently adds repetition quantifiers, wrapping in parentheses only when necessary
     * to avoid breaking the pattern structure.
     */
    def('repeated', function (this: RegExp, minCount: number=0, maxCount: number | undefined | null = undefined) {
        const s = asString(this);
        const q = quantifier(minCount, maxCount);
        if (s.replace(/\\./g, "_").length === 1 || (s.startsWith('(') && s.endsWith(')')) || (s.startsWith('[') && s.endsWith(']'))) {
            return re`${this}${q}`
        }else{
            return re`(${this})${q}`
        }
    });

    /**
     * Implementation of the 'spaced' method - makes spaces flexible.
     * Uses replacedPattern to replace space characters with consecutive whitespace matching (excluding newlines).
     */
    def('spaced', function (this: RegExp) {
        const spacedPattern = replacedPattern({" ": space});
        return spacedPattern`${this}`;
    });
}
