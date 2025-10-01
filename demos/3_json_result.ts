import {registered} from "../src/repart";
console.log(registered)

// Basic usage
const pattern = /name: (?<name>\w+), age: (?<age>\d+)/;
const result = pattern.match("name: John, age: 25");

// Use like extracted data
console.log(result.name); // "John"
console.log(result.age);  // 25

// Access underlying data
console.log(result.parsed); // Parsed match data
console.log(result.groups); // Parsed match groups, shortcut to result.parsed.groups
console.log(result.extracted);  // Extracted data (appears same as result, just is the actual underlying value, typicall a Record<string, any>, not in the custom class)

// With options
const resultWithOptions = pattern.match("name: John, age: 25", {
    cacheInput: true
});

// JSON serialization works
console.log(JSON.stringify(result.valueOf())); // Includes all properties

// Object iteration
Object.keys(result); // ["name", "age", "raw", "parsed", "value"]