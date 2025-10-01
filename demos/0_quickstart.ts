import {re} from '../src/repart';
import {EMAIL_PATTERN} from "../src/repart/common";
import {word, num} from "../src/repart/generic";

// Template-based regex building with NAMED GROUPS (required!)
const nameRx = word.as('name');
const ageRx = num.as('age');
const pattern: RegExp = re`name: ${nameRx}, age: ${ageRx},\s*email: ${EMAIL_PATTERN}`;
console.log(pattern) // /name: (?<name>\w+), age: (?<age>\d+),\s*email: (?<email>(?<emailHandle>[^\s@]+)@(?<emailDomain>[^\s@]+\.(?<emailTLD>[^\s@]+)))/d

const input = "name: John, age: 25, email: john@gmail.com";
const result = pattern.withParsers({
    name: (s: string) => s.toUpperCase(),
}).match(input);

// examine results
console.log(result.name);  // "JOHN"
console.log(result.age);   // 25
console.log(result.email); // "john@gmail.com"
console.log(result.emailHandle) // "john"
console.log(result.emailDomain) // "gmail.com"

// get details about the email match
const emailMatchDetails = result.groups.email;
const sInd = emailMatchDetails.startIndex;
const eInd = emailMatchDetails.endIndex;
console.log(sInd, eInd, input.slice(sInd, eInd)); // 28 42 john@gmail.com
