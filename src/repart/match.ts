/**
 * Advanced regex matching and parsing functionality.
 * This module provides enhanced regex matching capabilities with support for:
 * - Named groups and custom parsers
 * - Multiple match extraction
 * - Structured result parsing
 * - Flexible data extraction
 *
 * matchRaw => RawResult (custom class)
 *       .raw : Raw (bare)
 *       .parsedResult: ParsedResult (custom class)
 *       .parsed: Parsed (bare)
 *       .result: Result (custom class)
 *       .extracted: Extracted (bare)
 *  match => Result (custom class)
 *       .extracted: Extracted (bare)
 *  matchAndExtract => Extracted (bare)
 *
 *  primarily internal use
 *  parse(RawResult) => ParsedResult (custom class)
 *       .parsed: Parsed (bare)
 *       .result: Result (custom class)
 *       .extracted: Extracted (bare)
 *  extract(ParsedResult) => Result (custom class)
 *       .extracted: Extracted (bare)
 */
import {isFloat, isInt, toFloat, toInt} from "./common/numbers";
import {RegExpFlags} from "./flags";
import {re} from "./re";

/**
 * Raw group value structure containing match information and metadata.
 * Represents a single match or group with position and content details.
 * This is the fundamental data structure returned by regex matching operations.
 * 
 * @example
 * ```typescript
 * const rawMatch: RawGroupValue = {
 *   name: "email",
 *   raw: "john@example.com",
 *   startIndex: 10,
 *   endIndex: 25,
 *   lastIndex: 25,
 *   offset: 0,
 *   pattern: /(?<email>[^\s@]+@[^\s@]+)/,
 *   groups: {
 *     email: { raw: "john@example.com", startIndex: 10, endIndex: 25, ... }
 *   }
 * };
 * ```
 */
export interface RawGroupValue {
    /** Optional name for the group (for named groups) */
    name?: string;
    /** The RegExp pattern that was used for matching */
    pattern: RegExp;
    /** Offset applied to indices (for nested matches) */
    offset: number;
    /** Start index of the match in the original string */
    startIndex: number;
    /** End index of the match in the original string */
    endIndex: number;
    /** Last index after the match (for global matching) */
    lastIndex: number;
    /** The raw matched string */
    raw: string;
    /** Named groups captured within this match */
    groups: Record<string, RawGroupValue>;
}

/**
 * Parameters for controlling regex matching behavior.
 * Provides fine-grained control over matching options.
 */
interface RawMatchParams {
    /** Optional name for the match */
    name?: string;
    /** Maximum number of matches to return (null = unlimited, undefined = auto) */
    maxMatches?: number | null,
    /** Offset to add to all indices */
    offset?: number,
    /** RegExp flags to apply */
    flags?: RegExpFlags,
    /** Starting position for matching */
    lastIndex?: number,
    /** Whether to cache the input string in the result objects */
    cacheInput?: boolean
}

/**
 * Union type for raw match results - single match, array of matches, or null.
 * This represents the bare data structure returned by regex matching operations.
 * 
 * @example
 * ```typescript
 * // Single match
 * const singleMatch: Raw = {
 *   name: "email",
 *   raw: "john@example.com",
 *   startIndex: 10,
 *   endIndex: 25,
 *   // ... other properties
 * };
 * 
 * // Multiple matches
 * const multipleMatches: Raw = [
 *   { name: "email", raw: "john@example.com", ... },
 *   { name: "email", raw: "jane@example.com", ... }
 * ];
 * 
 * // No match
 * const noMatch: Raw = null;
 * ```
 */
export type Raw =  RawGroupValue | null | RawGroupValue[];




/**
 * Class wrapper for raw match results that provides a simple interface.
 * Behaves exactly like the original RawResult but adds a .result getter.
 */
export class RawResult {
    private _raw: Raw;
    private _parsed?: ParsedResult;
    
