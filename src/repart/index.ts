import {addToPrototype} from "./global";
addToPrototype();
export const registered = true;

export {r, re, stack, k} from './re';
export {match, extract, matchAndExtract, tryjson,
    type MatchOpts, type Result, type Extracted,
    type Parsed, type Raw, type ParsedResult, type RawResult,
    type RawGroupValue, type GroupValue
} from './match';
export {escape, allSpecialChars, type SpecialChar, SpecialCharMeanings} from './special';
export {dedup, type RegExpFlag, type RegExpFlags, allRegExpFlags, RegExpFlagMeanings} from './flags';
export {resolve, readFile} from './file';

export * as common from './common';
export * as generic from './generic';
export * as md from './md';
export * as pre from './preprocessors';