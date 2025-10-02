import {matchAndExtract, re} from "../src/repart";
import {
    EMAIL_PATTERN,
    FLOAT_PATTERN_US,
    matchAnyState, PHONE_NUMBER_PATTERN,
    STATE_CODE_PATTERN,
    STATE_NAME_PATTERN,
    STATE_PATTERN
} from "../src/repart/common";

// // const result = matchAndExtract('CA', STATE_CODE_PATTERN);
// // console.log(result);
// console.log(STATE_PATTERN)
// console.log('x', STATE_PATTERN.match('California'))
// console.log(STATE_NAME_PATTERN)
// console.log('x', STATE_NAME_PATTERN.match('California'))
// console.log('x', STATE_NAME_PATTERN.match('California'))
// console.log('x', STATE_PATTERN.match('CA'))
//
// console.log(matchAnyState('California'))

// const pattern = re`${FLOAT_PATTERN_US.as('amount')}`;
// const result = matchAndExtract('1,234.56', pattern);
// console.log(result);

const pattern = re`Name: ${/\w+/.as('name')},
Email: ${EMAIL_PATTERN},
Phone: ${PHONE_NUMBER_PATTERN},
State: ${STATE_PATTERN}`.spaced()
console.log(pattern)
