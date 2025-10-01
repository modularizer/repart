/**
 * Advanced regex matching and parsing functionality.
 * This module provides enhanced regex matching capabilities with support for:
 * - Named groups and custom parsers
 * - Multiple match extraction
 * - Structured result parsing
 * - Flexible data extraction
 */
import {isFloat, isInt, toFloat, toInt} from "./common/numbers";
import {regexpFlags, RegExpFlags, withFlags} from "./flags";
import {asString, re} from "./re";

/**
 * Raw group value structure containing match information and metadata.
 * Represents a single match or group with position and content details.
 */
interface RawGroupValue {
    /** Optional name for the group */
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
    groups: Record<string, RawResult>;
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
    lastIndex?: number
}

/** Union type for raw match results - single match, array of matches, or null */
type RawResult =  RawGroupValue | null | RawGroupValue[];

/**
 * Performs raw regex matching with detailed position and group information.
 * This is the core matching function that extracts all match data including
 * indices, named groups, and metadata without any parsing or transformation.
 * 
 * @param input - The input string to search
 * @param pattern - The regex pattern to match against
 * @param params - Matching parameters and options
 * @returns Raw match results with detailed position information
 */
function matchXRaw(input: string, pattern: string | number | RegExp, {maxMatches = undefined, offset = 0, flags, lastIndex = 0, name}: RawMatchParams = {}): RawResult  {
    pattern = re`${pattern}`.withFlags(flags);
    if (maxMatches === undefined) {
        maxMatches = (pattern.flags.includes('g')?Infinity:1)
    }else if(maxMatches === null){
        maxMatches = Infinity;
    }
    if (maxMatches > 1 && !pattern.flags.includes('g')){
        pattern = pattern.addFlags('g')
    }
    pattern = pattern.addFlags('d');
    pattern.lastIndex = lastIndex;
    console.log(pattern);
    let m = pattern.exec(input); // or: for (const m of s.matchAll(rx)) { ... }
    let i = 0;
    const matches: RawGroupValue[] = [];

    while ((i < maxMatches) && m) {

        // whole match
        const [mStart, mEnd] = m.indices[0];

        const x: RawGroupValue = {
            name,
            offset,
            pattern,
            startIndex: mStart + offset,
            endIndex: mEnd + offset,
            lastIndex: pattern.lastIndex,
            raw: m[0],
            groups: {}
        }

        // named groups
        const groupIndices = m.indices.groups;
        for (const [groupName, rawGroup] of Object.entries(m.groups ??{})) {
            if (groupIndices === undefined){
                console.log("gn", groupName);
            }
            const inds = groupIndices[groupName];
            if (inds !== undefined){
                const [gsi, gse] = inds;
                const g: RawGroupValue = {
                    offset,
                    pattern,
                    name: groupName,
                    startIndex: gsi + offset,
                    endIndex: gse + offset,
                    lastIndex: gse,
                    raw: rawGroup,
                    groups: {}
                }
                x.groups[groupName] = g;
            }
        }
        matches.push(x);
        i += 1;
        if (i < maxMatches){
            m = pattern.exec(input)
        }else{
            m = null
        }
        if (pattern.lastIndex <= lastIndex){
            // console.error('matching stalled', pattern,  i);
            break;
        }
        lastIndex = pattern.lastIndex;
    }
    if (maxMatches === 1){return matches[0] || null}
    return matches
}


/**
 * Enhanced group value with parsed content and additional metadata.
 * Extends RawGroupValue with parsed data and unnesting information.
 */
