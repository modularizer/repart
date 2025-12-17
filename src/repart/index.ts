export {r, re, asString, stack, k, getAllGroupNames, getGroupName, simpleRename, _simpleWithParsers, patternHasUnicode} from './core';

import { RepartRegExp, addToPrototype} from "./global";
declare global {
    interface RegExp extends RepartRegExp {}
}

// Call addToPrototype immediately when this module is imported
addToPrototype();

export const initialized = true;
export const init = () => true;

export const registered = true;
export {getGroupInfo, GroupDetails} from './decomposer';
export {match, extract, matchAndExtract, tryjson,
    type MatchOpts, type Result, type Extracted,
    type Parsed, type Raw, type ParsedResult, type RawResult,
    type RawGroupValue, type GroupValue
} from './match';
export {escape, allSpecialChars, type SpecialChar, SpecialCharMeanings} from './special';
export {dedup, type RegExpFlag, type RegExpFlags, allRegExpFlags, RegExpFlagMeanings} from './flags';
export {type UnnamedGroupType, UnnamedGroupTypeAliases} from "./grouping";

export * from './generic';


export * from './preprocessors';
export * from './common';
export * from './md';