// Simple transformation
import {re} from "../src/repart";

const pattern = re`name:\s*(?<name>\w+)`.withParsers({
    name: (s: string) => s.toUpperCase()
});
console.log(pattern.match('name: john')) // { name: 'JOHN' }

// Complex transformation with unnesting
const complexPattern = re`(?<indentation>\s*)(?<statement>.*?name):\s*(?<name>\w+)`.withParsers({
    name: (s: string) => s.toUpperCase(),
    indentation: null,  // Ignore this group: in practice, this could have been left unnamed, but if it using prebuilt components you may loose flexibility over names
    groups: (data) => ({ title: data.name, msg: data.statement })
});
console.log(complexPattern.match('his name: john')) // { title: 'JOHN', msg: 'his name' }



// Nested matching
const nestedPattern = re`users:\s*(?<users>.*)$`.withFlags('s').withParsers({
    users: re`name:\s*(?<name>\w+),\s*age:\s*(?<age>\d+)`.withFlags('g') // Cascading parsing
})
console.log(nestedPattern.match(`
    users:
    - name: john, age: 25
    - name: sarah, age: 27
    - name: david, age: 19
    `))
// {
//     users: [
//         { name: 'john', age: 25 },
//         { name: 'sarah', age: 27 },
//         { name: 'david', age: 19 }
//     ]
// }
