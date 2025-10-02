# RePart Test Suite

This directory contains comprehensive tests for the RePart library, covering all major features and functionality.

## Test Structure

The test suite is organized into the following categories:

### Core Features (`core.test.ts`)
- `re` template function
- `r` template function  
- `.as()` method for named groups
- `.withParsers()` method for custom parsing
- `.match()`, `.matchRaw()`, `.matchAndExtract()` methods
- Complex parsing scenarios

### Builder Methods (`builders.test.ts`)
- `.withFlags()`, `.addFlags()`, `.removeFlags()`
- `.wrappedWith()`, `.then()`, `.optional()`, `.repeated()`, `.spaced()`
- Method chaining
- Integration with `re` template

### Common Patterns (`common.test.ts`)
- `EMAIL_PATTERN`, `MAILTO_PATTERN`
- `PHONE_NUMBER_PATTERN`
- Number patterns (`INT_PATTERN_US`, `FLOAT_PATTERN_US`, etc.)
- State patterns (`STATE_CODE_PATTERN`, `STATE_NAME_PATTERN`)
- Utility functions (`toInt`, `toFloat`, `isInt`, `isFloat`)

### Generic Patterns (`generic-patterns.test.ts`)
- Line patterns (`newLine`, `endLine`, `startLine`)
- Character patterns (`any`, `anything`)
- Whitespace patterns (`space`)
- Word patterns (`word`, `fullword`, `w`)
- Word boundary patterns (`wordBoundary`, `notWordBoundary`)
- Digit patterns (`d`, `num`)

### Generic Builders (`generic-builders.test.ts`)
- `anyOf`, `noneOf`, `wordList`
- Group builders (`unnamed`, `optional`, `noncapturing`, `lookahead`, etc.)
- Special group types
- Complex combinations

### Generic Wrappers (`generic-wrappers.test.ts`)
- Triple quote wrappers (`tripleBacktick`, `tripleTick`, `tripleQuotation`)
- Single quote wrappers (`backtick`, `tick`, `quotation`)
- Bracket wrappers (`parenth`, `squareBracket`, `curlyBracket`)
- Complex wrapper combinations

### Generic Templates (`generic-templates.test.ts`)
- `padded`, `line`, `mline`, `paddedline`, `paddedmline`
- `separator` for content around delimiters
- Complex template combinations

### Markdown Patterns (`markdown.test.ts`)
- List items (`li`)
- Text formatting (`bold`, `italics`)
- Headers (`header`, `h1-h6`, `s1-s6`)
- Checkboxes (`checkbox`, `checkboxChecked`, `checkboxUnchecked`, `checkboxLine`)
- Agreements (`agreement`, `previewAgreement`)
- Links (`linkto`, `link`)

### Utility Functions (`utilities.test.ts`)
- `escape` for regex special characters
- `dedup` for removing duplicates
- Number utilities (`toInt`, `toFloat`, `isInt`, `isFloat`)
- Phone number utilities (`toPhoneNumber`, `isPhoneNumber`)
- State utilities (`matchAnyState`)

### Complex Scenarios (`complex-scenarios.test.ts`)
- Cascading parsing with nested patterns
- Unnesting with underscore prefix
- Multiple matches and global patterns
- Complex custom parsers
- Groups post-processing
- Real-world scenarios (logs, config files, CSV data)

## Running Tests

### Simple Demo Test
```bash
# Run the demo test
npx ts-node src/tests/run-tests.ts
```

### Individual Test Files
```bash
# Run a specific test file
npx ts-node src/tests/demo.test.ts
```

## Test Framework

The tests use a simple custom test framework (`simple-test-runner.ts`) that provides:
- `describe()` for test suites
- `test()` for individual tests
- `expect()` for assertions
- Automatic test execution and reporting

## Test Coverage

The test suite covers:
- ✅ All core functionality
- ✅ All builder methods
- ✅ All common patterns
- ✅ All generic patterns and builders
- ✅ All wrapper functions
- ✅ All template functions
- ✅ All markdown patterns
- ✅ All utility functions
- ✅ Complex real-world scenarios
- ✅ Edge cases and error handling
- ✅ Performance considerations

## Adding New Tests

To add new tests:

1. Create a new test file or add to an existing one
2. Use the `describe()` and `test()` functions
3. Use `expect()` for assertions
4. Import the test runner: `import './simple-test-runner';`
5. Run with: `npx ts-node your-test-file.ts`

## Test Patterns

### Basic Pattern Testing
```typescript
test('should match expected pattern', () => {
  const pattern = re`hello${'world'}`;
  expect(pattern.source).toBe('helloworld');
});
```

### Data Extraction Testing
```typescript
test('should extract data correctly', () => {
  const pattern = re`name: ${word.as('name')}`;
  const result = matchAndExtract('name: John', pattern);
  expect(result.name).toBe('John');
});
```

### Parser Testing
```typescript
test('should apply custom parsers', () => {
  const pattern = re`age: ${num.as('age')}`.withParsers({
    age: parseInt
  });
  const result = matchAndExtract('age: 25', pattern);
  expect(result.age).toBe(25);
  expect(typeof result.age).toBe('number');
});
```

### Multiple Matches Testing
```typescript
test('should handle multiple matches', () => {
  const pattern = re`${word.as('word')}`.withFlags('g');
  const result = matchAndExtract('hello world', pattern);
  expect(Array.isArray(result)).toBe(true);
  expect(result.length).toBe(2);
});
```
