import {FLOAT_PATTERN_EU, INT_PATTERN_US} from "../src/repart/common";
import {matchAndExtract} from "../src/repart";


const n = '1,234';
console.log('m', INT_PATTERN_US.matchAndExtract(n))

const result = matchAndExtract('1.234,56', FLOAT_PATTERN_EU)
console.log(result)