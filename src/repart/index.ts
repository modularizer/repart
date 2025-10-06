export {initialized, init} from "./init"; // Initialize prototype extensions first
import {init} from "./init";
import "./global"; // Import global RegExp extensions
init();
export const registered = true;
export {getGroupInfo, GroupDetails} from './decomposer';
export {getAllGroupNames, getGroupName} from './core';
export {r, re, stack, k} from './core';
export {match, extract, matchAndExtract, tryjson,
    type MatchOpts, type Result, type Extracted,
    type Parsed, type Raw, type ParsedResult, type RawResult,
    type RawGroupValue, type GroupValue
} from './match';
export {escape, allSpecialChars, type SpecialChar, SpecialCharMeanings} from './special';
export {dedup, type RegExpFlag, type RegExpFlags, allRegExpFlags, RegExpFlagMeanings} from './flags';
export {resolve, readFile} from './file';

export * from './common';
export * from './generic';
export * from './md';
export * from './preprocessors';