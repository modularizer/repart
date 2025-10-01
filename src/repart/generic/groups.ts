import {re} from "../re";

export function unnamed(strings: TemplateStringsArray, ...vals: Array<string | number | RegExp>){
    return re`(${re(strings, ...vals)})`
}
export const u = unnamed;

export function optional(strings: TemplateStringsArray, ...vals: Array<string | number | RegExp>){
    return re`(${re(strings, ...vals)})?`
}
export const o = optional;

export function noncapturing(strings: TemplateStringsArray, ...vals: Array<string | number | RegExp>){
    return re`(?:${re(strings, ...vals)})`
}
export const nc = noncapturing;
export function lookahead(strings: TemplateStringsArray, ...vals: Array<string | number | RegExp>){
    return re`(?=${re(strings, ...vals)})`
}

export function notlookahead(strings: TemplateStringsArray, ...vals: Array<string | number | RegExp>){
    return re`(?!${re(strings, ...vals)})`
}

export function lookbehind(strings: TemplateStringsArray, ...vals: Array<string | number | RegExp>){
    return re`(?<=${re(strings, ...vals)})`
}
export function notlookbehind(strings: TemplateStringsArray, ...vals: Array<string | number | RegExp>){
    return re`(?<!${re(strings, ...vals)})`
}
export type special = 'unnamed' |'noncapturing' | 'lookahead' | 'lookbehind' | 'notlookahead' | 'notlookbehind' | 'optional';
export function group(groupname: string | special){
    return function(strings: TemplateStringsArray, ...vals: Array<string | number | RegExp>) {
        if (!groupname || groupname === 'unnamed'){
            return re`(${re(strings, ...vals)})`
        }
        if (groupname === 'noncapturing') return noncapturing(strings, ...vals);
        if (groupname === 'lookahead') return lookahead(strings, ...vals);
        if (groupname === 'lookbehind') return lookbehind(strings, ...vals);
        if (groupname === 'notlookahead') return notlookahead(strings, ...vals);
        if (groupname === 'notlookbehind') return notlookbehind(strings, ...vals);
        if (groupname === 'optional') return re(strings, ...vals).optional();
        return re`(?<${groupname}>${re(strings, ...vals)})`
    }
}

export const g = group;
export function between (left: string|RegExp, right: string|RegExp) {
    return function(strings: TemplateStringsArray, ...vals: Array<string | number | RegExp>) {
        return  re`${lookbehind`${left}`}${re(strings, ...vals)}${lookahead`${right}`}`
    }
}
