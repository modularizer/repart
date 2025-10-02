import { re, r, match, matchAndExtract } from '../repart';
import { matchRaw, withParsers } from '../repart/match';
import { word, num } from '../repart/generic';
import { EMAIL_PATTERN } from '../repart/common';

describe('Core Features', () => {
  describe('re template function', () => {
    test('should build basic patterns with string interpolation', () => {
      const pattern = re`hello${'world'}`;
      expect(pattern.source).toBe('helloworld');
      expect(pattern.flags).toContain('d');
    });

    test('should build patterns with number interpolation', () => {
      const count = 3;
      const pattern = re`\\d{${count}}`;
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
      const childPattern = /\d+/.withParsers({ number: parseInt });
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
      const noncapturing = /\w+/.as('noncapturing');
      expect(noncapturing.source).toBe('(?:\\w+)');

      const optional = /\d+/.as('optional');
      expect(optional.source).toBe('(\\d+)?');

      const lookahead = /\d+/.as('lookahead');
      expect(lookahead.source).toBe('(?=\\d+)');

      const lookbehind = /\d+/.as('lookbehind');
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
      const pattern = re`user: ${word.as('userData')}`.withParsers({
        userData: nestedPattern
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
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(3);
      expect(result[0].word).toBe('hello');
      expect(result[1].word).toBe('world');
      expect(result[2].word).toBe('test');
    });

    test('should return null for no match', () => {
      const pattern = re`name: ${word.as('name')}`;
      const result = pattern.match('no match here');
      
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
      const result = pattern.matchRaw('name: John, age: 25');
      
      expect(result.startIndex).toBe(0);
      expect(result.endIndex).toBe(20);
      expect(result.raw).toBe('name: John, age: 25');
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
      const result = pattern.matchRaw('hello world');
      
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
      
      const pattern = re`users: ${word.as('users')}`.withParsers({
        _users: userPattern.withFlags('g')
      });
      
      const result = pattern.match(`
        users: name: john, age: 25
        name: jane, age: 30
      `);
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
      expect(result[0].name).toBe('john');
      expect(result[0].age).toBe(25);
      expect(result[1].name).toBe('jane');
      expect(result[1].age).toBe(30);
    });

    test('should handle multiple transformation types', () => {
      const pattern = re`id: ${num.as('id')}, name: ${word.as('name')}, score: ${num.as('score')}`.withParsers({
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
      expect(result.points).toBe(95.5);
    });
  });
});

