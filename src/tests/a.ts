// Basic interpolation
import {re, matchAndExtract, common} from '../repart';
import {EMAIL_PATTERN} from "../repart/common";
import {word, num} from "../repart/generic";

// Template-based regex building
const pattern: RegExp = re`name: ${word.as('name')}, age: ${num.as('age')},\s*email: ${EMAIL_PATTERN}`;

// Advanced parsing with custom transformations
console.log(matchAndExtract("name: John, age: 25, email: john@gmail.com", pattern.withParsers({
    name: (s: string) => s.toUpperCase()
})));
// {
//     name: 'JOHN',
//     age: 25,
//     email: 'john@gmail.com',
//     emailHandle: 'john',
//     emailDomain: 'gmail.com',
//     emailTLD: 'com'
// }


const count = 3;
console.log(re`\d`.repeated(3))
console.log(re`\d`.repeated(0, null))
console.log(re`\d`.repeated(1, Infinity))
console.log(re`\d`.repeated(2, Infinity))
console.log(re`\d`.repeated(3, 5))
console.log(re`\d`.repeated(3, 5).as('nums').optional())
const pattern2: RegExp = re`test`.as('word')
    .then(re`\s*#?\s*`)
    .then(
        re`\d{${count}}`.as('num').then('?')
    ).as('full').wrappedWith(/\s*/).withFlags('i'); // Equivalent to /\s*(?<word>test)\s*#?\s*(?<num>\d{3})?\s*/i
console.log(pattern2);

const a = ' Test457 '