/**
 * Global RegExp prototype extensions for enhanced regex functionality.
 * This module extends the native RegExp prototype with additional methods
 * for flag manipulation and parser management.
 */
import {RegExpFlags, removeFlags, setFlags, withFlags} from "./flags"; // good, no add to prototype deps
import {asString, re, templateGroup} from "./core"; // good, no add to prototype deps
import {escape} from "./special"; // good, no add to prototype deps
import {Parsers, withParsers, matchRaw, matchAndExtract, Result, RawResult, Extracted} from "./match";
import {special, replacedPattern, space, as} from "./generic";

import {quantifier} from "./generic/builders";
import {GroupInfo} from "./decomposer";



/**
 * Global type declaration extending the RegExp interface with custom methods.
 * These methods are added to the RegExp prototype to provide enhanced functionality.
 */
declare global {
    interface RegExp {
        /** Custom parsers for processing matched groups */
        parsers: Parsers<string> | undefined;
        /** Creates a new RegExp with specified flags, adding to existing ones
         *
         * @example
         * re`^something&`.withFlags('gm')
         *
         * @example
         * g: "Global search (find all matches, not just the first)",
         * i: "Ignore case (case-insensitive match)",
         * m: "Multiline (treat ^ and $ as start/end of each line)",
         * s: "Dotall (dot `.` matches newlines too)",
         * u: "Unicode (treat pattern as a sequence of Unicode code points)",
         * y: "Sticky (match only from lastIndex position in the target string)",
         * d: "hasIndices"
         *
         * */
        withFlags(flags?: RegExpFlags): RegExp;

        /** Creates a new RegExp with specified flags, replacing existing ones
         *
         * @example
         * re`^something&`.setFlags('gm')
         *
         * @example
         * g: "Global search (find all matches, not just the first)",
         * i: "Ignore case (case-insensitive match)",
         * m: "Multiline (treat ^ and $ as start/end of each line)",
         * s: "Dotall (dot `.` matches newlines too)",
         * u: "Unicode (treat pattern as a sequence of Unicode code points)",
         * y: "Sticky (match only from lastIndex position in the target string)",
         * d: "hasIndices"
         *
         * */
        setFlags(flags?: RegExpFlags): RegExp;

        /**
         * Wraps the current RegExp in a named group or special group type.
         * Creates a new RegExp that captures the current pattern as a named group.
         *
         * @param name - The name for the group or special group type:
         *   - **Named groups**: Any string creates `(?<name>pattern)`
         *   - **'capturing'**: Creates `(pattern)` - regular capturing group
         *   - **'nonCapturing'**: Creates `(?:pattern)` - non-capturing group
         *   - **'lookahead'**: Creates `(?=pattern)` - positive lookahead
         *   - **'lookbehind'**: Creates `(?<=pattern)` - positive lookbehind
         *   - **'negativeLookahead'**: Creates `(?!pattern)` - negative lookahead
         *   - **'negativeLookbehind'**: Creates `(?<!pattern)` - negative lookbehind
         *   - **'optional'**: Creates `(pattern)?` - optional capturing group
         * @returns A new RegExp with the current pattern wrapped in the specified group type
         *
         * @example
         * const pattern = /\d+/.as('number'); // (?<number>\d+)
         * const email = EMAIL_PATTERN.as('email'); // (?<email>email_pattern)
         * const noncap = /\w+/.as('nonCapturing'); // (?:\w+)
         * const lookahead = /\d+/.as('lookahead'); // (?=\d+)
         * const optional = /\w+/.as('optional'); // (\w+)?
         */
        as(name: string | special, wrap?: boolean): RegExp;


        /**
         * Adds anchors to the current RegExp pattern.
         * Creates a new RegExp with start/end anchors (^/$) added to control matching boundaries.
         * 
         * @param mode - The anchor mode to apply:
         *   - **'^'** or **'start'**: Add start anchor (^) only
         *   - **'$'** or **'end'**: Add end anchor ($) only  
         *   - **'^$'** or **'both'**: Add both start and end anchors (default)
         * @param multiline - Whether to add/keep multiline flag (m) for line-based matching
         * @returns A new RegExp with the specified anchors added
         * 
         * @example
         * // Add both anchors (default behavior)
         * const pattern = /\d+/.anchor(); // /^\d+$/
         * 
         * @example
         * // Add only start anchor
         * const startOnly = /\d+/.anchor('start'); // /^\d+/
         * 
         * @example
         * // Add only end anchor  
         * const endOnly = /\d+/.anchor('end'); // /\d+$/
         * 
         * @example
         * // Add anchors with multiline mode
         * const multilinePattern = /\d+/.anchor('both', true); // /^\d+$/m
         * 
         * @example
         * // Chain with other methods
         * const complex = /\d+/.as('number').anchor('both').withFlags('i'); // /^(?<number>\d+)$/i
         */
        anchor(mode?: '^' | 'start' | '$' | 'end' | '^$' | 'both', multiline?: boolean): RegExp;

        /**
         * Removes anchors from the current RegExp pattern.
         * Creates a new RegExp with start/end anchors (^/$) removed to allow partial matching.
         * 
         * @param mode - The anchor mode to remove:
         *   - **'^'** or **'start'**: Remove start anchor (^) only
         *   - **'$'** or **'end'**: Remove end anchor ($) only
         *   - **'^$'** or **'both'**: Remove both start and end anchors (default)
         * @param removeMultiline - Whether to remove multiline flag (m) when removing anchors
         * @returns A new RegExp with the specified anchors removed
         * 
         * @example
         * // Remove both anchors (default behavior)
         * const pattern = /^\d+$/.unanchor(); // /\d+/
         * 
         * @example
         * // Remove only start anchor
         * const noStart = /^\d+$/.unanchor('start'); // /\d+$/
         * 
         * @example
         * // Remove only end anchor
         * const noEnd = /^\d+$/.unanchor('end'); // /^\d+/
         * 
         * @example
         * // Remove anchors and multiline flag
         * const noMultiline = /^\d+$/m.unanchor('both', true); // /\d+/
         * 
         * @example
         * // Chain with other methods
         * const flexible = /^(?<number>\d+)$/.unanchor().then('\\s*'); // /(?<number>\d+)\s* /
         */
        unanchor(mode?: '^' | 'start' | '$' | 'end' | '^$' | 'both', removeMultiline?: boolean): RegExp;

        template(name?: string, groupsParser?: (g: any) => any): RegExp;

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
        withParsers(parsers: Parsers): RegExp;

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
         * @param maxCount - Maximum number of repetitions (undefined = minCount, null = unlimited)
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

        /**
         * Performs regex matching with the current RegExp pattern.
         * Returns an object that behaves like the extracted data but provides access to raw, parsed, and extraced.
         *
         * @param input - The input string to search
         * @param options - Optional matching parameters
         * @returns Object that acts like extracted data with .raw, .parsed, and .extracted properties
         *
         * @example
         * const result = /name: (?<name>\w+)/.match("name: John");
         * console.log(result.name); // "John" (extracted data)
         * console.log(result.raw);  // Raw match data
         * console.log(result.parsed); // Parsed match data
         * console.log(result.extracted); // Extracted value
         */
        match(input: string, options?: {maxMatches?: number | null, offset?: number, flags?: RegExpFlags, lastIndex?: number, name?: string, cacheInput?: boolean}): Result;

        /**
         * Performs raw regex matching with the current RegExp pattern.
         * Returns a MatchRawResult with detailed position and group information.
         *
         * @param input - The input string to search
         * @param options - Optional matching parameters
         * @returns MatchRawResult with .result getter for accessing all data
         *
         * @example
         * const rawResult = /name: (?<name>\w+)/.matchRaw("name: John");
         * const result = rawResult.result; // Access the proxy object
         */
        matchRaw(input: string, options?: {maxMatches?: number | null, offset?: number, flags?: RegExpFlags, lastIndex?: number, name?: string, cacheInput?: boolean}): RawResult;

        /**
         * Performs regex matching and extracts structured data in one step.
         * Returns the extracted data directly without the proxy wrapper.
         *
         * @param input - The input string to search
         * @param options - Optional matching parameters
         * @returns Extracted data in various structured formats
         *
         * @example
         * const data = /name: (?<name>\w+)/.matchAndExtract("name: John");
         * console.log(data.name); // "John"
         */
        matchAndExtract(input: string, options?: {maxMatches?: number | null, offset?: number, flags?: RegExpFlags, lastIndex?: number, name?: string, cacheInput?: boolean}): Extracted;

        /**
         * Returns detailed information about the RegExp pattern's group structure.
         * Provides comprehensive analysis of capturing groups, named groups, quantifiers,
         * nesting levels, and pattern composition for debugging and introspection.
         *
         * @returns GroupInfo object containing:
         *   - Group structure analysis (capturing, named, non-capturing groups)
         *   - Quantifier information (min/max counts, repetition patterns)
         *   - Nesting levels and parent-child relationships
         *   - Pattern source breakdown and indices
         *   - Access to individual group details and named group proxies
         *
         * @example
         * const pattern = /(?<name>\w+): (?<value>\d+)(?:\.(?<decimal>\d+))?/;
         * const info = pattern.info;
         * console.log(info.groupNames); // ["name", "value", "decimal"]
         * console.log(info.namedGroups.name.source); // "\w+"
         * console.log(info.hasQuantifier); // true
         * console.log(info.toString()); // Colored pattern visualization
         *
         * @example
         * // Analyze complex nested patterns
         * const complex = /(?<outer>(?<inner>\w+)\s*:\s*(?<value>\d+))+/;
         * const info = complex.info;
         * console.log(info.level); // 0 (top level)
         * console.log(info.namedGroups.outer.level); // 0
         * console.log(info.namedGroups.inner.level); // 1
         * console.log(info.namedGroups.value.level); // 1
         */
        readonly info: GroupInfo;

        /**
         * Returns formatted pattern information using GroupInfo's toString method.
         * Provides colored pattern visualization for debugging and introspection.
         *
         * @returns String representation of the pattern with syntax highlighting
         *
         * @example
         * const pattern = /(?<name>\w+): (?<value>\d+)/;
         * console.log(pattern.toString()); // Colored pattern visualization
         */
        toString(): string;

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
 * - Flexible whitespace matching (s)
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
    // console.log("adding methods to RegExp prototype")
    /**
     * Helper function to define a method on RegExp.prototype.
     * Creates non-enumerable, configurable properties to avoid interference.
     */
    const def = (k: string, v: Function) => {
        Object.defineProperty(RegExp.prototype, k, {value: v, configurable: true});
    }

    def('withFlags', function (this: RegExp, flags?: RegExpFlags) {
        return withFlags(this, flags);
    });
    def('setFlags', function (this: RegExp, flags?: RegExpFlags) {
        return setFlags(this, flags);
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
    def('as', function (this: RegExp, name: string | special, wrap: boolean = false) {
        return as(this, name, wrap);
    });

    def('template', function (this: RegExp, name?: string, groupsParser?: (g: any) => any) {
        return templateGroup(this, name, groupsParser);
    });

    /**
     * Implementation of the 'wrappedWith' method - wraps RegExp with prefix/suffix.
     * Creates a new pattern that matches before + current + after patterns.
     * If only one parameter is provided, it's used for both sides.
     */
    def('wrappedWith', function (this: RegExp, before: string | RegExp | undefined, after?: string | RegExp | undefined ) {
        if (typeof before === 'string' && !before.includes('\\')) {
            before = escape(before);
        }
        after = after ?? before ?? '';
        if (typeof (after) === 'string' && !after.includes('\\')){
            after = escape(after);
        }
        return re`${before ?? ''}${this}${after}`
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
        const sPattern = replacedPattern([[/\\n+/g, '\\s+'], [/\\t+/g, '\\s+'], [/\s+/g, '\\s+'], [/\\s\+\\s\+/g, '\\s+']]);
        return sPattern`${this}`;
    });

    /**
     * Implementation of the 'match' method - performs regex matching.
     * Returns an object that behaves like the extracted data but provides access to raw, parsed, and value.
     */
    def('match', function (this: RegExp, input: string, options: any = {}) {
        return matchRaw(input, this, options).result;
    });

    /**
     * Implementation of the 'matchRaw' method - performs raw regex matching.
     * Returns a MatchRawResult with detailed position and group information.
     */
    def('matchRaw', function (this: RegExp, input: string, options: any = {}) {
        return matchRaw(input, this, options);
    });

    /**
     * Implementation of the 'matchAndExtract' method - performs regex matching and extracts data.
     * Returns the extracted data directly without the proxy wrapper.
     */
    def('matchAndExtract', function (this: RegExp, input: string, options: any = {}) {
        return matchAndExtract(input, this, options);
    });

    /**
     * Implementation of the 'anchor' method - adds anchors to control matching boundaries.
     * Intelligently adds start (^) and/or end ($) anchors to the pattern source,
     * optionally managing the multiline flag for line-based matching.
     */
    def('anchor', function (this: RegExp, mode: '^' | 'start' | '$' | 'end' | '^$' | 'both' = 'both', multiline?: boolean) {
        if (!(["^", "start", "$", "end", "^$", "both"]).includes(mode)){throw new Error("invalid mode")}
        const p = this.parsers ?? {};
        let f = this.flags ?? '';
        let s = this.source;
        if ((multiline ?? false) && !f.includes("m")){f += "m"}
        if (!(multiline ?? true)){f = Array.from(f).filter(v=>v!='m').join()}
        if (['^', 'start', "^$", 'both'].includes(mode) && !s.startsWith('^')){
            s = '^' + s;
        }
        if (["$", "end", "^$", "both"].includes(mode) && !s.endsWith('$')){
            s += '$';
        }
        const r = new RegExp(s, f);
        r.parsers = p;
        return r;
    });

    /**
     * Implementation of the 'unanchor' method - removes anchors to allow partial matching.
     * Intelligently removes start (^) and/or end ($) anchors from the pattern source,
     * optionally managing the multiline flag when removing anchors.
     */
    def('unanchor', function (this: RegExp, mode: '^' | 'start' | '$' | 'end' | '^$' | 'both' = 'both', removeMultiline: boolean = false) {
        if (!(["^", "start", "$", "end", "^$", "both"]).includes(mode)){throw new Error("invalid mode")}
        const p = this.parsers ?? {};
        let f = this.flags ?? '';
        let s = this.source;
        if (removeMultiline){f = Array.from(f).filter(v=>v!='m').join()}
        if (['^', 'start', "^$", 'both'].includes(mode) && s.startsWith('^')) {
            s = s.slice(1)
        }
        if (["$", "end", "^$", "both"].includes(mode) && s.endsWith('$')){
            s = s.slice(0, s.length - 1);
        }
        const r = new RegExp(s, f);
        r.parsers = p;
        return r;
    });


    /**
     * Implementation of the 'info' getter - returns GroupInfo object for pattern analysis.
     * Provides comprehensive information about the RegExp's group structure, quantifiers,
     * nesting levels, and pattern composition for debugging and introspection.
     */
    Object.defineProperty(RegExp.prototype, 'info', {
        get: function (this: RegExp) {
            // console.log("getting")
            return new GroupInfo(this);
        },
        configurable: true
    });

    /**
     * Implementation of the 'toString' method - returns formatted pattern information.
     * Uses the GroupInfo's toString method to provide colored pattern visualization.
     */
    def('toString', function (this: RegExp) {
        return this.info.toString();
    });

    /**
     * Implementation of the custom inspect method for Node.js console.log.
     * Uses the GroupInfo's toString method to provide colored pattern visualization.
     */
    Object.defineProperty(RegExp.prototype, Symbol.for('nodejs.util.inspect.custom'), {
        value: function (this: RegExp) {
            return this.info.toString();
        },
        configurable: true
    });
}
