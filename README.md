# RePart

A TypeScript library for building complex regular expressions and parsing structured data from text. 

## Philosophy

> **Use this for complex stuff** - when your pattern gets out of control.

## Quick Reference

### Template Functions
- [`re`](#re-template-function) - Build patterns with interpolation: ``re`abc\s${'d'}\sefg${rx}hij${5}` ``
- [`r`](#r-template-function) - Raw string building: ``r`abc\s${/\d/}\sdef` ``

### RegExp Prototype Methods
- [`.withFlags(flags)`](#withflags) - Replace flags: `/hello/i.withFlags('g')` → `/hello/g`
- [`.addFlags(flags)`](#addflags) - Add flags: `/hello/i.addFlags('g')` → `/hello/gi`
- [`.removeFlags(flags)`](#removeflags) - Remove flags: `/hello/gi.removeFlags('i')` → `/hello/g`
- [`.as(name)`](#as) - Wrap in group: `/\d+/.as('number')` → `/(?<number>\d+)/`
- [`.wrappedWith(before, after?)`](#wrappedwith) - Wrap with delimiters: `/word/.wrappedWith('"')` → `/"word"/`
- [`.then(after)`](#then) - Concatenate: `/\d+/.then('\\s*')` → `/\d+\s* /`
- [`.optional()`](#optional) - Make optional: `/\d+/.optional()` → `/\d+?/`
- [`.repeated(min?, max?)`](#repeated) - Add quantifiers: `/\d/.repeated(1,3)` → `/\d{1,3}/`
- [`.spaced()`](#spaced) - Flexible whitespace: `/hello world/.spaced()` → matches "hello world", "hello  world", etc.
- [`.withParsers(parsers)`](#withparsers) - Add custom parsing: `pattern.withParsers({name: s => s.toUpperCase()})`


## Quick Start

```typescript
import {re, matchAndExtract} from 'repart';
import {EMAIL_PATTERN} from "repart/common";
import {word, num} from "repart/generic";

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
```

## Custom Parsers

```typescript
// Simple transformation
const pattern = re`name:\s*(?<name>\w+)`.withParsers({
  name: (s) => s.toUpperCase()
});

// Complex transformation with unnesting
const complexPattern = re`(?<prefix>.*?)name:\s*(?<name>\w+)`.withParsers({
  name: (s) => s.toUpperCase(),
  _prefix: null,  // Ignore prefix group
  groups: (data) => ({ title: data.name })
});

// Nested matching
const nestedPattern = re`user:\s*(?<userData>.*)`.withParsers({
  _userData: re`name:\s*(?<name>\w+),\s*age:\s*(?<age>\d+)` // Cascading parsing
});
```

### Parser Types
- **Functions**: `(raw: string) => any` - Transform matched content
- **RegExp**: For nested matching - Parse matched content with another pattern
- **null**: To ignore a group - Exclude from results
- **`_groupName`**: Unnest results - Flatten nested objects

---

## Detailed Reference


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
Build raw strings without regex compilation - useful for pattern building.

**Key Features:**
- Alias for `String.raw` - preserves backslashes
- No regex compilation - returns plain strings
- Useful for building patterns that will be used in other contexts
- Interpolates RegExp objects by converting to their source

```typescript
const rawPattern = r`word${/\d+/}end`; // "word\\d+end"

// Building patterns for later use
const basePattern = r`\d{${count}}`; // "\\d{3}"
const finalPattern = new RegExp(`^${basePattern}$`); // /^\d{3}$/

// Complex string building
const complexRaw = r`${/\w+/}${/\d+/}${/\s+/}`; // "\\w+\\d+\\s+"
```
---
### `.as(name)`
Wrap pattern in named group or special group type.

**Special Group Types:**
- `'unnamed'` - Regular capturing group `(pattern)`
- `'noncapturing'` - Non-capturing group `(?:pattern)`
- `'lookahead'` - Positive lookahead `(?=pattern)`
- `'lookbehind'` - Positive lookbehind `(?<=pattern)`
- `'notlookahead'` - Negative lookahead `(?!pattern)`
- `'notlookbehind'` - Negative lookbehind `(?<!pattern)`
- `'optional'` - Optional capturing group `(pattern)?`

```typescript
// Named groups
const pattern = /\d+/.as('number'); // (?<number>\d+)
const email = EMAIL_PATTERN.as('email'); // (?<email>email_pattern)

// Special group types
const noncap = /\w+/.as('noncapturing'); // (?:\w+)
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
### `.withParsers(parsers)`
Add custom parsing logic to regex patterns.

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
### `.addFlags(flags)`
Add flags to existing RegExp without removing existing ones.

**Key Features:**
- Adds new flags to existing flags
- Automatically deduplicates flags
- Preserves parsers from original RegExp

```typescript
// Add single flag
const pattern = /hello/i.addFlags('g'); // /hello/gi

// Add multiple flags
const multiFlag = /test/.addFlags('gi'); // /test/gi

// Add to already flagged pattern
const complex = /pattern/gi.addFlags('m'); // /pattern/gim

// With RegExp objects
const combined = re`${/\d+/i}${/\w+/g}`.addFlags('m'); // Combines child flags then adds 'm'
```
---
### `.removeFlags(flags)`
Remove specified flags from RegExp.

**Key Features:**
- Removes only specified flags, keeps others
- Preserves parsers from original RegExp
- Returns new RegExp with modified flags

```typescript
// Remove single flag
const pattern = /hello/gi.removeFlags('i'); // /hello/g

// Remove multiple flags
const multiRemove = /test/gim.removeFlags('gi'); // /test/m

// Remove all flags
const noFlags = /pattern/gi.removeFlags('gi'); // /pattern/

// Chaining
const chained = /test/gi.removeFlags('i').addFlags('m'); // /test/gm
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


## Export Reference

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
| `noncapturing` / `nc` | Non-capturing group | `noncapturing`\`hello\` → `/(?:hello)/` |
| `lookahead` | Positive lookahead | `lookahead`\`hello\` → `/(?=hello)/` |
| `lookbehind` | Positive lookbehind | `lookbehind`\`hello\` → `/(?<=hello)/` |
| `notlookahead` | Negative lookahead | `notlookahead`\`hello\` → `/(?!hello)/` |
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
| `replacedPattern` | Replace characters in pattern | `replacedPattern({' ': '\\s+'})` |
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

## When to Use RePart

**Use RePart when:**

- Building complex regex patterns that would be unmaintainable otherwise
- Need to parse structured data from text with custom transformations
- Working with configuration files, logs, or semi-structured text
- Want to avoid writing massive regex patterns
- Need cascading/recursive parsing capabilities

**Don't use RePart when:**

- Simple string matching (use native methods)
- Performance-critical applications (overhead of parsing system)
- Simple regex patterns (adds unnecessary complexity)


---

RePart transforms the way you think about regex patterns and text parsing, making complex operations manageable while maintaining the power and flexibility you need for real-world text processing tasks.