    constructor(raw: Raw) {
        this._raw = raw;

        if (Array.isArray(raw)) {
            // Copy array properties
            for (let i = 0; i < raw.length; i++) {
                (this as any)[i] = raw[i];
            }
            // Set length property
            Object.defineProperty(this, 'length', {
                value: raw.length,
                writable: false,
                enumerable: false,
                configurable: true
            });
        } else if (raw !== null) {
            // Copy object properties, avoiding conflicts with getters
            for (const [key, value] of Object.entries(raw)) {
                if (key !== 'raw' && key !== 'parsed' && key !== 'result' && key !== 'extracted') {
                    (this as any)[key] = value;
                }
            }
        }
    }

    get raw() {
        return this._raw;
    }

    parse(unnest?: boolean){
        this._parsed = parse(this._raw, unnest);
        return this._parsed;
    }

    get parsed(){
        if (this._parsed === undefined) {
            this._parsed = parse(this._raw);
        }
        return this._parsed;
    }

    get parsedValue(){
        return this.parsed.valueOf();
    }

    get result(){
        return this.parsed.result;
    }
    get extracted(){
        return this.result.valueOf();
    }

    /**
     * Returns the underlying parsed result as a plain object.
     */
    valueOf(): Raw {
        return this.raw;
    }

    get value(): Raw {
        return this.raw;
    }

    /**
     * Custom toString for console.log to display as Raw value
     */
    toString(): string {
        return JSON.stringify(this.raw, null, 2);
    }

    /**
     * Custom inspect for Node.js console.log to display as Raw value
     */
    [Symbol.for('nodejs.util.inspect.custom')]() {
        return this.raw;
    }
}

/**
 * Performs raw regex matching with detailed position and group information.
 * This is the core matching function that extracts all match data including
 * indices, named groups, and metadata without any parsing or transformation.
 * 
 * @param input - The input string to search
 * @param pattern - The regex pattern to match against
 * @param params - Matching parameters and options
 * @returns MatchRawResult instance with detailed position information and .parse() method
 */
export function matchRaw(input: string, pattern: string | number | RegExp, {maxMatches = undefined, offset = 0, flags, lastIndex = 0, name, cacheInput = false}: RawMatchParams = {}): RawResult  {
    pattern = re`${pattern}` as RegExp;
    if (flags && (pattern as any).withFlags) {
        pattern = (pattern as any).withFlags(flags);
    }
    if (maxMatches === undefined) {
        maxMatches = ((pattern as RegExp).flags.includes('g')?Infinity:1)
    }else if(maxMatches === null){
        maxMatches = Infinity;
    }
    if (maxMatches > 1 && !(pattern as RegExp).flags.includes('g')){
        if ((pattern as any).addFlags) {
            pattern = (pattern as any).addFlags('g')
        }
    }
    if ((pattern as any).addFlags) {
        pattern = (pattern as any).addFlags('d');
    }
    (pattern as RegExp).lastIndex = lastIndex;
    let m = (pattern as RegExp).exec(input); // or: for (const m of s.matchAll(rx)) { ... }
    let i = 0;
    const matches: RawGroupValue[] = [];

    while ((i < maxMatches) && m) {

        // whole match
        const [mStart, mEnd] = (m as any).indices[0];

        const x: RawGroupValue = {
            name: name,
            offset,
            pattern: pattern as RegExp,
            startIndex: mStart + offset,
            endIndex: mEnd + offset,
            lastIndex: (pattern as RegExp).lastIndex,
            raw: m[0],
            groups: {}
        }

        // named groups
        const groupIndices = (m as any).indices.groups;
        for (const [groupName, rawGroup] of Object.entries(m.groups ??{})) {
            if (groupIndices === undefined){
                // console.log("gn", groupName);
            }
            const inds = groupIndices[groupName];
            if (inds !== undefined){
                const [gsi, gse] = inds;
                const g: RawGroupValue = {
                    offset,
                    pattern: pattern as RegExp,
                    name: groupName,
                    startIndex: gsi + offset,
                    endIndex: gse + offset,
                    lastIndex: gse,
                    raw: rawGroup as string,
                    groups: {}
                }
                x.groups[groupName] = g;
            }
        }
        matches.push(x);
        i += 1;
        if (i < maxMatches){
            m = (pattern as RegExp).exec(input)
        }else{
            m = null
        }
        if ((pattern as RegExp).lastIndex <= lastIndex){
            // console.error('matching stalled', pattern,  i);
            break;
        }
        lastIndex = (pattern as RegExp).lastIndex;
    }
    if (maxMatches === 1){
        const result = new RawResult(matches[0] || null);
        if (cacheInput) {
            (result as any).input = input;
        }
        return result;
    }
    const result = new RawResult(matches);
    if (cacheInput) {
        (result as any).input = input;
    }
    return result;
}