interface GroupValue extends RawGroupValue{
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
export type StringParser = ((raw: string) => any) | ((raw: string, opts: {offset?: number}) => any) | string | number | RegExp;
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
export type Result = GroupValue | GroupValue[] | null ;

/**
 * Parses raw match results by applying custom parsers to matched content.
 * This function transforms raw match data into structured, parsed results
 * using the parsers attached to the RegExp pattern.
 * 
 * @param raw - The raw match result to parse
 * @param unnest - Whether to unnest the result during extraction
 * @returns Parsed result with transformed content and groups
 */
function parse(raw: RawResult, unnest: boolean = false): Result {
    if (!raw)return null;
    if (Array.isArray(raw)) {
        const results: GroupValue[] = [];
        for (let i = 0; i< raw.length; i++){
            const v = parse(raw[i]);
            results.push(v);
        }
        return results;
    }
    const parsers = (raw.pattern.parsers ?? {});
    const hasNamedParser = Object.keys(parsers).some(k => k === raw.name);
    const hasSilentParser = Object.keys(parsers).some(k => k === '_' + raw.name);
    const parser = (hasNamedParser?parsers[raw.name]:parsers['_'+raw.name]) ?? defaultStringParser;
    let parsed: any = raw;
    let rawGroups: Record<string, RawGroupValue | GroupValue> = raw.groups;
    if (hasSilentParser && parsers['_'+raw.name] === null){
        parsed = {};
    }else if (typeof parser === "string" || parser instanceof RegExp) {
        return parse(matchXRaw(raw.raw, parser, {offset: raw.startIndex}), hasSilentParser);
    }else{
        parsed = parser(raw.raw, {offset: raw.startIndex});
    }

    const groups = Object.fromEntries(Object.entries(rawGroups).map(([k, rv]) => {
        return [k, parse(rv)];
    }).filter(o => o[1] !== undefined));
    
    return {
        ...raw,
        parsed,
        unnest: unnest || hasSilentParser,
        groups,
    }
}

export type MatchOpts = RawMatchParams | undefined;


/**
 * Performs regex matching with automatic parsing of matched content.
 * This is the main matching function that combines raw matching with parsing.
 * 
 * @param input - The input string to search
 * @param pattern - The regex pattern to match against
 * @param params - Matching parameters and options
 * @returns Parsed match results with transformed content
 * 
 * @example
 * const result = match("name: John", /name: (?<name>\w+)/);
 * // Returns parsed result with name group processed
 */
export function match(input: string, pattern: string | number | RegExp, {offset = 0, flags, maxMatches}: MatchOpts = {}): Result {
    return parse(matchXRaw(input, pattern, {offset, flags, maxMatches}));
}

/** Union type for extracted data - various formats of structured data */
export type Extracted = Record<string, any> | Record<string, any>[] | null | any[];

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
export function extract(v: Result, k?: string, d: Record<string, any> = {}, flat: boolean = false): Extracted {
    if (!v) return null;
    if (Array.isArray(v)){
        const results = v.map(elem => {
            return extract(elem);
        }).filter(elem => !!elem);
        if (!results.length) return null;
        const firstKeys = Object.keys(results[0]);
        const n = firstKeys.length;
        if (n === 1){
            const k = firstKeys[0];
            if (results.every(o => Object.keys(o).length === 1 && Object.keys(o)[0] ===k)){
                return results.map(o => o[k]);
            }
        }else if (firstKeys.includes('key')){
            if (firstKeys.includes('value') && results.every(o => {const k2 = Object.keys(o); return k2.length === 2 && k2.includes('key') && k2.includes('value')})){
                return Object.fromEntries(results.map(o => [o.key, o.value]));
            }else if (results.every(o => Object.keys(o).includes('key'))){
                return Object.fromEntries(results.map(o => [o.key, o]));
            }
        }
        return results;
    }
    k = k ?? v.name;
    if (Object.keys(v.groups).length){

        // const k2 = k ?? 'groups'
        // d[k2] = {}
        let o = {};
        for (const [k3, v3] of Object.entries(v.groups)){
            extract(v3, k3, o);
        }
        if((v.pattern.parsers ?? {}).groups){
            o = ((v.pattern.parsers ?? {}).groups)(o);
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
        return v.parsed;
    }
    return d;
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
    return extract(match(input, pattern, opts))
}
