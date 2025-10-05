import {init, matchAndExtract, re} from "../src/repart";
import {
    aZ,
    EMAIL_PATTERN,
    FLOAT_PATTERN_US,
    matchAnyState, PHONE_NUMBER_PATTERN,
    STATE_CODE_PATTERN,
    STATE_NAME_PATTERN,
    STATE_PATTERN
} from "../src/repart/common";
import {
    anyOf,
    fullword, gseparator,
    line,
    lookbehind,
    mline,
    noneOf,
    num, padded,
    paddedline,
    separator,
    word,
    wordList
} from "../src/repart/generic";
import {anything} from "../src/repart/generic";
import {anyWordBut} from "../src/repart/generic/builders";
init()

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
// console.log(pattern)
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
// const a = re`hello`.as('line');
// console.log(a)
// const p = line`${a}`
// console.log(p)
// console.log(p.source)
// const pattern = re`prefix: ${line`${re`hello`.as('line')}`}`;
// const result = matchAndExtract('prefix: \nhello', pattern);
// console.log(pattern)


//BAD:
// console.log(/(a)(?<line>hello)ab/) // /(a)(?<line>hello)(?<line>hello)ab/
// console.log(/(a)(hello)ab/) // /(a)(hello)(hello)ab/
// console.log(/(a)(b)(hello)ab/.info) // /(a)(b)(hello)(b)(hello)ab/
// console.log(/(a)(b)(hello)ab/.info.allGroupDetails) // /(a)(b)(hello)(b)(hello)ab/



// GOOD:
// console.log(/(a)(hello)/)
// console.log(/(hello)ab/)
// const pattern = mline`${re`hello`.as('mline')}`.withFlags('mg');
// const result = matchAndExtract('hello\nworld\ntest', pattern);
// const pattern = re`prefix:\s*(?<a>\d+)\s*${paddedline`hello`.as('paddedline2')}`;
// const result = matchAndExtract('prefix: 5  \nhello  \n', pattern);
const pattern = re`name:${padded`\w+`.as('padded')}`

const result = matchAndExtract('name:  john  ', pattern);

// const pattern = re`prefix: ${line`${re`hello`.as('line')}`}`;
// const result = matchAndExtract('prefix: \nhello', pattern);
console.log(pattern)
// console.log(matchAndExtract('prefix test', pattern))
// console.log(matchAndExtract('prefix world', pattern))
console.log(result)