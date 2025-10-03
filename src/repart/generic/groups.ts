import {re} from "../core";
import {UnnamedGroupType, UnnamedGroupTypeAliases} from "../grouping";
import {disallowedGroupNames, simpleRename} from "../core";

export function capturing(strings: TemplateStringsArray, ...vals: Array<string | number | RegExp>){
    return re`(${re(strings, ...vals)})`
}
export const c = capturing;

export function optional(strings: TemplateStringsArray, ...vals: Array<string | number | RegExp>){
    return re`(${re(strings, ...vals)})?`
}
export const o = optional;

export function nonCapturing(strings: TemplateStringsArray, ...vals: Array<string | number | RegExp>){
    return re`(?:${re(strings, ...vals)})`
}
export const nc = nonCapturing;
export function lookahead(strings: TemplateStringsArray, ...vals: Array<string | number | RegExp>){
    return re`(?=${re(strings, ...vals)})`
}

export function negativeLookahead(strings: TemplateStringsArray, ...vals: Array<string | number | RegExp>){
    return re`(?!${re(strings, ...vals)})`
}

export function lookbehind(strings: TemplateStringsArray, ...vals: Array<string | number | RegExp>){
    return re`(?<=${re(strings, ...vals)})`
}
export function negativeLookbehind(strings: TemplateStringsArray, ...vals: Array<string | number | RegExp>){
    return re`(?<!${re(strings, ...vals)})`
}
export type special = UnnamedGroupType | UnnamedGroupTypeAliases | 'optional';



export function between (left: string|RegExp, right: string|RegExp) {
    return function(strings: TemplateStringsArray, ...vals: Array<string | number | RegExp>) {
        return  re`${lookbehind`${left}`}${re(strings, ...vals)}${lookahead`${right}`}`
    }
}

/**
 * Creates a group with the specified name or type.
 * Handles both named groups and special group types like capturing, non-capturing, lookahead, etc.
 * 
 * @param pattern - The pattern to wrap in a group
 * @param groupname - The name for the group or special group type
 * @returns A new RegExp with the pattern wrapped in the specified group type
 * 
 * @example
 * // Named group
 * const named = as(/\\w+/, 'username');
 * 
 * @example
 * // Special group types
 * const capturing = as(/\\w+/, 'capturing');
 * const nonCapturing = as(/\\w+/, 'non-capturing');
 * const lookahead = as(/\\w+/, 'lookahead');
 */
export function as(pattern: string | RegExp, groupname: string, wrap: boolean = false): RegExp {
    if (!groupname || groupname === 'capturing' || groupname === 'unnamed') return capturing`${pattern}`;
    if (groupname === 'non-capturing' || groupname === 'nc') return nonCapturing`${pattern}`;
    if (groupname === 'lookahead' || groupname === 'positive-lookahead') return lookahead`${pattern}`;
    if (groupname === 'lookbehind' || groupname === 'positive-lookbehind') return lookbehind`${pattern}`;
    if (groupname === 'negative-lookahead' || groupname === 'nlookahead') return negativeLookahead`${pattern}`;
    if (groupname === 'negative-lookbehind' || groupname === 'nlookbehind') return negativeLookbehind`${pattern}`;
    if (groupname === 'optional' || groupname === '?') return re`${pattern}`.optional();
    if (groupname === 'anchored') return re`^${pattern}$`;

    // return renameGroup(pattern, groupname, wrap)
    return simpleRename(pattern, groupname)
}
