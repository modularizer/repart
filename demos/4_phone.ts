import {
    EMAIL_PATTERN, FLOAT_PATTERN_US, INT_PATTERN_US,
    PHONE_NUMBER_PATTERN,
    STATE_CODE_PATTERN,
    STATE_PATTERN,
    US_PHONE_NUMBER_PATTERN
} from "../src/repart/common";
import {matchAndExtract, re} from "../src/repart";
// console.log(PHONE_NUMBER_PATTERN)

const u = '+1-555-123-4567';
console.log(PHONE_NUMBER_PATTERN.info)
// console.log(PHONE_NUMBER_PATTERN.info.groupNames)

// const p = PHONE_NUMBER_PATTERN.as('jefophone');
const p = PHONE_NUMBER_PATTERN;
console.log(p.info);
// console.log(Object.keys(p.parsers ?? {}));
const ru = p.matchAndExtract(u);
console.log(ru)
// const p = '+44-20-7946-0958';
// const r = PHONE_NUMBER_PATTERN.matchAndExtract(p);
// console.log(r)

// console.log(PHONE_NUMBER_PATTERN.matchAndExtract('123'))
// const pattern = re`Name: ${/\w+/.as('name')},\s*
// Email:\s*${EMAIL_PATTERN},\s*
// Phone:\s*${PHONE_NUMBER_PATTERN},\s*
// State:\s*${STATE_PATTERN}\s*`


// const gpattern = re`Name: ${/\w+/.as('name')},\s*
// Email:\s*${EMAIL_PATTERN},\s*
// Phone:\s*${US_PHONE_NUMBER_PATTERN},\s*
// State:\s*${STATE_CODE_PATTERN}\s*`
// const pattern = re`Name: ${/\w+/.as('name')},\s*
// Email:\s*${EMAIL_PATTERN},\s*
// Phone:\s*${PHONE_NUMBER_PATTERN},\s*
// State:\s*${STATE_CODE_PATTERN}\s*`
// const pattern = re`Revenue: ${FLOAT_PATTERN_US.as('revenue')}, Units: ${INT_PATTERN_US.as('units')}`;
//
// const result = matchAndExtract('Revenue: 1,234,567.89, Units: 1,234', pattern);
// console.log(result);