/**
 * Enhanced group value with parsed content and additional metadata.
 * Extends RawGroupValue with parsed data and unnesting information.
 */
export interface GroupValue extends RawGroupValue{
    /** The parsed/transformed value of the matched content */
    parsed: any;
    /** Named groups with their own parsed values */
    groups: Record<string, GroupValue>;
    /** Whether this group should be unnested during extraction */
    unnest: boolean;
}

/**
 * Type for string parsers that can transform matched content.
 * Can be a function, string pattern, number, or RegExp for further matching.
 */
export type StringParser = ((raw: string) => any) | ((raw: string, opts: {offset?: number}) => any) | string | RegExp;
type GroupsFn = (g: Record<string, unknown>) => Record<string, unknown>;

export type Parsers<K extends string = string> = {
    groups?: GroupsFn;
} & { [P in Exclude<K, "groups">]?: StringParser };

/** Parser that returns the raw string unchanged */
const nomodify: StringParser = (raw: string): string => raw;

/**
 * Parser that attempts to convert strings to numbers.
 * Tries integer conversion first, then float, falls back to original string.
 * Handles null/empty values appropriately.
 */
const numParser: StringParser = (raw: string): string | number | null => {
    let v = raw.trim();
    if (!v || v === "null" || v === "NULL") return null;
    if (isInt(v)) {return toInt(v)}
    if (isFloat(v)) {return toFloat(v)}
    return raw;
}

/**
 * Parser that attempts JSON parsing with fallback to original string.
 * Tries to parse the string as JSON, returns original if parsing fails.
 */
export const tryjson: StringParser = (raw: string): string | number | null => {
    try{
        return JSON.parse(raw);
    }catch {
        return raw;
    }
}

/** Default parser used when no specific parser is provided */
export const defaultStringParser = tryjson;
/**
 * Sets parsers on a RegExp object as a non-enumerable property.
 * This allows parsers to be attached to RegExp objects without interfering
 * with normal RegExp behavior or serialization.
 * 
 * @param rx - The RegExp to attach parsers to
 * @param v - The parsers object to attach
 * @returns The RegExp with parsers attached
 */
function setParsers(rx: RegExp, v: Parsers) {
    Object.defineProperty(rx, 'parsers', {
        value: v, writable: true, configurable: true, enumerable: false
    });
    return rx;
}

/**
 * Creates a new RegExp with custom parsers for processing matched groups.
 * Merges new parsers with existing ones, with new parsers taking precedence.
 * Gets bound to RegExp.withParsers.
 * **NOTE**: only has an effect if `match(input, pattern)` or `matchAndExtract(input, pattern)` is called
 * 
 * @param rx - The RegExp to add parsers to
 * @param parsers - Object mapping group names to parser functions
 * @returns A new RegExp with the specified parsers attached
 * 
 * @example
 * // simple case: perform some conversion, define key: (s: string) => any
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
 *          title: o.name
 *      }
 *   }
 * });
 */
export function withParsers(rx: RegExp, parsers: Parsers = {}){
    if (rx && parsers){
        setParsers(rx, {
            ...(rx.parsers ?? {}),
            ...(parsers ?? {}),
        })
    }
    return rx;
}




/** Union type for parsed match results - single group, array of groups, or null */
export type Parsed = GroupValue | GroupValue[] | null ;

/**
 * Class wrapper for parsed match results that provides a simple interface.
 * Behaves exactly like the original Result but adds lazy extraction.
 */
export class ParsedResult {
    private _parsed: Parsed;
    private _result?: Result;
    [k: string | number]: any;
    
