import { re, r, match, matchAndExtract } from '../repart';
import { matchRaw, withParsers } from '../repart/match';
import { word, num } from '../repart/generic';
import {EMAIL_PATTERN, FLOAT_PATTERN} from '../repart/common';

describe('Core Features', () => {
  describe('re template function', () => {
    test('should build basic patterns with string interpolation', () => {
      const pattern = re`hello${'world'}`;
      expect(pattern.source).toBe('helloworld');
      expect(pattern.flags).toContain('d');
    });

    test('should build patterns with number interpolation', () => {
      const count = 3;
      const pattern = re`\d{${count}}`;
      expect(pattern.source).toBe('\\d{3}');
    });

    test('should build patterns with RegExp interpolation', () => {
      const emailPattern = EMAIL_PATTERN;
      const pattern = re`mailto:${emailPattern}`;
      expect(pattern.source).toContain('mailto:');
      expect(pattern.source).toContain('(?<email>');
    });

    test('should combine flags from child patterns', () => {
      const pattern1 = /\d+/i;
      const pattern2 = /\w+/g;
      const combined = re`${pattern1}${pattern2}`;
      expect(combined.flags).toContain('i');
      expect(combined.flags).toContain('g');
      expect(combined.flags).toContain('d');
    });

    test('should preserve parsers from child patterns', () => {
      const childPattern = /\d+/.as("number").withParsers({ number: parseInt });
      const pattern = re`count: ${childPattern}`;
      expect((pattern as any).parsers).toHaveProperty('number');
    });
  });

  describe('r template function', () => {
    test('should work as String.raw alias', () => {
      const result = r`hello\nworld`;
      expect(result).toBe('hello\\nworld');
    });

    test('should handle RegExp interpolation', () => {
      const pattern = /\d+/;
      const result = r`count: ${pattern}`;
      expect(result).toBe('count: \\d+');
    });
  });

  describe('.as() method', () => {
    test('should create named groups', () => {
      const pattern = /\d+/.as('number');
      expect(pattern.source).toBe('(?<number>\\d+)');
    });

    test('should create special group types', () => {
      const nonCapturing = /\w+/.as('non-capturing');
      expect(nonCapturing.source).toBe('(?:\\w+)');

      const optional = /\d+/.as('optional');
      expect(optional.source).toBe('(\\d+)?');

      const lookahead = /\d+/.as('positive-lookahead');
      expect(lookahead.source).toBe('(?=\\d+)');

      const lookbehind = /\d+/.as('positive-lookbehind');
      expect(lookbehind.source).toBe('(?<=\\d+)');
    });

    test('should handle chaining with other methods', () => {
      const pattern = /\d+/.as('id').then('\\s*').as('spaced');
      expect(pattern.source).toBe('(?<spaced>(?<id>\\d+)\\s*)');
    });
  });

  describe('.withParsers() method', () => {
    test('should add simple transformation parsers', () => {
      const pattern = re`name: ${word.as('name')}`.withParsers({
        name: (s: string) => s.toUpperCase()
      });
      
      const result = pattern.match('name: john');
      expect(result.name).toBe('JOHN');
    });

    test('should add number parsing', () => {
      const pattern = re`age: ${num.as('age')}`.withParsers({
        age: parseInt
      });
      
      const result = pattern.match('age: 25');
      expect(result.age).toBe(25);
      expect(typeof result.age).toBe('number');
    });

    test('should ignore groups with null parser', () => {
      const pattern = re`prefix: ${word.as('prefix')}, name: ${word.as('name')}`.withParsers({
        prefix: null,
        name: (s: string) => s.toUpperCase()
      });
      
      const result = pattern.match('prefix: hello, name: john');
      expect(result.prefix).toBeUndefined();
      expect(result.name).toBe('JOHN');
    });

    test('should handle unnesting with underscore prefix', () => {
      const pattern = re`data: ${word.as('data')}`.withParsers({
        _data: (s: string) => ({ info: s })
      });
      
      const result = pattern.match('data: test');
      expect(result.info).toBe('test');
      expect(result.data).toBeUndefined();
    });

    test('should handle groups post-processing', () => {
      const pattern = re`name: ${word.as('name')}, age: ${num.as('age')}`.withParsers({
        name: (s: string) => s.toUpperCase(),
        age: parseInt,
        groups: (data: any) => ({ 
          title: data.name, 
          years: data.age 
        })
      });
      
      const result = pattern.match('name: john, age: 25');
      expect(result.title).toBe('JOHN');
      expect(result.years).toBe(25);
      expect(result.name).toBeUndefined();
      expect(result.age).toBeUndefined();
    });

    test('should handle cascading parsing with RegExp', () => {
      const nestedPattern = re`name: ${word.as('name')}, age: ${num.as('age')}`;
      const pattern = re`user: ${/.*/.as('userData')}`.withParsers({
        userData: nestedPattern
      });
      
      const result = pattern.match('user: name: john, age: 25');
      expect(result.userData.name).toBe('john');
      expect(result.userData.age).toBe('25');
    });
    test('should handle unnested cascading parsing with RegExp', () => {
      const nestedPattern = re`name: ${word.as('name')}, age: ${num.as('age')}`;
      const pattern = re`user: ${/.*/.as('userData')}`.withParsers({
        _userData: nestedPattern
      });

      const result = pattern.match('user: name: john, age: 25');
      expect(result.name).toBe('john');
      expect(result.age).toBe('25');
    });
  });

  describe('.match() method', () => {
    test('should return proxy object with extracted data', () => {
      const pattern = re`name: ${word.as('name')}, age: ${num.as('age')}`;
      const result = pattern.match('name: John, age: 25');
      
      expect(result.name).toBe('John');
      expect(result.age).toBe('25');
      expect(result.parsed).toBeDefined();
      expect(result.groups).toBeDefined();
      expect(result.extracted).toBeDefined();
    });

    test('should handle multiple matches with global flag', () => {
      const pattern = re`${word.as('word')}`.withFlags('g');
      const result = pattern.match('hello world test');
      
      expect(Array.isArray(result.extracted)).toBe(true);
      expect(result.length).toBe(3);
      expect(result[0]).toBe('hello');
      expect(result[1]).toBe('world');
      expect(result[2]).toBe('test');
    });

    test('should return null for no match', () => {
      const pattern = re`name: ${word.as('name')}`;
      const result = pattern.matchAndExtract('no match here');
      
      expect(result).toBeNull();
    });

    test('should handle options', () => {
      const pattern = re`${word.as('word')}`;
      const result = pattern.match('hello world', { 
        maxMatches: 1,
        cacheInput: true 
      });
      
      expect(result.word).toBe('hello');
      expect((result as any).input).toBe('hello world');
    });
  });

  describe('.matchRaw() method', () => {
    test('should return RawResult with detailed information', () => {
      const pattern = re`name: ${word.as('name')}, age: ${num.as('age')}`;
      const input = 'name: John, age: 25';
      const result = pattern.matchRaw(input);
      
      expect(result.startIndex).toBe(0);
      expect(result.endIndex).toBe(input.length);
      expect(result.raw.raw).toBe('name: John, age: 25');
      expect(result.groups.name.raw).toBe('John');
      expect(result.groups.age.raw).toBe('25');
    });

    test('should provide access to parsed result', () => {
      const pattern = re`name: ${word.as('name')}`.withParsers({
        name: (s: string) => s.toUpperCase()
      });
      const result = pattern.matchRaw('name: john');
      
      expect(result.result.name).toBe('JOHN');
    });

    test('should handle multiple matches', () => {
      const pattern = re`${word.as('word')}`.withFlags('g');
      const result = pattern.matchRaw('hello world').raw;
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
      expect(result[0].raw).toBe('hello');
      expect(result[1].raw).toBe('world');
    });
  });

  describe('.matchAndExtract() method', () => {
    test('should return extracted data directly', () => {
      const pattern = re`name: ${word.as('name')}, age: ${num.as('age')}`.withParsers({
        age: parseInt
      });
      const result = pattern.matchAndExtract('name: John, age: 25');
      
      expect(result).toEqual({
        name: 'John',
        age: 25
      });
    });

    test('should return null for no match', () => {
      const pattern = re`name: ${word.as('name')}`;
      const result = pattern.matchAndExtract('no match here');
      
      expect(result).toBeNull();
    });

    test('should handle complex parsing', () => {
      const pattern = re`name: ${word.as('name')}, age: ${num.as('age')}`.withParsers({
        name: (s: string) => s.toUpperCase(),
        age: parseInt,
        groups: (data: any) => ({ 
          person: { name: data.name, age: data.age }
        })
      });
      const result = pattern.matchAndExtract('name: john, age: 25');
      
      expect(result).toEqual({
        person: { name: 'JOHN', age: 25 }
      });
    });
  });

  describe('.anchor() method', () => {
    test('should add both anchors by default', () => {
      const pattern = /\d+/.anchor();
      expect(pattern.source).toBe('^\\d+$');
    });

    test('should add start anchor only', () => {
      const pattern = /\d+/.anchor('start');
      expect(pattern.source).toBe('^\\d+');
      
      const pattern2 = /\d+/.anchor('^');
      expect(pattern2.source).toBe('^\\d+');
    });

    test('should add end anchor only', () => {
      const pattern = /\d+/.anchor('end');
      expect(pattern.source).toBe('\\d+$');
      
      const pattern2 = /\d+/.anchor('$');
      expect(pattern2.source).toBe('\\d+$');
    });

    test('should add both anchors explicitly', () => {
      const pattern = /\d+/.anchor('both');
      expect(pattern.source).toBe('^\\d+$');
      
      const pattern2 = /\d+/.anchor('^$');
      expect(pattern2.source).toBe('^\\d+$');
    });

    test('should handle multiline flag', () => {
      const pattern = /\d+/.anchor('both', true);
      expect(pattern.source).toBe('^\\d+$');
      expect(pattern.flags).toContain('m');
    });

    test('should not duplicate existing anchors', () => {
      const pattern = /^\d+$/.anchor();
      expect(pattern.source).toBe('^\\d+$');
      
      const startOnly = /^\d+/.anchor('start');
      expect(startOnly.source).toBe('^\\d+');
      
      const endOnly = /\d+$/.anchor('end');
      expect(endOnly.source).toBe('\\d+$');
    });

    test('should preserve parsers', () => {
      const originalPattern = /\d+/.as('number').withParsers({ number: parseInt });
      const anchoredPattern = originalPattern.anchor();
      expect((anchoredPattern as any).parsers).toHaveProperty('number');
    });

    test('should work with named groups', () => {
      const pattern = /\d+/.as('number').anchor();
      expect(pattern.source).toBe('^(?<number>\\d+)$');
    });

    test('should chain with other methods', () => {
      const pattern = /\d+/.anchor().withFlags('i');
      expect(pattern.source).toBe('^\\d+$');
      expect(pattern.flags).toContain('i');
    });

    test('should handle complex patterns', () => {
      const pattern = re`${/\d+/.as('id')}\\s*${/\w+/.as('name')}`.anchor();
      expect(pattern.source).toBe('^(?<id>\\d+)\\\\s*(?<name>\\w+)$');
    });

    test('should throw error for invalid mode', () => {
      expect(() => /\d+/.anchor('invalid' as any)).toThrow('invalid mode');
    });
  });

  describe('.unanchor() method', () => {
    test('should remove both anchors by default', () => {
      const pattern = /^\d+$/.unanchor();
      expect(pattern.source).toBe('\\d+');
    });

    test('should remove start anchor only', () => {
      const pattern = /^\d+$/.unanchor('start');
      expect(pattern.source).toBe('\\d+$');
      
      const pattern2 = /^\d+$/.unanchor('^');
      expect(pattern2.source).toBe('\\d+$');
    });

    test('should remove end anchor only', () => {
      const pattern = /^\d+$/.unanchor('end');
      expect(pattern.source).toBe('^\\d+');
      
      const pattern2 = /^\d+$/.unanchor('$');
      expect(pattern2.source).toBe('^\\d+');
    });

    test('should remove both anchors explicitly', () => {
      const pattern = /^\d+$/.unanchor('both');
      expect(pattern.source).toBe('\\d+');
      
      const pattern2 = /^\d+$/.unanchor('^$');
      expect(pattern2.source).toBe('\\d+');
    });

    test('should handle multiline flag removal', () => {
      const pattern = /^\d+$/m.unanchor('both', true);
      expect(pattern.source).toBe('\\d+');
      expect(pattern.flags).not.toContain('m');
    });

    test('should not affect patterns without anchors', () => {
      const pattern = /\d+/.unanchor();
      expect(pattern.source).toBe('\\d+');
      
      const startOnly = /^\d+/.unanchor('end');
      expect(startOnly.source).toBe('^\\d+');
      
      const endOnly = /\d+$/.unanchor('start');
      expect(endOnly.source).toBe('\\d+$');
    });

    test('should preserve parsers', () => {
      const originalPattern = /^\d+$/.as('number').withParsers({ number: parseInt });
      const unanchoredPattern = originalPattern.unanchor();
      expect((unanchoredPattern as any).parsers).toHaveProperty('number');
    });

    test('should work with named groups', () => {
      const pattern = /^(?<number>\d+)$/.unanchor();
      expect(pattern.source).toBe('(?<number>\\d+)');
    });

    test('should chain with other methods', () => {
      const pattern = /^\d+$/.unanchor().then('\\s*');
      expect(pattern.source).toBe('\\d+\\s*');
    });

    test('should handle complex patterns', () => {
      const pattern = re`^${/\d+/.as('id')}\\s*${/\w+/.as('name')}$`.unanchor();
      expect(pattern.source).toBe('(?<id>\\d+)\\\\s*(?<name>\\w+)');
    });

    test('should throw error for invalid mode', () => {
      expect(() => /^\d+$/.unanchor('invalid' as any)).toThrow('invalid mode');
    });
  });

  describe('Anchor/Unanchor integration', () => {
    test('should be reversible operations', () => {
      const original = /\d+/;
      const anchored = original.anchor();
      const unanchored = anchored.unanchor();
      
      expect(unanchored.source).toBe(original.source);
    });

    test('should work with partial anchoring', () => {
      const pattern = /\d+/.anchor('start').unanchor('end');
      expect(pattern.source).toBe('^\\d+');
      
      const pattern2 = /\d+/.anchor('end').unanchor('start');
      expect(pattern2.source).toBe('\\d+$');
    });

    test('should handle multiline flag correctly', () => {
      const pattern = /\d+/.anchor('both', true).unanchor('both', true);
      expect(pattern.source).toBe('\\d+');
      expect(pattern.flags).not.toContain('m');
    });

    test('should work with matching operations', () => {
      const anchoredPattern = /\d+/.anchor();
      const result = anchoredPattern.match('123');
      expect(result.extracted).toBe('123');
      
      const noMatch = anchoredPattern.match('abc123def');
      expect(noMatch.extracted).toBeNull();
    });

    test('should work with unanchored matching', () => {
      const unanchoredPattern = /^\d+$/.unanchor();
      const result = unanchoredPattern.match('abc123def');
      expect(result.extracted).toBe('123');
    });
  });

  describe('Complex scenarios', () => {
    test('should handle email parsing with nested groups', () => {
      const pattern = re`name: ${word.as('name')}, email: ${EMAIL_PATTERN}`.withParsers({
        name: (s: string) => s.toUpperCase()
      });
      
      const result = pattern.match('name: john, email: john@gmail.com');
      
      expect(result.name).toBe('JOHN');
      expect(result.email).toBe('john@gmail.com');
      expect(result.emailHandle).toBe('john');
      expect(result.emailDomain).toBe('gmail.com');
      expect(result.emailTLD).toBe('com');
    });

    test('should handle cascading parsing with unnesting', () => {
      const userPattern = re`name: ${word.as('name')}, age: ${num.as('age')}`.withParsers({
        age: parseInt
      });
      
      const pattern = re`users: ${/[\s\S]*/.as('users')}`.withParsers({
        users: userPattern.withFlags('g')
      });
      
      const result = pattern.match(`
        users: name: john, age: 25
        name: jane, age: 30
      `).extracted.users;
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
      expect(result[0].name).toBe('john');
      expect(result[0].age).toBe(25);
      expect(result[1].name).toBe('jane');
      expect(result[1].age).toBe(30);
    });

    test('should handle multiple transformation types', () => {
      const pattern = re`id: ${num.as('id')}, name: ${word.as('name')}, score: ${FLOAT_PATTERN.as('score')}`.withParsers({
        id: parseInt,
        name: (s: string) => s.toLowerCase(),
        score: parseFloat,
        groups: (data: any) => ({ 
          player: { id: data.id, name: data.name }, 
          points: data.score 
        })
      });
      
      const result = pattern.match('id: 123, name: JOHN, score: 95.5');
      
      expect(result.player.id).toBe(123);
      expect(result.player.name).toBe('john');
      expect(result.points.value).toBe(95.5);
    });
  });
});

