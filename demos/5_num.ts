import {FLOAT_PATTERN_EU, FLOAT_PATTERN_US, INT_PATTERN_US} from "../src/repart/common";
import {matchAndExtract, re} from "../src/repart";


const n = '1,234';
console.log('m', INT_PATTERN_US.matchAndExtract(n))

const result = matchAndExtract('1.234,56', FLOAT_PATTERN_EU)
console.log(result)

// const pattern = re`Amount: ${FLOAT_PATTERN_US.as('amount')}`;
// console.log(pattern)
// const result = matchAndExtract('Amount: 1,234.56', pattern);
// console.log(result)