    constructor(parsed: Parsed) {
        this._parsed = parsed;
        
        if (Array.isArray(parsed)) {
            // Copy array properties
            for (let i = 0; i < parsed.length; i++) {
                (this as any)[i] = parsed[i];
            }
            // Set length property
            Object.defineProperty(this, 'length', {
                value: parsed.length,
                writable: false,
                enumerable: false,
                configurable: true
            });
        } else if (parsed !== null) {
            // Copy object properties, avoiding conflicts with getters
            for (const [key, value] of Object.entries(parsed)) {
                if (key !== 'raw' && key !== 'parsed' && key !== 'result' && key !== 'extracted') {
                    (this as any)[key] = value;
                }
            }
        }
    }

    get parsed(): Parsed {
        return this._parsed;
    }

    /**
     * Gets the extracted data, extracting if not already cached.
     * @returns Extracted data in various structured formats
     */
    get result(): Result {
        if (this._result === undefined) {
            this._result = extract(this);
        }
        return this._result;
    }

    get extracted(): Extracted {
        return this.result.extracted;
    }

    /**
     * Returns the underlying parsed result as a plain object.
     */
    valueOf(): Parsed {
        return this._parsed;
    }
    get value(): Parsed {
        return this._parsed;
    }

    /**
     * Custom toString for console.log to display as Parsed value
     */
    toString(): string {
        return JSON.stringify(this._parsed, null, 2);
    }

    /**
     * Custom inspect for Node.js console.log to display as Parsed value
     */
    [Symbol.for('nodejs.util.inspect.custom')]() {
        return this._parsed;
    }
}

/**
 * Parses raw match results by applying custom parsers to matched content.
 * This function transforms raw match data into structured, parsed results
 * using the parsers attached to the RegExp pattern.
 * 
 * @param raw - The raw match result to parse
 * @param unnest - Whether to unnest the result during extraction
 * @returns ParseResult instance with transformed content and groups and .extract() method
 */
export function parse(raw: Raw, unnest: boolean = false): ParsedResult {
    if (!raw) {
        const result = new ParsedResult(null);
        // Cache input if it was cached in the raw result
        if ((raw as any)?.input) {
            (result as any).input = (raw as any).input;
        }
        return result;
    }
    if (Array.isArray(raw)) {
        const results: GroupValue[] = [];
        for (let i = 0; i< raw.length; i++){
            const v = parse(raw[i]);
            results.push(v.valueOf() as GroupValue);
        }
        const result = new ParsedResult(results);
        // Cache input if it was cached in the raw result
        if ((raw as any).input) {
            (result as any).input = (raw as any).input;
        }
        return result;
    }
    const parsers = ((raw.pattern as any)?.parsers ?? {});
    const rawName = raw.name ?? '';
    const hasNamedParser = Object.keys(parsers).some(k => k === rawName);
    const hasSilentParser = Object.keys(parsers).some(k => k === '_' + rawName);
    const parser = (hasNamedParser?parsers[rawName]:parsers['_'+rawName]) ?? defaultStringParser;
    let parsed: any = raw;
    let rawGroups: Record<string, RawGroupValue> = raw.groups ?? {};
    if ((hasSilentParser && parsers['_'+rawName] === null) || (!hasSilentParser && parsers['_'+rawName] === null)){
        parsed = {};
    }else if (typeof parser === "string" || parser instanceof RegExp) {
        return matchRaw(raw.raw, parser, {offset: raw.startIndex}).parse(hasSilentParser);
    }else{
        if (typeof parser === 'function') {
            parsed = parser(raw.raw, {offset: raw.startIndex});
        } else {
            parsed = raw.raw;
        }
    }

    const groups: Record<string, GroupValue> = {};
    if (rawGroups) {
        for (const [k, rv] of Object.entries(rawGroups)) {
            const parsed = parse(rv).valueOf();
            if (parsed !== undefined) {
                groups[k] = parsed as GroupValue;
            }
        }
    }
    
    const result = new ParsedResult({
        ...raw,
        parsed,
        unnest: unnest || hasSilentParser,
        groups,
    });
    
    // Cache input if it was cached in the raw result
    if ((raw as any).input) {
        (result as any).input = (raw as any).input;
    }
    
    return result;
}

