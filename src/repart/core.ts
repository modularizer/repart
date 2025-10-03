/**
 * Core group manipulation functions without dependencies on global prototype extensions.
 * This module provides fundamental group manipulation capabilities that can be used
 * by other modules without creating circular dependencies.
 */
import {Parsers} from "./match";

export const dedup = (s: string) =>  [...new Set(s)].join("");


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



export function _simpleWithParsers(rx: RegExp, parsers: Parsers = {}){
    // simple internal withparsers
    if (rx && parsers){
        Object.defineProperty(rx, 'parsers', {
            value: {
                ...(rx.parsers ?? {}),
                ...(parsers ?? {}),
            }, writable: true, configurable: true, enumerable: false
        });
    }
    return rx;
}

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
    let flags = "d";
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
    const f = dedup(flags);
    const p = new RegExp(out, f);
    return _simpleWithParsers(p, parsers);
}


export const disallowedGroupNames = [
    'capturing' ,'non-capturing' , 'positive-lookahead' , 'positive-lookbehind' , 'negative-lookahead' , 'negative-lookbehind' , 'named',
    'unnamed' , 'nc' , 'lookahead' , 'lookbehind' , 'nlookahead' , 'nlookbehind',
    'groups', 'extracted', 'parsed', 'rresult', 'parsedResult'
];

/**
 * Gets the name of a single named group from a RegExp pattern.
 * Returns undefined if the pattern doesn't contain exactly one named group.
 */
export function getGroupName(rx: string | RegExp): string | undefined {
    const s = asString(rx);
    const gn = re`(?<groupname>\w+)`;
    const namedgroupstart = re`\(\?<${gn}>`;
    const groupnameExtractor = re`^${namedgroupstart}${re`.*`}\)$`;
    return groupnameExtractor.match(s)?.groupname;
}

/**
 * Gets all named group names from a RegExp pattern.
 */
export function getAllGroupNames(rx: string | RegExp): string[] {
    const s = asString(rx);
    const gn = re`(?<groupname>\w+)`;
    const namedgroupstart = re`\(\?<${gn}>`;
    const result = namedgroupstart.withFlags('g').matchAndExtract(s);
    if (Array.isArray(result)) {
        return result.filter((item): item is string => typeof item === 'string');
    }
    return [];
}



function _simpleRenameGroup(pattern: string | RegExp, oldName: string | undefined, newName: string): RegExp {
    if (disallowedGroupNames.includes(newName)){
        throw new Error(`repart library has disallowed the group name "${newName}" to avoid collisions with some of our property names and custom values`)
    }
    const source = asString(pattern);
    const flags = pattern instanceof RegExp ? pattern.flags : '';

    // Validate that newName doesn't already exist
    const existingNames = getAllGroupNames(pattern);
    if (existingNames.includes(newName)) {
        throw new Error(`New name '${newName}' already exists in pattern. Existing groups: ${existingNames.join(', ')}`);
    }
    if (!oldName){
        if (/^\([\s\S]*\)$/.test(source) && !'?<'.includes(source.slice(1,2))){
            const p = re`(?<${newName}>${source.slice(1, source.length -1)})`;
            p.parsers = pattern instanceof RegExp ? (p.parsers ?? {}) : {};
            return p;
        }
        return re`(?<${newName}>${pattern})`;
    }

    // Create regex to find and replace the named group
    const namedGroupPattern = re`\(\?<${oldName}>`;
    const replacement = `(?<${newName}>`;
    
    // Replace all occurrences of the old group name
    const src = source.replace(namedGroupPattern, replacement);
    //@ts-ignore
    const parsers = {...(pattern.parsers ?? {})}
    if (oldName) {
        if (parsers[oldName] !== undefined) {
            const f = parsers[oldName];
            delete parsers[oldName];
            parsers[newName] = f;
        }
        if (parsers['_' + oldName] !== undefined) {
            const f2 = parsers['_' + oldName];
            delete parsers['_' + oldName];
            parsers['_' + newName] = f2;
        }
    }

    return _simpleWithParsers(new RegExp(src, flags), parsers);
}


/**
 * Renames a named group in a RegExp pattern from one name to another.
 * Creates a new RegExp with the specified named group renamed while preserving
 * all other aspects of the pattern including flags, quantifiers, and structure.
 *
 * @param pattern - The RegExp pattern containing the named group to rename
 * @param newName - The new name for the named group
 * @returns A new RegExp with the named group renamed
 *
 * @throws {Error} If the newName is disallowed or already exists in the pattern
 */
export function simpleRename(pattern: string | RegExp, newName: string): RegExp{
    const oldName = getGroupName(pattern);
    return _simpleRenameGroup(pattern, oldName, newName);
}

export function simplePrependName(pattern: string | RegExp, prefix: string): RegExp{
    const oldName = getGroupName(pattern);
    return _simpleRenameGroup(pattern, oldName, prefix + oldName);
}



export function renameGroup(pattern: string | RegExp, newName: string, wrap: boolean = false): RegExp {
    if (disallowedGroupNames.includes(newName)){
        throw new Error(`repart library has disallowed the group name "${newName}" to avoid collisions with some of our property names and custom values`)
    }
    const source = asString(pattern);
    const flags = pattern instanceof RegExp ? pattern.flags : '';

    // Validate that newName doesn't already exist
    const existingNames = getAllGroupNames(pattern);
    // console.log("existing names", existingNames)
    if (existingNames.includes(newName)) {
        throw new Error(`New name '${newName}' already exists in pattern. Existing groups: ${existingNames.join(', ')}`);
    }
    const oldName = wrap?'':getGroupName(pattern);
    let src = source;
    if (wrap){
        src = r`(?<${newName}>${source})`;
    }else if (!oldName){
        if (/^\([\s\S]*\)$/.test(source) && !'?<'.includes(source.slice(1,2))){
            src = r`(?<${newName}>${source.slice(1, source.length -1)})`;
        }else {
            src = r`(?<${newName}>${source})`;
        }
    }

    // Create regex to find and replace the named group

    const sep = '____';
    const prefix = `${newName}${sep}`;
    const oldPrefix = `${oldName}${sep}`;

    //@ts-ignore
    const parsers = {...(pattern.parsers ?? {})}
    // console.log("og parsers", Object.keys(parsers))
    for (let name of existingNames){
        const rep = (name === oldName)?newName:((name.startsWith(oldPrefix))?name.replace(re`^${oldPrefix}`, prefix):`${prefix}${name}`);
        // console.log('changing', name, rep)
        const oldPattern = re`\(\?<${name}>`
        const newValue = `(?<${rep}>`;
        if (!oldPattern.test(src)){
            throw new Error("replacement failed " + oldPattern + " " + src)
        }
        src = src.replace(oldPattern, newValue);
        if (parsers[name] !== undefined) {
            const f = parsers[name];
            delete parsers[name];
            parsers[rep] = f;
        }
        if (parsers['_' + name] !== undefined) {
            const f2 = parsers['_' + name];
            delete parsers['_' + name];
            parsers['_' + rep] = f2;
        }
    }

    const oldgroups = oldPrefix + 'groups';
    if (parsers[oldgroups] !== undefined) {
        const f = parsers[oldgroups];
        delete parsers[oldgroups];
        parsers[prefix + 'groups'] = f;
    }else if (parsers['groups'] !== undefined) {
        const f = parsers['groups'];
        delete parsers['groups'];
        parsers[prefix + 'groups'] = f;
    }


    return _simpleWithParsers(new RegExp(src, flags), parsers);
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
