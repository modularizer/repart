import {matchAndExtract, re} from "../src/repart";
import {
    aZ,
    EMAIL_PATTERN,
    FLOAT_PATTERN_US,
    matchAnyState, PHONE_NUMBER_PATTERN,
    STATE_CODE_PATTERN,
    STATE_NAME_PATTERN,
    STATE_PATTERN
} from "../src/repart/common";
import {anyOf, fullword, lookbehind, noneOf, num, word, wordList} from "../src/repart/generic";
import {anything} from "../src/repart/generic";
import {anyWordBut} from "../src/repart/generic/builders";

// // const result = matchAndExtract('CA', STATE_CODE_PATTERN);
// // console.log(result);
// console.log(STATE_PATTERN)
// console.log('x', STATE_PATTERN.match('California'))
// console.log(STATE_NAME_PATTERN)
// console.log('x', STATE_NAME_PATTERN.match('California'))
// console.log('x', STATE_NAME_PATTERN.match('California'))
// console.log(STATE_PATTERN.as('taco'))
// console.log('x', STATE_PATTERN.as('taco').match('CA'))
//
// console.log(matchAnyState('California'))

// const pattern = re`${FLOAT_PATTERN_US.as('amount')}`;
// const result = matchAndExtract('1,234.56', pattern);
// console.log(result);

// const pattern = re`Name: ${/\w+/.as('name')},
// Email: ${EMAIL_PATTERN},
// Phone: ${PHONE_NUMBER_PATTERN},
// State: ${STATE_PATTERN.as('taco')}`.spaced()
// // console.log(pattern)
//
// const nestedPattern = re`name: ${word.as('name')}, age: ${num.as('age')}`;
// const pattern = re`user: ${/.*/.as('userData')}`.withParsers({
//     userData: nestedPattern
// });
// // const pattern = re`user: ${/.*/.as('userData')}`;
// console.log(pattern)
//
// const result = pattern.match('user: name: john, age: 25');
// const pattern = re`${word.as('word')}`.withFlags('g');
// const result = pattern.match('hello world test');


// const pattern = wordList(['café', 'naïve']).as("wordList");
// const pattern = wordList(['café', 'naïve']).as("wordList");
// // const pattern = /(?<!\p{L})(?:naïve|café)(?!\p{L})/u;
// const result = matchAndExtract('at the café i was', pattern);
// const pattern = re`${fullword}${fullword}`;
// const result = matchAndExtract('hello world', pattern);
const pattern = re`${re`${aZ}+`.as('word')}${num.as('number')}`;
const result = matchAndExtract('hello123', pattern);
console.log(pattern)
// console.log(matchAndExtract('prefix test', pattern))
// console.log(matchAndExtract('prefix world', pattern))
console.log(result)