export type MatchOpts = RawMatchParams | undefined;


/**
 * Performs regex matching with automatic parsing of matched content.
 * This is the main matching function that combines raw matching with parsing.
 * 
 * @param input - The input string to search
 * @param pattern - The regex pattern to match against
 * @param params - Matching parameters and options
 * @returns ParseResult instance with transformed content and .extract() method
 * 
 * @example
 * const result = match("name: John", /name: (?<name>\w+)/);
 * // Returns ParseResult with name group processed and .extract() method
 */
export function match(input: string, pattern: string | number | RegExp, {offset = 0, flags, maxMatches, cacheInput = false}: MatchOpts = {}): Result {
    return matchRaw(input, pattern, {offset, flags, maxMatches, cacheInput}).result;
}

/** Union type for extracted data - various formats of structured data */
export type Extracted = Record<string, any> | Record<string, any>[] | null | any[];


/**
 * Class wrapper for parsed match results that provides a simple interface.
 * Behaves exactly like the original Result but adds lazy extraction.
 */
export class Result {
    private _parsedResult: ParsedResult;
    private _extracted: Extracted;
    [k: string | number]: any;

    constructor(parsedResult: ParsedResult, extracted: Extracted) {
        // console.log("extracted", extracted)
        this._parsedResult = parsedResult;
        this._extracted = extracted;

        if (Array.isArray(extracted)) {
            // Copy array properties
            for (let i = 0; i < extracted.length; i++) {
                (this as any)[i] = extracted[i];
            }
            // Set length property
            Object.defineProperty(this, 'length', {
                value: extracted.length,
                writable: false,
                enumerable: false,
                configurable: true
            });
        } else if (extracted !== null) {
            // Copy object properties, avoiding conflicts with getters
            for (const [key, value] of Object.entries(extracted)) {
                if (key !== 'raw' && key !== 'parsed' && key !== 'result' && key !== 'extracted') {
                    (this as any)[key] = value;
                }
            }
        }
    }


    get parsedResult(){
        return this._parsedResult;
    }

    get parsed(){
        return this._parsedResult.parsed;
    }

    get groups(): Record<string, GroupValue> {
        return (this.parsed?.groups ?? {}) as Record<string, GroupValue>;
    }

    get extracted(){
        return this._extracted;
    }

    get value(): Extracted {
        return this._extracted;
    }

    /**
     * Returns the underlying parsed result as a plain object.
     */
    valueOf(): Extracted {
        return this._extracted;
    }

    /**
     * Custom toString for console.log to display as Extracted value
     */
    toString(): string {
        return JSON.stringify(this._extracted, null, 2);
    }

    /**
     * Custom inspect for Node.js console.log to display as Extracted value
     */
    [Symbol.for('nodejs.util.inspect.custom')]() {
        return this._extracted;
    }
}




/**
 * Extracts structured data from parsed match results.
 * This function intelligently extracts and organizes data from match results,
 * handling various data structures and providing flexible output formats.
 * 
 * @param v - The parsed match result to extract data from
 * @param k - Optional key name for the extracted data
 * @param d - Destination object to accumulate extracted data
 * @param flat - Whether to flatten nested structures
 * @returns Extracted data in various structured formats
 * 
 * @example
 * const result = match("name: John, age: 25", /name: (?<name>\w+), age: (?<age>\d+)/);
 * const data = extract(result); // { name: "John", age: 25 }
 */
