# RePart

A TypeScript library for building complex regular expressions and parsing structured data from text. 

## Philosophy

> **Use this for complex stuff** - when your pattern gets out of control.

## Styles:
- We **always** use named groups
- We **always** use the `d` flag to get the indexes of the matched groups
- We manipulate the `RegExp` prototype, but not in a descructive way, just to add methods and a `parsers` attribute
- If that doesn't mesh with you, this library may drive you nuts... sorry

## Reference
- [Install](#install)
- [Quick Start](#quick-start)
- [Quick Reference](#quick-reference)
- [When to Use](#when-to-use-reparth)
- [Named Groups: they're where it's at](#named-groups-theyre-where-its-at)
- [Custom Parsers](#custom-parsers)
- [Detailed Reference](#detailed-reference)
- [Export Reference](#export-reference)

## [^](#reference) Install
TODO: add to npm, for now: clone

## [^](#reference) Quick Start
```typescript
import {re} from 'repart';
import {EMAIL_PATTERN} from "repart/common";
import {word, num} from "repart/generic";

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
```

## [^](#reference) Quick Reference
**Template Functions** Similar to `String.raw`, we provide some template functions except they build regexps...
- [re](#re-template-function) - Build patterns with interpolation: ``re`abc\s${'d'}\sefg${rx}hij${5}` ``
- [r](#r-template-function) - Just an alias of `String.raw` for building strings, not RegExps: ``r`abc\s${/\d/}\sdef` ``
- ... and [many more](#export-reference), like ``s4`Builders.*` `` from `repart/md`
- **how?** - just make a func with this signature `(strings: TemplateStringsArray, ...vals: Array<string | number | RegExp>) => RegExp`

**Builder methods** added to RegExp can be called on ANY RegExp, made in any way...
- [.withFlags(flags)](#withflags) - Replace flags: `/hello/i.withFlags('g')` → `/hello/g`, see also [addFlags](#addflags) and [removeFlags](#removeflags)
- [.as(name)](#as) - Wrap in group: `/\d+/.as('number')` → `/(?<number>\d+)/`
- [.wrappedWith(before, after?)](#wrappedwith) - Wrap a regexp: `/word/.wrappedWith('"')` → `/"word"/` or `/word/.wrappedWith('1 ', '2')` → `/1 word 2 "/`
- [.then(after)](#then) - Concatenate: `/\d+/.then('\\s*')` → `/\d+\s* /`
- [.optional()](#optional) - Make optional: `/\d+/.optional()` → `/\d+?/`
- [.repeated(min?, max?)](#repeated) - Add quantifiers: `/\d/.repeated(1,3)` → `/\d{1,3}/`
- [.spaced()](#spaced) - Flexible whitespace: `/hello world/.spaced()` → matches "hello world", "hello  world", etc.

**Parsing Setup** - `.withParsers` helps you setup post-processors, and cascading group processing
- [.withParsers(parsers)](#withparsers) - Add custom parsing: `pattern.withParsers({name: s => s.toUpperCase()})`
- [see more details](#withparsers)

**Custom Cascading Match** - match named groups and perform cascading matching/extraction for complex logic
- [.match(input, options?)](#match) - Match and return proxy object
    - e.g. `const r = /name: (?<name>\w+)/.match("name: John")`
      -  ->`{name: "John", raw: {...}, parsed: {...}, value: {...}}`
    - `.raw` gives the raw match, unparsed, but includes `startIndex`, `endIndex`, `pattern`, `raw`, etc.
    - `.parsed` gives the parsed raw result, still including all properties in `.raw`
    - `.value` gives the extracted value that `r` is proxying
    - [see more](#match)
- [.matchRaw(input, options?)](#matchraw) - Raw matching to get more details and not do the parsing or extraction steps `MatchRawResult`
- [.matchAndExtract(input, options?)](#matchandextract) - Direct extraction: returns `any`, commonly `Record<string, any>`


## [^](#reference) When to Use RePart

**Use RePart when:**

- Building complex regex patterns that would be unmaintainable otherwise
- Need to parse structured data from text with custom transformations
- Working with configuration files, logs, or semi-structured text
- Want to avoid writing massive regex patterns
- Need cascading/recursive parsing capabilities
- **You're comfortable using named groups** `(?<name>pattern)` in your regex patterns

**Don't use RePart when:**

- Simple string matching (use native methods)
- Performance-critical applications (overhead of parsing system)
- Simple regex patterns (adds unnecessary complexity)
- **You prefer unnamed groups** `(pattern)` - RePart won't work with these
- **You need array-based access** to match results (use `String.match()` instead)



## [^](#reference) Named Groups: they're where it's at
**RePart relies heavily on named groups** for all its matching and extraction functionality. This is a core design decision that affects how you use the library:

- **All RePart methods** (`.match()`, `.matchRaw()`, `.matchAndExtract()`) **rely heavily named groups**
- **Unnamed groups** like `(\w+)` are **not accessible** through RePart's methods
- **Group names must be unique** within each pattern - duplicate names will cause conflicts

### Create named groups using:
- the traditional way `/(?<name>.*)/`
- our custom builder `rx.as`, e.g. `` re`.*`.as('name')`` results in `/(?<name>.*)/`

### What Works vs What Doesn't

```typescript
// ✅ WORKS - standardNamed groups
const pattern = /name: (?<name>\w+), age: (?<age>\d+)/;
const result = pattern.match("name: John, age: 25");
console.log(result.name); // "John" ✅
console.log(result.age);  // 25 ✅

// ✅ WORKS - Named groups
const n = /w+/.as('name');
const a = re`\d+`.as('age');
const repartPattern: RegExp = re`name: ${n}, age: ${a}`;
const repartResult = pattern.match("name: John, age: 25");
console.log(result.name); // "John" ✅
console.log(result.age);  // 25 ✅

// ❌ DOESN'T WORK - Unnamed groups
const badPattern = /name: (\w+), age: (\d+)/;
const badResult = badPattern.match("name: John, age: 25");
console.log(badResult[0]); // undefined ❌
console.log(badResult[1]); // undefined ❌

// ✅ WORKS - Use native String.match() for unnamed groups
const nativeResult = "name: John, age: 25".match(/name: (\w+), age: (\d+)/);
console.log(nativeResult[1]); // "John" ✅
console.log(nativeResult[2]); // "25" ✅
```

## [^](#reference) Custom Parsers
Custom parsers can be used many ways. Think of them as callbacks called AFTER each group is matched

#### Ways to use:
1. convert the result to something else using `groupname: (s: string, opts?: {offet: number}) => any`
2. ignore the result by using `groupname: null`
3. do a cascading match by setting the parser to a pattern with `groupname: string |RegExp`

### unnesting
unnest values by preceding groupname with an underscore, e.g. `_groupname: handler`
- ``_body: re`name:\s*(?<name>\w+),\s*age:\s*(?<age>\d+)` ``
  - instead of getting `{body: {name: string, age: number}}`
  - you get `{name: string, age: number}`
  - basically you **replace** the originally matched group name with your unnested child group(s) which look like they were higher level matches
  - useful to create a flatter return structure

### Postprocessing
postprocess the groups produced using `groups: (data: Record<string, any) => any`


```typescript
// Simple transformation
import {re} from "repart";

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

```

---

## [^](#reference) Detailed Reference


### `re` Template Function
Build RegExp patterns with interpolation, preserving flags and parsers from child patterns.

**Key Features:**
- Interpolates strings, numbers, and RegExp objects
- Preserves flags from child RegExp patterns (combines them)
- Preserves parsers from child RegExp patterns (merges them)
- Uses raw strings (no escaping needed for backslashes)

```typescript
const count = 3;
const emailPattern = EMAIL_PATTERN;
const pattern = re`\d{${count}}`; // /\d{3}/

// Combining patterns with flags
const mailtoPattern = re`mailto:${emailPattern}`; // Combines patterns with flags

// Complex interpolation
const complexPattern = re`^${/\d+/.as('id')}\s*:\s*${/\w+/.as('name')}$`;
// Result: /^(?<id>\d+)\s*:\s*(?<name>\w+)$/

// With parsers
const parsedPattern = re`${/\d+/.withParsers({id: parseInt)}}`;
```
---
### `r` Template Function
- Alias for `String.raw` - preserves backslashes

---
### `.as(name)`
Wrap pattern in named group or special group type.

**⚠️ Important:** Group names must be **unique** within each pattern. Duplicate names will cause conflicts and unexpected behavior.

**Special Group Types:**
- `'unnamed'` - Regular capturing group `(pattern)` - **Not accessible via RePart methods**
- `'nonCapturing'` - Non-capturing group `(?:pattern)` - **Not accessible via RePart methods**
- `'lookahead'` - Positive lookahead `(?=pattern)` - **Not accessible via RePart methods**
- `'lookbehind'` - Positive lookbehind `(?<=pattern)` - **Not accessible via RePart methods**
- `'negativeLookahead'` - Negative lookahead `(?!pattern)` - **Not accessible via RePart methods**
- `'notlookbehind'` - Negative lookbehind `(?<!pattern)` - **Not accessible via RePart methods**
- `'optional'` - Optional capturing group `(pattern)?` - **Not accessible via RePart methods**

```typescript
// Named groups
const pattern = /\d+/.as('number'); // (?<number>\d+)
const email = EMAIL_PATTERN.as('email'); // (?<email>email_pattern)

// Special group types
const noncap = /\w+/.as('nonCapturing'); // (?:\w+)
const lookahead = /\d+/.as('lookahead'); // (?=\d+)
const optional = /\w+/.as('optional'); // (\w+)?
const lookbehind = /\d+/.as('lookbehind'); // (?<=\d+)

// Chaining
const complex = /\d+/.as('id').then('\\s*').as('spaced'); // (?<spaced>(?<id>\d+)\s*)
```

---
### `.withFlags(flags)`
Replace all flags with new ones.

**Available Flags:**
- `'g'` - Global (find all matches)
- `'i'` - Ignore case
- `'m'` - Multiline (^ and $ match line boundaries)
- `'s'` - Dotall (. matches newlines)
- `'u'` - Unicode
- `'y'` - Sticky
- `'d'` - Has indices

```typescript
// Replace flags
const pattern = /hello/i.withFlags('g'); // /hello/g

// Multiple flags
const multiFlag = /test/.withFlags('gi'); // /test/gi

// Remove all flags
const noFlags = /pattern/gi.withFlags(''); // /pattern/

// With RegExp objects
const complex = re`${/\d+/i}${/\w+/g}`.withFlags('m'); // Combines child flags then replaces
```

---
### `.addFlags(flags)`
Add flags to existing RegExp without removing existing ones.

---
### `.removeFlags(flags)`
Remove certain flags from existing RegExp.

---
### `.withParsers(parsers)`
Add custom parsing logic to regex patterns. See also [Custom Parsers](#custom-parsers) for more details

**Parser Types:**
- **Functions**: `(raw: string) => any` - Transform matched content
- **RegExp**: For nested matching - Parse matched content with another pattern
- **null**: To ignore a group - Exclude from results
- **`_groupName`**: Unnest results - Flatten nested objects
- **`groups`**: Post-process all groups - `(data) => transformedData`

```typescript
// Simple transformation
const pattern = re`name:\s*(?<name>\w+)`.withParsers({
  name: (s) => s.toUpperCase()
});

// Complex parsing with unnesting
const complexPattern = re`(?<prefix>.*?)name:\s*(?<name>\w+)`.withParsers({
  name: (s) => s.toUpperCase(),
  _prefix: null,  // Ignore prefix group
  groups: (data) => ({ title: data.name })
});

// Nested matching
const nestedPattern = re`user:\s*(?<userData>.*)`.withParsers({
  _userData: re`name:\s*(?<name>\w+),\s*age:\s*(?<age>\d+)` // Cascading parsing
});

// Multiple transformations
const multiPattern = re`(?<id>\d+):(?<name>\w+):(?<score>\d+)`.withParsers({
  id: parseInt,
  name: (s) => s.toLowerCase(),
  score: parseFloat,
  groups: (data) => ({ 
    player: { id: data.id, name: data.name }, 
    points: data.score 
  })
});
```

---
### `.wrappedWith(before, after?)`
Wrap pattern with delimiters.

**Key Features:**
- If only one parameter provided, uses it for both sides
- Automatically escapes special regex characters in delimiters
- Preserves parsers from original RegExp

```typescript
// Single delimiter (same on both sides)
const pattern = /word/.wrappedWith('"'); // /"word"/

// Different delimiters
const bracketed = /\d+/.wrappedWith('[', ']'); // /\[\d+\]/
const parens = /\w+/.wrappedWith('(', ')'); // /\(\w+\)/

// Complex delimiters
const complex = /\d+/.wrappedWith('\\s*', '\\s*'); // /\s*\d+\s*/

// With RegExp objects
const regexDelims = /\w+/.wrappedWith(re`\(`, re`\)`); // /\(\w+\)/

// Chaining
const chained = /\d+/.wrappedWith('"').optional(); // /"\d+"?/
```
---
### `.then(after)`
Concatenate pattern with another pattern.

**Key Features:**
- Accepts strings, RegExp objects, or undefined
- Preserves parsers from both patterns (merges them)
- Preserves flags from both patterns (combines them)
- Returns new RegExp with concatenated pattern

```typescript
// With strings
const pattern = /\d+/.then('abc'); // /\d+abc/

// With RegExp objects
const emailPattern = /user/.then('@').then(/domain/); // /user@domain/

// Chaining multiple patterns
const complex = /\d+/.then('\\s*').then(/\w+/).then('\\s*'); // /\d+\s*\w+\s*/

// With undefined (no-op)
const noOp = /\d+/.then(undefined); // /\d+/

// Mixed types
const mixed = /\d+/.then('\\s*').then(re`${/\w+/i}`); // /\d+\s*\w+/i
```
---
### `.optional()`
Make pattern optional (0 or 1 matches).

**Key Features:**
- Adds `?` quantifier to pattern
- Preserves parsers from original RegExp
- Returns new RegExp with optional matching

```typescript
// Basic optional
const pattern = /\d+/.optional(); // /\d+?/ or /(\d+)? /

// Complex optional patterns
const complex = /\d+/.then('\\s*').then(/\w+/).optional(); // /\d+\s*\w+?/

// Chaining with other methods
const chained = /\d+/.optional().then('\\s*').then(/\w+/); // /\d+?\s*\w+/

// With named groups
const named = /\d+/.as('id').optional(); // (?<id>\d+)?/
```
---
### `.repeated(min?, max?)`
Add repetition quantifiers to pattern.

**Key Features:**
- `min` - Minimum number of repetitions (default: 0)
- `max` - Maximum number of repetitions (default: undefined for unlimited)
- Preserves parsers from original RegExp
- Returns new RegExp with repetition quantifiers

**Common Quantifiers:**
- `repeated(0)` - Zero or more (`*`)
- `repeated(1)` - One or more (`+`)
- `repeated(0, 1)` - Zero or one (`?`)
- `repeated(2, 4)` - Between 2 and 4 (`{2,4}`)
- `repeated(3)` - Exactly 3 (`{3}`)

```typescript
// Basic repetition
const pattern = /\d/.repeated(1, 3); // /\d{1,3}/ or /(\d){1,3} /

// Common quantifiers
const zeroOrMore = /\w/.repeated(0); // /\w* /
const oneOrMore = /\w/.repeated(1); // /\w+/
const zeroOrOne = /\w/.repeated(0, 1); // /\w?/

// Exact count
const exactly3 = /\d/.repeated(3); // /\d{3}/

// Complex patterns
const complex = /\d+/.then('\\s*').then(/\w+/).repeated(1, 3); // /\d+\s*\w+{1,3}/
```
---
### `.spaced()`
Make spaces match consecutive whitespace (excluding newlines).

**Key Features:**
- Replaces literal spaces with `\s+` (one or more whitespace)
- Preserves newlines (doesn't match `\n` or `\r`)
- Preserves parsers from original RegExp
- Useful for flexible whitespace matching

```typescript
// Basic spacing
const pattern = /hello world/.spaced(); // Matches "hello world", "hello  world", "hello\tworld", etc.

// Multiple spaces
const multiSpace = /\d+  \w+/.spaced(); // /\d+\s+\w+/

// Complex patterns
const complex = /\d+ \w+ \d+/.spaced(); // /\d+\s+\w+\s+\d+/

// With other methods
const chained = /\d+ \w+/.spaced().optional(); // /\d+\s+\w+?/

// Mixed with other whitespace
const mixed = /\d+\s*\w+ \d+/.spaced(); // /\d+\s*\w+\s+\d+/
```
---
### `.match(input, options?)`
Perform regex matching and return a proxy object that behaves like extracted data.

**Key Features:**
- Returns an object that acts like the extracted data
- Provides access to `.parsed`, and `.extracted` properties
- Always available, even when no match is found

**Options:** typically unnecessary, defaults work well...
- `maxMatches` - Maximum number of matches to return
  - this gets autoset to Infinity if 
    - the pattern has the 'g' flag
    - maxMatches is set to null
  - gets autoset to 1 if
    - the pattern does not have the 'g' flag
- `offset` - Starting position in the string
- `flags` - Additional flags to apply
  - if maxMatches is supplied, we autoadd or remove the 'g' flag based on if maxMatches > 1
- `lastIndex` - Starting index for global patterns
- `name` - Name for the match result
- `cacheInput` - Whether to cache the input string

```typescript
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
console.log(result.value);  // same as .extracted

// With options
const resultWithOptions = pattern.match("name: John, age: 25", { 
  cacheInput: true 
});

// use .value or .extracted for JSON serialization
console.log(JSON.stringify(result.value));

```
---
### `.matchRaw(input, options?)`
Perform raw regex matching and return a MatchRawResult with detailed information.

**Key Features:**
- Returns a MatchRawResult with `.result` getter
- Provides access to detailed match information (indices, groups, etc.)
- Uses lazy evaluation for parsing and extraction
- Always available, even when no match is found

**Options:**
- `maxMatches` - Maximum number of matches to return
- `offset` - Starting position in the string
- `flags` - Additional flags to apply
- `lastIndex` - Starting index for global patterns
- `name` - Name for the match result
- `cacheInput` - Whether to cache the input string

```typescript
// Basic usage
const pattern = /name: (?<name>\w+), age: (?<age>\d+)/;
const rawResult = pattern.matchRaw("name: John, age: 25");

// Access the proxy object
const result = rawResult.result;
console.log(result.name); // "John"
console.log(result.age);  // 25

// Access raw data directly
console.log(rawResult.startIndex); // 0
console.log(rawResult.endIndex);   // 20
console.log(rawResult.groups);     // {name: "John", age: "25"}

// With options
const rawWithOptions = pattern.matchRaw("name: John, age: 25", { 
  cacheInput: true 
});
```
---
### `.matchAndExtract(input, options?)`
Perform regex matching and extract structured data in one step.

**Key Features:**
- Returns extracted data directly without proxy wrapper
- Combines matching and extraction in a single call
- Always available, even when no match is found
- Returns null when no match is found

**Options:**
- `maxMatches` - Maximum number of matches to return
- `offset` - Starting position in the string
- `flags` - Additional flags to apply
- `lastIndex` - Starting index for global patterns
- `name` - Name for the match result
- `cacheInput` - Whether to cache the input string

```typescript
// Basic usage
const pattern = /name: (?<name>\w+), age: (?<age>\d+)/;
const data = pattern.matchAndExtract("name: John, age: 25");

console.log(data.name); // "John"
console.log(data.age);  // 25

// With custom parsers
const parsedPattern = pattern.withParsers({
  age: parseInt
});
const parsedData = parsedPattern.matchAndExtract("name: John, age: 25");

console.log(parsedData.name); // "John"
console.log(parsedData.age);  // 25 (number)

// With options
const dataWithOptions = pattern.matchAndExtract("name: John, age: 25", { 
  cacheInput: true 
});

// No match returns null
const noMatch = pattern.matchAndExtract("no match here");
console.log(noMatch); // null
```


## [^](#reference) Export Reference

### Pattern Constants

| Export | Description | Usage Example |
|--------|-------------|--------------|
| `EMAIL_PATTERN` | Email address with named groups | `EMAIL_PATTERN.as('email')` |
| `MAILTO_PATTERN` | Mailto links with email parsing | `MAILTO_PATTERN.as('mailto')` |
| `PHONE_NUMBER_PATTERN` | Phone numbers with country/area codes | `PHONE_NUMBER_PATTERN.as('phone')` |
| `INT_PATTERN_US` | US integer format (commas) | `INT_PATTERN_US.as('count')` |
| `INT_PATTERN_EU` | EU integer format (dots) | `INT_PATTERN_EU.as('count')` |
| `INT_PATTERN_UNDERSCORE` | Underscore-separated integers | `INT_PATTERN_UNDERSCORE.as('count')` |
| `FLOAT_PATTERN_US` | US float format (comma thousands, dot decimal) | `FLOAT_PATTERN_US.as('price')` |
| `FLOAT_PATTERN_EU` | EU float format (dot thousands, comma decimal) | `FLOAT_PATTERN_EU.as('price')` |
| `STATE_CODE_PATTERN` | US state abbreviations (AL, CA, etc.) | `STATE_CODE_PATTERN.as('state')` |
| `STATE_NAME_PATTERN` | US state names (Alabama, California, etc.) | `STATE_NAME_PATTERN.as('state')` |
| `STATE_PATTERN` | Either state codes or names | `STATE_PATTERN.as('state')` |

### Template Functions

| Export | Description | Usage Example |
|--------|-------------|--------------|
| `padded` / `p` | Pattern with optional whitespace padding | `padded`\`hello\` → `/\s*hello\s*/` |
| `line` | Complete line without multiline mode | `line`\`hello\` → Uses startLine/endLine patterns |
| `mline` | Complete line with multiline mode | `mline`\`hello\` → `/^hello$/m` |
| `paddedline` | Padded line without multiline | `paddedline`\`hello\` → Padded version of line |
| `paddedmline` | Padded line with multiline | `paddedmline`\`hello\` → Padded multiline version |
| `separator` / `sep` | Captures content around separator | `separator`\`;\` → Groups: before, match, after |

### Builder Functions

| Export | Description | Usage Example |
|--------|-------------|--------------|
| `anyOf` | Match any of multiple patterns | `anyOf('hello', 'world', /\d+/)` |
| `noneOf` | Match anything except specified patterns | `noneOf('hello', 'world')` |
| `wordList` | Match from list of words with options | `wordList(['hello', 'world'], {ignoreCase: true})` |
| `group` / `g` | Create named or special groups | `group('name')`\`hello\` → `/(?<name>hello)/` |
| `unnamed` / `u` | Regular capturing group | `unnamed`\`hello\` → `/(hello)/` |
| `optional` / `o` | Optional group | `optional`\`hello\` → `/(hello)?/` |
| `nonCapturing` / `nc` | Non-capturing group | `nonCapturing`\`hello\` → `/(?:hello)/` |
| `lookahead` | Positive lookahead | `lookahead`\`hello\` → `/(?=hello)/` |
| `lookbehind` | Positive lookbehind | `lookbehind`\`hello\` → `/(?<=hello)/` |
| `negativeLookahead` | Negative lookahead | `negativeLookahead`\`hello\` → `/(?!hello)/` |
| `notlookbehind` | Negative lookbehind | `notlookbehind`\`hello\` → `/(?<!hello)/` |

### Pattern Constants (Basic)

| Export | Description | Usage Example |
|--------|-------------|--------------|
| `newLine` | Line break pattern | `newLine` → `/\r?\n/` |
| `endLine` | End of line (lookahead) | `endLine` → `/(?=\r?\n|$)/` |
| `startLine` | Start of line (lookbehind) | `startLine` → `/(?<![^\r\n])/` |
| `any` | Any character | `any` → `/[\s\S]/` |
| `anything` | Any characters (non-greedy) | `anything` → `/[\s\S]*?/` |
| `space` | Whitespace (excluding newlines) | `space` → `/[^\S\r\n]*/` |
| `word` | Word characters | `word` → `/\w+/` |
| `fullword` | Word with boundaries | `fullword` → `/\b\w+\b/` |
| `w` | Single word character | `w` → `/\w/` |
| `d` | Single digit | `d` → `/\d/` |
| `num` | One or more digits | `num` → `/\d+/` |
| `wordBoundary` | Word boundary | `wordBoundary` → `/\b/` |
| `notWordBoundary` | Not word boundary | `notWordBoundary` → `/\B/` |

### Wrapper Functions

| Export | Description | Usage Example |
|--------|-------------|--------------|
| `tripleBacktick` | Triple backtick delimiters | `tripleBacktick`\`code\` → Matches \`\`\`code\`\`\` |
| `tripleTick` | Triple single quote delimiters | `tripleTick`\`code\` → Matches '''code''' |
| `tripleQuotation` | Triple double quote delimiters | `tripleQuotation`\`code\` → Matches """code""" |
| `tripleQuote` | Any triple quote type | `tripleQuote`\`code\` → Matches any triple quote |
| `backtick` | Single backtick delimiters | `backtick`\`code\` → Matches \`code\` |
| `tick` | Single quote delimiters | `tick`\`code\` → Matches 'code' |
| `quotation` | Double quote delimiters | `quotation`\`code\` → Matches "code" |
| `anyQuotation` | Any quote character | `anyQuotation` → /[`'"]/ |
| `quote` | Any quote-wrapped content | `quote`\`content\` → Matches any quoted content |
| `parenth` / `pa` | Parentheses wrapper | `parenth`\`content\` → /\(content\)/ |
| `squareBracket` / `sb` | Square bracket wrapper | `squareBracket`\`content\` → /\[content\]/ |
| `curlyBracket` / `cb` | Curly bracket wrapper | `curlyBracket`\`content\` → /\{content\}/ |

### Markdown Functions

| Export | Description | Usage Example |
|--------|-------------|--------------|
| `li` | List item pattern | `li`\`item\` → Matches list items |
| `bold` / `b` | Bold text pattern | `bold`\`text\` → Matches **text** |
| `italics` / `i` | Italic text pattern | `italics`\`text\` → Matches *text* |
| `header` | Generic header pattern | `header` → Matches # headers |
| `h1` - `h6` | Specific header levels | `h1` → Matches # headers |
| `s1` - `s6` | Header with specific number of # | `s1` → Matches exactly 1 # |
| `checkbox` | Checkbox pattern | `checkbox` → Matches [ ] or [x] |
| `checkboxChecked` | Checked checkbox | `checkboxChecked` → Matches [x] or [X] |
| `checkboxUnchecked` | Unchecked checkbox | `checkboxUnchecked` → Matches [ ] |
| `checkboxLine` | Checkbox with content | `checkboxLine`\`task\` → Matches [ ] task |
| `agreement` | Agreement checkbox pattern | `agreement` → Matches **key** notes |
| `previewAgreement` | Preview agreement format | `previewAgreement` → Complex agreement pattern |
| `linkto` | Link destination pattern | `linkto`\`url\` → Matches link destinations |
| `link` | Complete link pattern | `link` → Matches [text](url) |

### Utility Functions

| Export | Description | Usage Example |
|--------|-------------|--------------|
| `replacedPattern` | Replace characters in pattern | `replacedPattern([[/\s+/, space]])` |
| `toInt` | Parse string to integer | `toInt('123')` → 123 |
| `toFloat` | Parse string to float | `toFloat('123.45')` → 123.45 |
| `isInt` | Check if string is integer | `isInt('123')` → true |
| `isFloat` | Check if string is float | `isFloat('123.45')` → true |
| `buildNumberPatterns` | Build custom number patterns | `buildNumberPatterns({locale: 'us'})` |
| `toPhoneNumber` | Parse phone number | `toPhoneNumber('+1-555-123-4567')` |
| `isPhoneNumber` | Validate phone number | `isPhoneNumber('555-123-4567')` → true |
| `matchAnyState` | Match US state from string | `matchAnyState('California')` → {code: 'CA', name: 'California'} |
| `escape` | Escape regex special characters | `escape('hello.world')` → 'hello\\.world' |
| `dedup` | Remove duplicate characters | `dedup('aabbcc')` → 'abc' |


---

RePart transforms the way you think about regex patterns and text parsing, making complex operations manageable while maintaining the power and flexibility you need for real-world text processing tasks.
