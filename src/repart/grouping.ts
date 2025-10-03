import {asString, re} from "./core";

const gn = re`(?<groupname>\w+)`;
const unescaped = /(?<!\\)/
const groupstart = re`${unescaped}\(`;

const groupend = re`${unescaped}\)`;
const namedgroupstart = re`${groupstart}\?<${gn}>`;
const optionallynamedgroupstart = re`${groupstart}(\?<${gn}>)?`;
const any = /[\s\S]/;

const groupnameExtractor = re`^${namedgroupstart}${any}*\)$`;

export function getGroupName(rx: string | RegExp): string | undefined {
    const s = asString(rx);
    return s.match(new RegExp(s))?.groups?.groupname || undefined;
}
export function getAllGroupstarts(rx: string | RegExp): string | undefined {
    const s = asString(rx);
    const p = new RegExp(optionallynamedgroupstart.source, 'g');

    // const p = optionallynamedgroupstart.withFlags('g');
    //@ts-ignore
    return p.matchAndExtract(s);
}
export function getAllGroupNames(rx: string | RegExp): string[] {
    const s = asString(rx);
    //@ts-ignore
    return namedgroupstart.withFlags('g').matchAndExtract(s) ?? [];
}


export type UnnamedGroupType = 'capturing' |'non-capturing' | 'positive-lookahead' | 'positive-lookbehind' | 'negative-lookahead' | 'negative-lookbehind';
export type UnnamedGroupTypeAliases = 'unnamed' | 'nc' | 'lookahead' | 'lookbehind' | 'nlookahead' | 'nlookbehind';
export type GroupType = 'named' | UnnamedGroupType;
export const groupStarts: Record<GroupType, string> = {
    'named': '<',
    'positive-lookbehind': '?<=',
    'negative-lookbehind': '?<!',
    'non-capturing': '?:',
    'positive-lookahead': '?=',
    'negative-lookahead': '?!',
    'capturing': '',
}
export const groupTypes: Record<string, GroupType> = {
    capturing: 'capturing',
    noncapturing: 'non-capturing',
    positivelookahead: 'positive-lookahead',
    negativelookahead: 'negative-lookahead',
    lookbehind: 'positive-lookbehind',
    negativelookbehind: 'negative-lookbehind',
    named: 'named',
}