export function extract(parsedResult: ParsedResult, k?: string, d: Record<string, any> = {}, flat: boolean = false): Result {
    const v: Parsed = parsedResult.parsed;
    if (!v) {
        // console.log("null result")
        return new Result(parsedResult, null);
    }
    if (Array.isArray(v)){
        const results = v.map((elem, i) => {
            // console.log("extracting element", i)
            return extract(new ParsedResult(elem));
        }).filter(elem => !!elem);
        if (!results.length) {
            // console.log("no results")
            return new Result(parsedResult, null);
        }
        const firstKeys = Object.keys(results[0]);
        const n = firstKeys.length;
        let ret = results;
        if (n === 1){
            const k = firstKeys[0];

            if (results.every(o => Object.keys(o).length === 1 && Object.keys(o)[0] ===k)){
                // console.log("building result for a list of objects with all the same single key")
                ret = results.map(o => {
                    if (typeof o === 'object' && o !== null && k in o) {
                        return (o as any)[k];
                    }
                    return o;
                });
            }
        }
        else if (firstKeys.includes('key')){
            if (firstKeys.includes('value') && results.every(o => {const k2 = Object.keys(o); return k2.length === 2 && k2.includes('key') && k2.includes('value')})){
                const entries: [string, any][] = [];
                for (const o of results) {
                    if (typeof o === 'object' && o !== null && 'key' in o && 'value' in o) {
                        entries.push([o.key as string, o.value]);
                    }
                }
                // console.log("Returning kv mapped object")
                ret = Object.assign({}, ...entries.map(([k, v]) => ({[k]: v})));
            }else if (results.every(o => Object.keys(o).includes('key'))){
                const entries: [string, any][] = [];
                for (const o of results) {
                    if (typeof o === 'object' && o !== null && 'key' in o) {
                        entries.push([o.key as string, o]);
                    }
                }
                // console.log("returning key mapped object")
                ret = Object.assign({}, ...entries.map(([k, v]) => ({[k]: v})));
            }
        }
        if (k){
            d[k] = ret
            // console.log("returning modified dict with list results", d)
            return new Result(parsedResult, d);
        }else {
            // console.log("returning results from the list")
            return new Result(parsedResult, ret);
        }
    }
    k = k ?? v.name;

    if (Object.keys(v.groups).length){

        // const k2 = k ?? 'groups'
        // d[k2] = {}
        let o = {};
        for (const [k3, v3] of Object.entries(v.groups)){
            // console.log("extracting group ", k3)
            extract(new ParsedResult(v3), k3, o);
        }
        // console.log("o", o);
        const groupsParser = (v.pattern.parsers ?? {}).groups;
        if(groupsParser){
            o = groupsParser(o);
        }
        if (k && !v.unnest && !flat){
            d[k] = o
        }else {
            Object.assign(d, o)
        }
    }else if (k){
        if (v.unnest){
            Object.assign(d, v.parsed);
        }else {
            d[k] = v.parsed
        }
    }else if (!Object.keys(d).length){
        // console.log("no name and no groups, returning parsed")
        return new Result(parsedResult, v.parsed);
    }
    // console.log("returning record")
    // console.log("v.groups", v.groups)
    return new Result(parsedResult, d);
}


/**
 * Convenience function that combines matching and extraction in one step.
 * Performs regex matching and immediately extracts structured data from the results.
 * 
 * @param input - The input string to search
 * @param pattern - The regex pattern to match against
 * @param opts - Matching parameters and options
 * @returns Extracted structured data from the match results
 * 
 * @example
 * const data = matchAndExtract("name: John, age: 25", /name: (?<name>\w+), age: (?<age>\d+)/);
 * // Returns { name: "John", age: 25 }
 */
export function matchAndExtract(input: string, pattern: string | number | RegExp, opts: MatchOpts = {}): Extracted {
    return match(input, pattern, opts).extracted;
}

// matchRaw => RawResult (custom class)
//      .raw : Raw (bare)
//      .parsedResult: ParsedResult (custom class)
//      .parsed: Parsed (bare)
//      .result: Result (custom class)
//      .extracted: Extracted (bare)
// match => Result (custom class)
//      .extracted: Extracted (bare)
// matchAndExtract => Extracted (bare)

// primarily internal use
// parse(RawResult) => ParsedResult (custom class)
//      .parsed: Parsed (bare)
//      .result: Result (custom class)
//      .extracted: Extracted (bare)
// extract(ParsedResult) => Result (custom class)
//      .extracted: Extracted (bare)