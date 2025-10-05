import { re } from '../repart';
import {word, num, w} from '../repart/generic';

describe('Builder Methods', () => {
  describe('.setFlags() method', () => {
    test('should replace all flags', () => {
      const pattern = /hello/i.setFlags('g');
      expect(pattern.flags).toHaveFlags('gd');
      expect(pattern.flags).not.toContain('i');
    });

    test('should handle multiple flags', () => {
      const pattern = /test/.setFlags('gi');
      expect(pattern.flags).toHaveFlags('gid');
    });

    test('should remove all flags with empty string', () => {
      const pattern = /pattern/gi.setFlags('');
      expect(pattern.flags).toHaveFlags('d');
    });

    test('should work with RegExp objects', () => {
      const pattern1 = /\d+/i;
      const pattern2 = /\w+/g;
      const combined = re`${pattern1}${pattern2}`.setFlags('m');
      expect(combined.flags).toHaveFlags('md');
    });
  });

  describe('.withFlags() method', () => {
    test('should add flags without removing existing ones', () => {
      const pattern = /hello/i.withFlags('g');
      expect(pattern.flags).toHaveFlags('gid');
    });

    test('should handle duplicate flags', () => {
      const pattern = /test/i.withFlags('i');
      expect(pattern.flags).toHaveFlags('id');
      // Should not duplicate 'i' flag
      expect(pattern.flags.match(/i/g)).toHaveLength(1);
    });

    test('should work with multiple new flags', () => {
      const pattern = /hello/.withFlags('gi');
      expect(pattern.flags).toHaveFlags('gid');
    });
  });

  describe('.removeFlags() method', () => {
    test('should remove specified flags', () => {
      const pattern = /hello/gi.removeFlags('i');
      expect(pattern.flags).toHaveFlags('gd');
    });

    test('should remove multiple flags', () => {
      const pattern = /hello/gim.removeFlags('gi');
      expect(pattern.flags).toHaveFlags('md');
    });

    test('should handle non-existent flags gracefully', () => {
      const pattern = /hello/i.removeFlags('g');
      expect(pattern.flags).toHaveFlags('id');
    });
  });

  describe('.wrappedWith() method', () => {
    test('should wrap with single delimiter', () => {
      const pattern = /word/.wrappedWith('"');
      expect(pattern.source).toBe('"word"');
    });

    test('should wrap with different delimiters', () => {
      const pattern = /\d+/.wrappedWith('[', ']');
      expect(pattern.source).toBe('\\[\\d+\\]');
    });

    test('should escape special regex characters', () => {
      const pattern = /\w+/.wrappedWith('(', ')');
      expect(pattern.source).toBe('\\(\\w+\\)');
    });

    test('should handle complex delimiters', () => {
      const pattern = /\d+/.wrappedWith('\\s*', '\\s*');
      expect(pattern.source).toBe('\\s*\\d+\\s*');
    });

    test('should preserve parsers', () => {
      const originalPattern = /\d+/.as("number").withParsers({ number: parseInt });
      const wrapped = originalPattern.wrappedWith('"');
      expect((wrapped as any).parsers).toHaveProperty('number');
    });

    test('should work with RegExp delimiters', () => {
      const pattern = /\w+/.wrappedWith(re`\(`, re`\)`);
      expect(pattern.source).toBe('\\(\\w+\\)');
    });
  });

  describe('.concat() method', () => {
    test('should concatenate with strings', () => {
      const pattern = /\d+/.concat('abc');
      expect(pattern.source).toBe('\\d+abc');
    });

    test('should concatenate with RegExp objects', () => {
      const pattern = /user/.concat('@').concat(/domain/);
      expect(pattern.source).toBe('user@domain');
    });

    test('should handle chaining multiple patterns', () => {
      const pattern = /\d+/.concat('\\s*').concat(/\w+/).concat('\\s*');
      expect(pattern.source).toBe('\\d+\\s*\\w+\\s*');
    });

    test('should handle undefined (no-op)', () => {
      const pattern = /\d+/.concat(undefined);
      expect(pattern.source).toBe('\\d+');
    });

    test('should preserve parsers from both patterns', () => {
      const pattern1 = /\d+/.as("id").withParsers({ id: parseInt });
      const pattern2 = /\w+/.as("name").withParsers({ name: (s: string) => s.toUpperCase() });
      const combined = pattern1.concat(pattern2);
      
      expect((combined as any).parsers).toHaveProperty('id');
      expect((combined as any).parsers).toHaveProperty('name');
    });

    test('should combine flags from both patterns', () => {
      const pattern1 = /\d+/i;
      const pattern2 = /\w+/g;
      const combined = pattern1.concat(pattern2);
      
      expect(combined.flags).toContain('i');
      expect(combined.flags).toContain('g');
      expect(combined.flags).toContain('d');
    });
  });

  describe('.optional() method', () => {
    test('should make pattern optional', () => {
      const pattern = /\d+/.optional();
      expect(pattern.source).toBe('(\\d+)?');
    });

    test('should work with complex patterns', () => {
      const pattern = /\d+/.concat('\\s*').concat(/\w+/).optional();
      expect(pattern.source).toBe('(\\d+\\s*\\w+)?');
    });

    test('should preserve parsers', () => {
      const originalPattern = /\d+/.as("number").withParsers({ number: parseInt });
      const optional = originalPattern.optional();
      expect((optional as any).parsers).toHaveProperty('number');
    });

    test('should work with named groups', () => {
      const pattern = /\d+/.as('id').optional();
      expect(pattern.source).toBe('(?<id>\\d+)?');
    });
  });

  describe('.repeated() method', () => {
    test('should add basic repetition', () => {
      const pattern = /\d/.repeated(1, 3);
      expect(pattern.source).toBe('\\d{1,3}');
    });


    test('should handle one or more', () => {
      const pattern = /\w/.repeated(1);
      expect(pattern.source).toBe('\\w{1}');
    });

    test('should handle zero or one', () => {
      const pattern = /\w/.repeated(0, 1);
      expect(pattern.source).toBe('\\w?');
    });

    test('should handle exact count', () => {
      const pattern = /\d/.repeated(3);
      expect(pattern.source).toBe('\\d{3}');
    });

    test('should handle unlimited repetition', () => {
      const pattern = /\d/.repeated(2, Infinity);
      expect(pattern.source).toBe('\\d{2,}');
    });

    test('should preserve parsers', () => {
      const originalPattern = /\d+/.as("number").withParsers({ number: parseInt });
      const repeated = originalPattern.repeated(1, 3);
      expect((repeated as any).parsers).toHaveProperty('number');
    });

    test('should work with complex patterns', () => {
      const pattern = /\d+/.concat('\\s*').concat(/\w+/).repeated(1, 3);
      expect(pattern.source).toBe('(\\d+\\s*\\w+){1,3}');
    });
  });

  describe('.spaced() method', () => {
    test('should make spaces flexible', () => {
      const pattern = /hello world/.spaced();
      expect(pattern.source).toBe('hello\\s+world');
    });

    test('should handle multiple spaces', () => {
      const pattern = /\d+  \w+/.spaced();
      expect(pattern.source).toBe('\\d+\\s+\\w+');
    });

    test('should handle complex patterns', () => {
      const pattern = /\d+ \w+ \d+/.spaced();
      expect(pattern.source).toBe('\\d+\\s+\\w+\\s+\\d+');
    });

    test('should preserve parsers', () => {
      const originalPattern = /(?<number>\d+) (?<word>\w+)/.withParsers({
        number: parseInt, 
        word: (s: string) => s.toUpperCase() 
      });
      const s = originalPattern.spaced();
      expect((s as any).parsers).toHaveProperty('number');
      expect((s as any).parsers).toHaveProperty('word');
    });

    test('should work with other methods', () => {
      const pattern = /\d+ \w+/.spaced().optional();
      expect(pattern.source).toBe('(\\d+\\s+\\w+)?');
    });

    test('should handle mixed whitespace', () => {
      const pattern = /\d+\s*\w+ \d+/.spaced();
      expect(pattern.source).toBe('\\d+\\s*\\w+\\s+\\d+');
    });
  });

  describe('Method chaining', () => {
    test('should support complex chaining', () => {
      const pattern = /\d+/
        .as('id')
        .concat('\\s*')
        .concat(/\w+/.as('name'))
        .wrappedWith('"')
        .optional()
        .withFlags('i');
      
      expect(pattern.source).toBe('("(?<id>\\d+)\\s*(?<name>\\w+)")?');
      expect(pattern.flags).toContain('i');
    });

    test('should preserve parsers through chaining', () => {
      const pattern = /\d+/
          .as('id')
        .withParsers({ id: parseInt })
        .concat(/\w+/.as('name').withParsers({ name: (s: string) => s.toUpperCase() }))
        .optional();
      
      expect((pattern as any).parsers).toHaveProperty('id');
      expect((pattern as any).parsers).toHaveProperty('name');
    });

    test('should handle flags through chaining', () => {
      const pattern = /\d+/i
        .concat(/\w+/g)
        .withFlags('m');
      
      expect(pattern.flags).toHaveFlags('dgim');
    });
  });

  describe('Integration with re template', () => {
    test('should work with re template interpolation', () => {
      const count = 3;
      const namePattern = /\w+/.as('name');
      const agePattern = num.as('age');
      
      const pattern = re`name: ${namePattern}, age: ${agePattern}`.withFlags('i');
      
      expect(pattern.source).toContain('(?<name>\\w+)');
      expect(pattern.source).toContain('(?<age>\\d+)');
      expect(pattern.flags).toContain('i');
      expect(pattern.flags).toContain('d');
    });

    test('should handle complex template with builders', () => {
      const pattern = re`test`.as('word')
        .concat(re`\s*#?\s*`)
        .concat(re`\d{3}`.as('num').concat('?'))
        .as('full')
        .wrappedWith(/\s*/)
        .withFlags('i');
      
      expect(pattern.source).toBe('\\s*(?<full>(?<word>test)\\s*#?\\s*(?<num>\\d{3})?)\\s*');
      expect(pattern.flags).toContain('i');
      expect(pattern.flags).toContain('d');
    });
  });
});

