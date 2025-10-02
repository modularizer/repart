import { re, matchAndExtract } from '../repart';
import {
  anyOf,
  noneOf,
  wordList,
  unnamed,
  u,
  optional,
  o,
  noncapturing,
  nc,
  lookahead,
  notlookahead,
  lookbehind,
  notlookbehind,
  group,
  g,
  special
} from '../repart/generic';

describe('Generic Builders', () => {
  describe('anyOf', () => {
    test('should match any of multiple strings', () => {
      const pattern = anyOf('hello', 'world', 'test');
      const testCases = ['hello', 'world', 'test'];

      testCases.forEach(testCase => {
        const result = matchAndExtract(testCase, pattern);
        expect(result).not.toBeNull();
        expect(result.anyOf).toBe(testCase);
      });
    });

    test('should match any of multiple RegExp patterns', () => {
      const pattern = anyOf(/\d+/, /\w+/, /[!@#$%]/);
      const testCases = ['123', 'hello', '!'];

      testCases.forEach(testCase => {
        const result = matchAndExtract(testCase, pattern);
        expect(result).not.toBeNull();
        expect(result.anyOf).toBe(testCase);
      });
    });

    test('should not match none of the options', () => {
      const pattern = anyOf('hello', 'world', 'test');
      const result = matchAndExtract('other', pattern);
      expect(result).toBeNull();
    });

    test('should work with mixed types', () => {
      const pattern = anyOf('hello', /\d+/, 'world');
      const testCases = ['hello', '123', 'world'];

      testCases.forEach(testCase => {
        const result = matchAndExtract(testCase, pattern);
        expect(result).not.toBeNull();
        expect(result.anyOf).toBe(testCase);
      });
    });

    test('should work in templates', () => {
      const pattern = re`prefix: ${anyOf('hello', 'world')}`;
      const result = matchAndExtract('prefix: hello', pattern);
      expect(result.anyOf).toBe('hello');
    });
  });

  describe('noneOf', () => {
    test('should match anything except specified patterns', () => {
      const pattern = noneOf('hello', 'world');
      const testCases = ['test', 'other', '123'];

      testCases.forEach(testCase => {
        const result = matchAndExtract(testCase, pattern);
        expect(result).not.toBeNull();
        expect(result.noneOf).toBe(testCase);
      });
    });

    test('should not match excluded patterns', () => {
      const pattern = noneOf('hello', 'world');
      const testCases = ['hello', 'world'];

      testCases.forEach(testCase => {
        const result = matchAndExtract(testCase, pattern);
        expect(result).toBeNull();
      });
    });

    test('should work with RegExp patterns', () => {
      const pattern = noneOf(/\d+/, /\w+/);
      const result = matchAndExtract('!@#', pattern);
      expect(result).not.toBeNull();
      expect(result.noneOf).toBe('!@#');
    });
  });

  describe('wordList', () => {
    test('should match words from list', () => {
      const pattern = wordList(['hello', 'world', 'test']);
      const testCases = ['hello', 'world', 'test'];

      testCases.forEach(testCase => {
        const result = matchAndExtract(testCase, pattern);
        expect(result).not.toBeNull();
        expect(result.wordList).toBe(testCase);
      });
    });

    test('should not match words not in list', () => {
      const pattern = wordList(['hello', 'world', 'test']);
      const result = matchAndExtract('other', pattern);
      expect(result).toBeNull();
    });

    test('should handle case sensitivity', () => {
      const pattern = wordList(['Hello', 'World'], { ignoreCase: true });
      const testCases = ['hello', 'HELLO', 'world', 'WORLD'];

      testCases.forEach(testCase => {
        const result = matchAndExtract(testCase, pattern);
        expect(result).not.toBeNull();
        expect(result.wordList).toBe(testCase);
      });
    });

    test('should work with word boundaries', () => {
      const pattern = wordList(['cat', 'dog'], { wordBoundary: true });
      const result = matchAndExtract('cat', pattern);
      expect(result.wordList).toBe('cat');
    });
  });

  describe('Group builders', () => {
    describe('unnamed / u', () => {
      test('should create regular capturing groups', () => {
        const pattern = unnamed`hello`;
        expect(pattern.source).toBe('(hello)');
      });

      test('should work with u alias', () => {
        const pattern = u`world`;
        expect(pattern.source).toBe('(world)');
      });

      test('should work in templates', () => {
        const pattern = re`prefix: ${unnamed`hello`}`;
        expect(pattern.source).toContain('(hello)');
      });
    });

    describe('optional / o', () => {
      test('should create optional groups', () => {
        const pattern = optional`hello`;
        expect(pattern.source).toBe('(hello)?');
      });

      test('should work with o alias', () => {
        const pattern = o`world`;
        expect(pattern.source).toBe('(world)?');
      });

      test('should match optional content', () => {
        const pattern = re`hello${optional` world`}`;
        const result1 = matchAndExtract('hello world', pattern);
        const result2 = matchAndExtract('hello', pattern);
        
        expect(result1).not.toBeNull();
        expect(result2).not.toBeNull();
      });
    });

    describe('noncapturing / nc', () => {
      test('should create non-capturing groups', () => {
        const pattern = noncapturing`hello`;
        expect(pattern.source).toBe('(?:hello)');
      });

      test('should work with nc alias', () => {
        const pattern = nc`world`;
        expect(pattern.source).toBe('(?:world)');
      });

      test('should work in templates', () => {
        const pattern = re`prefix: ${noncapturing`hello`}`;
        expect(pattern.source).toContain('(?:hello)');
      });
    });

    describe('lookahead', () => {
      test('should create positive lookahead', () => {
        const pattern = lookahead`hello`;
        expect(pattern.source).toBe('(?=hello)');
      });

      test('should work in templates', () => {
        const pattern = re`prefix${lookahead`hello`}`;
        expect(pattern.source).toContain('(?=hello)');
      });
    });

    describe('notlookahead', () => {
      test('should create negative lookahead', () => {
        const pattern = notlookahead`hello`;
        expect(pattern.source).toBe('(?!hello)');
      });

      test('should work in templates', () => {
        const pattern = re`prefix${notlookahead`hello`}`;
        expect(pattern.source).toContain('(?!hello)');
      });
    });

    describe('lookbehind', () => {
      test('should create positive lookbehind', () => {
        const pattern = lookbehind`hello`;
        expect(pattern.source).toBe('(?<=hello)');
      });

      test('should work in templates', () => {
        const pattern = re`${lookbehind`hello`}suffix`;
        expect(pattern.source).toContain('(?<=hello)');
      });
    });

    describe('notlookbehind', () => {
      test('should create negative lookbehind', () => {
        const pattern = notlookbehind`hello`;
        expect(pattern.source).toBe('(?<!hello)';
      });

      test('should work in templates', () => {
        const pattern = re`${notlookbehind`hello`}suffix`;
        expect(pattern.source).toContain('(?<!hello)');
      });
    });

    describe('group / g', () => {
      test('should create named groups', () => {
        const pattern = g('name')`hello`;
        expect(pattern.source).toBe('(?<name>hello)');
      });

      test('should work with special group types', () => {
        const pattern = g('optional')`hello`;
        expect(pattern.source).toBe('(?<optional>hello)');
      });

      test('should work in templates', () => {
        const pattern = re`prefix: ${g('name')`hello`}`;
        expect(pattern.source).toContain('(?<name>hello)');
      });
    });

    describe('special', () => {
      test('should create special group types', () => {
        const optionalPattern = special('optional')`hello`;
        expect(optionalPattern.source).toBe('(hello)?');

        const noncapturingPattern = special('noncapturing')`hello`;
        expect(noncapturingPattern.source).toBe('(?:hello)');

        const lookaheadPattern = special('lookahead')`hello`;
        expect(lookaheadPattern.source).toBe('(?=hello)');
      });

      test('should work with all special types', () => {
        const types = ['unnamed', 'optional', 'noncapturing', 'lookahead', 'notlookahead', 'lookbehind', 'notlookbehind'];
        
        types.forEach(type => {
          const pattern = special(type)`test`;
          expect(pattern.source).toBeDefined();
        });
      });
    });
  });

  describe('Complex combinations', () => {
    test('should combine anyOf with group builders', () => {
      const pattern = re`${anyOf('hello', 'world')}${optional`!`}`;
      
      const result1 = matchAndExtract('hello!', pattern);
      const result2 = matchAndExtract('world', pattern);
      
      expect(result1).not.toBeNull();
      expect(result2).not.toBeNull();
    });

    test('should combine wordList with lookahead', () => {
      const pattern = re`${wordList(['hello', 'world'])}${lookahead`!`}`;
      
      const result1 = matchAndExtract('hello!', pattern);
      const result2 = matchAndExtract('world!', pattern);
      
      expect(result1).not.toBeNull();
      expect(result2).not.toBeNull();
    });

    test('should use noneOf with lookbehind', () => {
      const pattern = re`${lookbehind`prefix `}${noneOf('hello', 'world')}`;
      
      const result = matchAndExtract('prefix test', pattern);
      expect(result).not.toBeNull();
      expect(result.noneOf).toBe('test');
    });
  });

  describe('Integration with parsers', () => {
    test('should work with anyOf and parsers', () => {
      const pattern = re`status: ${anyOf('active', 'inactive')}`.withParsers({
        anyOf: (s: string) => s.toUpperCase()
      });
      
      const result = matchAndExtract('status: active', pattern);
      expect(result.anyOf).toBe('ACTIVE');
    });

    test('should work with wordList and parsers', () => {
      const pattern = re`type: ${wordList(['user', 'admin', 'guest'])}`.withParsers({
        wordList: (s: string) => s.toUpperCase()
      });
      
      const result = matchAndExtract('type: user', pattern);
      expect(result.wordList).toBe('USER');
    });

    test('should work with group builders and parsers', () => {
      const pattern = re`name: ${g('name')`hello`}`.withParsers({
        name: (s: string) => s.toUpperCase()
      });
      
      const result = matchAndExtract('name: hello', pattern);
      expect(result.name).toBe('HELLO');
    });
  });

  describe('Edge cases', () => {
    test('should handle empty wordList', () => {
      const pattern = wordList([]);
      const result = matchAndExtract('anything', pattern);
      expect(result).toBeNull();
    });

    test('should handle single item in anyOf', () => {
      const pattern = anyOf('hello');
      const result = matchAndExtract('hello', pattern);
      expect(result.anyOf).toBe('hello');
    });

    test('should handle special characters in wordList', () => {
      const pattern = wordList(['hello-world', 'test_case']);
      const result1 = matchAndExtract('hello-world', pattern);
      const result2 = matchAndExtract('test_case', pattern);
      
      expect(result1).not.toBeNull();
      expect(result2).not.toBeNull();
    });

    test('should handle unicode in wordList', () => {
      const pattern = wordList(['café', 'naïve']);
      const result = matchAndExtract('café', pattern);
      expect(result.wordList).toBe('café');
    });
  });

  describe('Performance', () => {
    test('should handle large wordList efficiently', () => {
      const largeList = Array.from({ length: 1000 }, (_, i) => `word${i}`);
      const pattern = wordList(largeList);
      const result = matchAndExtract('word500', pattern);
      expect(result.wordList).toBe('word500');
    });

    test('should handle many anyOf options', () => {
      const manyOptions = Array.from({ length: 100 }, (_, i) => `option${i}`);
      const pattern = anyOf(...manyOptions);
      const result = matchAndExtract('option50', pattern);
      expect(result.anyOf).toBe('option50');
    });
  });
});
