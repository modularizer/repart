import { re, matchAndExtract } from '../repart';
import {
  newLine,
  endLine,
  startLine,
  any,
  anything,
  space,
  word,
  fullword,
  w,
  wordBoundary,
  notWordBoundary,
  d,
  num
} from '../repart/generic';
import {aZ} from "../repart/common";

describe('Generic Patterns', () => {
  describe('Line patterns', () => {
    describe('newLine', () => {
      test('should match line breaks', () => {
        const testCases = [
          '\n',
          '\r\n',
        ];

        testCases.forEach(lineBreak => {
          const result = matchAndExtract(lineBreak, newLine.as("lineBreak"));
          expect(result).not.toBeNull();
          expect(result.lineBreak).toBe(lineBreak);
        });
      });

      test('should work in templates', () => {
        const pattern = re`line1${newLine}line2`;
        const result = matchAndExtract('line1\nline2', pattern);
        expect(result).not.toBeNull();
      });
    });

    describe('endLine', () => {
      test('should match end of line', () => {
        const result = matchAndExtract('hello', endLine);
        expect(result).not.toBeNull();
      });

      test('should work with multiline strings', () => {
        const pattern = re`hello${endLine}`.withFlags('m');
        const result = matchAndExtract('hello\nworld', pattern);
        expect(result).not.toBeNull();
      });
    });

    describe('startLine', () => {
      test('should match start of line', () => {
        const result = matchAndExtract('hello', startLine);
        expect(result).not.toBeNull();
      });

      test('should work with multiline strings', () => {
        const pattern = re`${startLine}world`.withFlags('m');
        const result = matchAndExtract('hello\nworld', pattern);
        expect(result).not.toBeNull();
      });
    });
  });

  describe('Character patterns', () => {
    describe('any', () => {
      test('should match any single character', () => {
        const testCases = ['a', '1', ' ', '\n', '!', '中'];

        testCases.forEach(char => {
          const result = matchAndExtract(char, any.as("any"));
          expect(result).not.toBeNull();
          expect(result.any).toBe(char);
        });
      });

      test('should not match empty string', () => {
        const result = matchAndExtract('', any);
        expect(result).toBeNull();
      });

      test('should only match first character', () => {
        const result = matchAndExtract('hello', any.as("any"));
        expect(result.any).toBe('h');
      });
    });

    describe('anything', () => {
      test('should match any characters (non-greedy)', () => {
        const result = matchAndExtract('hello world', anything.as("anything"));
        expect(result).not.toBeNull();
        expect(result.anything).toBe('');
      });

      test('should work with delimiters', () => {
        const pattern = re`start${anything.as("anything")}end`;
        const result = matchAndExtract('start middle end', pattern);
        expect(result).not.toBeNull();
        expect(result.anything).toBe(' middle ');
      });
    });
  });

  describe('Whitespace patterns', () => {
    describe('space', () => {
      test('should match whitespace excluding newlines', () => {
        const testCases = [' ', '\t', '  ', '\t\t'];

        testCases.forEach(whitespace => {
          const result = matchAndExtract(whitespace, space.as("space"));
          expect(result).not.toBeNull();
          expect(result.space).toBe(whitespace);
        });
      });

      test('should not match newlines', () => {
        const result = matchAndExtract('\n', space);
        expect(result).toBeNull();
      });

      test('should not match zero spaces', () => {
        const result = matchAndExtract('', space.as("space"));
        expect(result).toBeNull();
      });
    });
  });

  describe('Word patterns', () => {
    describe('word', () => {
      test('should match word characters', () => {
        const testCases = ['hello', 'world123', 'test_word', 'camelCase'];

        testCases.forEach(wordStr => {
          const result = matchAndExtract(wordStr, word.as("word"));
          expect(result).not.toBeNull();
          expect(result.word).toBe(wordStr);
        });
      });

      test('should not match non-word characters', () => {
        const testCases = ['hello world', 'test!', '123-456'];

        testCases.forEach(nonWord => {
          const result = matchAndExtract(nonWord, re`^${word}$`);
          expect(result).toBeNull();
        });
      });

      test('should match one or more word characters', () => {
        const result = matchAndExtract('a', word.as("word"));
        expect(result.word).toBe('a');
      });
    });

    describe('fullword', () => {
      test('should match complete words with boundaries', () => {
        const testCases = ['hello', 'world', 'test123'];

        testCases.forEach(wordStr => {
          const result = matchAndExtract(wordStr, fullword.as("fullword"));
          expect(result).not.toBeNull();
          expect(result.fullword).toBe(wordStr);
        });
      });

      test('should not match partial words', () => {
        const result = matchAndExtract('hello world', fullword.as("fullword"));
        expect(result.fullword).toBe('hello');
      });

      test('should work with word boundaries', () => {
        const pattern = re`${fullword}\s*${fullword}`;
        const result = matchAndExtract('hello world', pattern);
        expect(result).not.toBeNull();
      });
    });

    describe('w (single word character)', () => {
      test('should match single word character', () => {
        const testCases = ['a', '1', '_', 'Z'];

        testCases.forEach(char => {
          const result = matchAndExtract(char, w.as('w'));
          expect(result).not.toBeNull();
          expect(result.w).toBe(char);
        });
      });

      test('should not match multiple characters', () => {
        const result = matchAndExtract('ab', w.as('w'));
        expect(result.w).toBe('a');
      });

      test('should not match non-word characters', () => {
        const testCases = [' ', '!', '@', '#'];

        testCases.forEach(char => {
          const result = matchAndExtract(char, w);
          expect(result).toBeNull();
        });
      });
    });
  });

  describe('Word boundary patterns', () => {
    describe('wordBoundary', () => {
      test('should match word boundaries', () => {
        const pattern = re`${wordBoundary}hello${wordBoundary}`;
        const result = matchAndExtract('hello', pattern);
        expect(result).not.toBeNull();
      });

      test('should work in complex patterns', () => {
        const pattern = re`${wordBoundary}test${wordBoundary}`;
        const result = matchAndExtract('test word', pattern);
        expect(result).not.toBeNull();
      });
    });

    describe('notWordBoundary', () => {
      test('should match non-word boundaries', () => {
        const pattern = re`hello${notWordBoundary}world`;
        const result = matchAndExtract('helloworld', pattern);
        expect(result).not.toBeNull();
      });
    });
  });

  describe('Digit patterns', () => {
    describe('d (single digit)', () => {
      test('should match single digits', () => {
        const testCases = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

        testCases.forEach(digit => {
          const result = matchAndExtract(digit, d.as('d'));
          expect(result).not.toBeNull();
          expect(result.d).toBe(digit);
        });
      });

      test('should not match non-digits', () => {
        const testCases = ['a', '!', ' ', '10'];

        testCases.forEach(nonDigit => {
          const result = matchAndExtract(nonDigit, d.as('d'));
          if (nonDigit === '10') {
            expect(result.d).toBe('1'); // Only first character
          } else {
            expect(result).toBeNull();
          }
        });
      });
    });

    describe('num (one or more digits)', () => {
      test('should match numbers', () => {
        const testCases = ['1', '123', '0', '999999'];

        testCases.forEach(number => {
          const result = matchAndExtract(number, num.as('num'));
          expect(result).not.toBeNull();
          expect(result.num).toBe(number);
        });
      });

      test('should not match non-numbers', () => {
        const testCases = ['abc', '!', ' ', '12a'];

        testCases.forEach(nonNumber => {
          const result = matchAndExtract(nonNumber, num.as('num'));
          if (nonNumber === '12a') {
            expect(result.num).toBe('12'); // Only numeric part
          } else {
            expect(result).toBeNull();
          }
        });
      });

      test('should match at start of string', () => {
        const result = matchAndExtract('123abc', num.as('num'));
        expect(result.num).toBe('123');
      });
    });
  });

  describe('Pattern combinations', () => {
    test('should combine word and number patterns', () => {
      const pattern = re`${re`${aZ}+`.as('word')}${num.as('number')}`;
      const result = matchAndExtract('hello123', pattern);
      
      expect(result.word).toBe('hello');
      expect(result.number).toBe('123');
    });

    test('should combine space and word patterns', () => {
      const pattern = re`${word.as('word1')}${space.as("space")}${word.as('word2')}`;
      const result = matchAndExtract('hello world', pattern);
      
      expect(result.word1).toBe('hello');
      expect(result.word2).toBe('world');
      expect(result.space).toBe(' ');
    });

    test('should handle word boundaries with fullword', () => {
      const pattern = re`${fullword.as('word1')}${space}${fullword.as('word2')}`;
      const result = matchAndExtract('hello world', pattern);
      
      expect(result.word1).toBe('hello');
      expect(result.word2).toBe('world');
    });

    test('should work with any and anything', () => {
      const pattern = re`start${anything.as('middle')}end`;
      const result = matchAndExtract('start middle end', pattern);
      
      expect(result.middle).toBe(' middle ');
    });
  });

  describe('Pattern with parsers', () => {
    test('should parse numbers with toInt', () => {
      const pattern = re`count: ${num.as('count')}`.withParsers({
        count: parseInt
      });
      
      const result = matchAndExtract('count: 123', pattern);
      expect(result.count).toBe(123);
      expect(typeof result.count).toBe('number');
    });

    test('should parse words with transformations', () => {
      const pattern = re`name: ${word.as('name')}`.withParsers({
        name: (s: string) => s.toUpperCase()
      });
      
      const result = matchAndExtract('name: john', pattern);
      expect(result.name).toBe('JOHN');
    });

    test('should handle multiple patterns with different parsers', () => {
      const pattern = re`id: ${num.as('id')}, name: ${word.as('name')}, active: ${word.as('active')}`.withParsers({
        id: parseInt,
        name: (s: string) => s.toLowerCase(),
        active: (s: string) => s === 'true'
      });
      
      const result = matchAndExtract('id: 123, name: JOHN, active: true', pattern);
      
      expect(result.id).toBe(123);
      expect(result.name).toBe('john');
      expect(result.active).toBe(true);
    });
  });

  describe('Edge cases', () => {
    test('should handle empty strings', () => {
      const result = matchAndExtract('', word);
      expect(result).toBeNull();
    });

    test('should handle single characters', () => {
      const result = matchAndExtract('a', word.as("word"));
      expect(result.word).toBe('a');
    });

    test('should handle unicode characters', () => {
      const result = matchAndExtract('café', word.as("word"));
      expect(result.word).toBe('café');
    });

    test('should handle mixed content', () => {
      const pattern = re`${word.as('word')}${space}${num.as('number')}`;
      const result = matchAndExtract('hello 123', pattern);
      
      expect(result.word).toBe('hello');
      expect(result.number).toBe('123');
    });
  });

  describe('Performance and behavior', () => {
    test('should handle long strings efficiently', () => {
      const longString = 'a'.repeat(1000);
      const result = matchAndExtract(longString, word.as('word'));
      expect(result.word).toBe(longString);
    });

    test('should handle repetitive patterns', () => {
      const pattern = re`${word.as('word')}`.withFlags('g');
      const result = matchAndExtract('hello world test', pattern);
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(3);
      expect(result[0]).toBe('hello');
      expect(result[1]).toBe('world');
      expect(result[2]).toBe('test');
    });
  });
});
