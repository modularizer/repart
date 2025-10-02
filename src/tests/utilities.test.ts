import { escape, dedup, allSpecialChars, SpecialCharMeanings } from '../repart';
import { allRegExpFlags, RegExpFlagMeanings } from '../repart/flags';
import { toInt, toFloat, isInt, isFloat, buildNumberPatterns, numberToString } from '../repart/common/numbers';
import { toPhoneNumber, isPhoneNumber } from '../repart/common/phoneNumbers';
import { matchAnyState } from '../repart/common/stateCodes';

describe('Utility Functions', () => {
  describe('escape', () => {
    test('should escape regex special characters', () => {
      const testCases = [
        { input: 'hello.world', expected: 'hello\\.world' },
        { input: 'test*pattern', expected: 'test\\*pattern' },
        { input: 'a+b?c', expected: 'a\\+b\\?c' },
        { input: '^start$', expected: '\\^start\\$' },
        { input: '(group)', expected: '\\(group\\)' },
        { input: '[character]', expected: '\\[character\\]' },
        { input: '{quantifier}', expected: '\\{quantifier\\}' },
        { input: '|alternation', expected: '\\|alternation' },
        { input: '\\backslash', expected: '\\\\backslash' }
      ];

      testCases.forEach(({ input, expected }) => {
        expect(escape(input)).toBe(expected);
      });
    });

    test('should handle empty string', () => {
      expect(escape('')).toBe('');
    });

    test('should handle strings without special characters', () => {
      expect(escape('hello')).toBe('hello');
      expect(escape('123')).toBe('123');
      expect(escape('abc')).toBe('abc');
    });

    test('should handle multiple special characters', () => {
      const input = '.*+?^${}()|[]\\';
      const expected = '\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\]\\\\';
      expect(escape(input)).toBe(expected);
    });

    test('should handle unicode characters', () => {
      expect(escape('café')).toBe('café');
      expect(escape('naïve')).toBe('naïve');
    });
  });

  describe('dedup', () => {
    test('should remove duplicate characters', () => {
      expect(dedup('aabbcc')).toBe('abc');
      expect(dedup('hello')).toBe('helo');
      expect(dedup('mississippi')).toBe('misp');
    });

    test('should handle empty string', () => {
      expect(dedup('')).toBe('');
    });

    test('should handle single character', () => {
      expect(dedup('a')).toBe('a');
    });

    test('should handle no duplicates', () => {
      expect(dedup('abcdef')).toBe('abcdef');
    });

    test('should handle all same characters', () => {
      expect(dedup('aaaa')).toBe('a');
    });

    test('should handle mixed case', () => {
      expect(dedup('AaBbCc')).toBe('AaBbCc');
    });

    test('should handle special characters', () => {
      expect(dedup('!!@@##')).toBe('!@#');
    });
  });

  describe('allSpecialChars', () => {
    test('should contain all regex special characters', () => {
      const specialChars = allSpecialChars;
      expect(specialChars).toContain('.');
      expect(specialChars).toContain('*');
      expect(specialChars).toContain('+');
      expect(specialChars).toContain('?');
      expect(specialChars).toContain('^');
      expect(specialChars).toContain('$');
      expect(specialChars).toContain('{');
      expect(specialChars).toContain('}');
      expect(specialChars).toContain('(');
      expect(specialChars).toContain(')');
      expect(specialChars).toContain('|');
      expect(specialChars).toContain('[');
      expect(specialChars).toContain(']');
      expect(specialChars).toContain('\\');
    });

    test('should have correct length', () => {
      expect(allSpecialChars.length).toBe(14);
    });
  });

  describe('SpecialCharMeanings', () => {
    test('should contain meanings for all special characters', () => {
      expect(SpecialCharMeanings['.']).toBeDefined();
      expect(SpecialCharMeanings['*']).toBeDefined();
      expect(SpecialCharMeanings['+']).toBeDefined();
      expect(SpecialCharMeanings['?']).toBeDefined();
      expect(SpecialCharMeanings['^']).toBeDefined();
      expect(SpecialCharMeanings['$']).toBeDefined();
      expect(SpecialCharMeanings['{']).toBeDefined();
      expect(SpecialCharMeanings['}']).toBeDefined();
      expect(SpecialCharMeanings['(']).toBeDefined();
      expect(SpecialCharMeanings[')']).toBeDefined();
      expect(SpecialCharMeanings['|']).toBeDefined();
      expect(SpecialCharMeanings['[']).toBeDefined();
      expect(SpecialCharMeanings[']']).toBeDefined();
      expect(SpecialCharMeanings['\\']).toBeDefined();
    });
  });

  describe('allRegExpFlags', () => {
    test('should contain all RegExp flags', () => {
      expect(allRegExpFlags).toContain('g');
      expect(allRegExpFlags).toContain('i');
      expect(allRegExpFlags).toContain('m');
      expect(allRegExpFlags).toContain('s');
      expect(allRegExpFlags).toContain('u');
      expect(allRegExpFlags).toContain('y');
      expect(allRegExpFlags).toContain('d');
    });

    test('should have correct length', () => {
      expect(allRegExpFlags.length).toBe(7);
    });
  });

  describe('RegExpFlagMeanings', () => {
    test('should contain meanings for all flags', () => {
      expect(RegExpFlagMeanings['g']).toBeDefined();
      expect(RegExpFlagMeanings['i']).toBeDefined();
      expect(RegExpFlagMeanings['m']).toBeDefined();
      expect(RegExpFlagMeanings['s']).toBeDefined();
      expect(RegExpFlagMeanings['u']).toBeDefined();
      expect(RegExpFlagMeanings['y']).toBeDefined();
      expect(RegExpFlagMeanings['d']).toBeDefined();
    });
  });

  describe('Number utilities', () => {
    describe('toInt', () => {
      test('should convert valid integers', () => {
        expect(toInt('123')).toBe(123);
        expect(toInt('0')).toBe(0);
        expect(toInt('-456')).toBe(-456);
        expect(toInt('+789')).toBe(789);
      });

      test('should handle edge cases', () => {
        expect(toInt('')).toBe(0);
        expect(toInt('null')).toBe(0);
        expect(toInt('NULL')).toBe(0);
        expect(toInt('undefined')).toBe(0);
      });

      test('should handle whitespace', () => {
        expect(toInt('  123  ')).toBe(123);
        expect(toInt('\t456\t')).toBe(456);
      });

      test('should handle invalid input', () => {
        expect(toInt('abc')).toBe(0);
        expect(toInt('12.34')).toBe(0);
        expect(toInt('12a')).toBe(0);
      });
    });

    describe('toFloat', () => {
      test('should convert valid floats', () => {
        expect(toFloat('123.45')).toBe(123.45);
        expect(toFloat('0.0')).toBe(0);
        expect(toFloat('-456.78')).toBe(-456.78);
        expect(toFloat('+789.12')).toBe(789.12);
      });

      test('should convert integers', () => {
        expect(toFloat('123')).toBe(123);
        expect(toFloat('0')).toBe(0);
        expect(toFloat('-456')).toBe(-456);
      });

      test('should handle edge cases', () => {
        expect(toFloat('')).toBe(0);
        expect(toFloat('null')).toBe(0);
        expect(toFloat('NULL')).toBe(0);
        expect(toFloat('undefined')).toBe(0);
      });

      test('should handle whitespace', () => {
        expect(toFloat('  123.45  ')).toBe(123.45);
        expect(toFloat('\t456.78\t')).toBe(456.78);
      });

      test('should handle invalid input', () => {
        expect(toFloat('abc')).toBe(0);
        expect(toFloat('12.34.56')).toBe(0);
        expect(toFloat('12a')).toBe(0);
      });
    });

    describe('isInt', () => {
      test('should identify valid integers', () => {
        expect(isInt('123')).toBe(true);
        expect(isInt('0')).toBe(true);
        expect(isInt('-456')).toBe(true);
        expect(isInt('+789')).toBe(true);
      });

      test('should reject invalid integers', () => {
        expect(isInt('123.45')).toBe(false);
        expect(isInt('abc')).toBe(false);
        expect(isInt('')).toBe(false);
        expect(isInt('12a')).toBe(false);
        expect(isInt('12.34')).toBe(false);
      });

      test('should handle whitespace', () => {
        expect(isInt('  123  ')).toBe(true);
        expect(isInt('\t456\t')).toBe(true);
      });
    });

    describe('isFloat', () => {
      test('should identify valid floats', () => {
        expect(isFloat('123.45')).toBe(true);
        expect(isFloat('0.0')).toBe(true);
        expect(isFloat('-456.78')).toBe(true);
        expect(isFloat('+789.12')).toBe(true);
      });

      test('should identify integers as floats', () => {
        expect(isFloat('123')).toBe(true);
        expect(isFloat('0')).toBe(true);
        expect(isFloat('-456')).toBe(true);
      });

      test('should reject invalid floats', () => {
        expect(isFloat('abc')).toBe(false);
        expect(isFloat('')).toBe(false);
        expect(isFloat('12.34.56')).toBe(false);
        expect(isFloat('12a')).toBe(false);
      });

      test('should handle whitespace', () => {
        expect(isFloat('  123.45  ')).toBe(true);
        expect(isFloat('\t456.78\t')).toBe(true);
      });
    });

    describe('buildNumberPatterns', () => {
      test('should build US number patterns', () => {
        const patterns = buildNumberPatterns({ locale: 'us' });
        expect(patterns).toBeDefined();
        expect(patterns.integer).toBeDefined();
        expect(patterns.float).toBeDefined();
      });

      test('should build EU number patterns', () => {
        const patterns = buildNumberPatterns({ locale: 'eu' });
        expect(patterns).toBeDefined();
        expect(patterns.integer).toBeDefined();
        expect(patterns.float).toBeDefined();
      });

      test('should build underscore number patterns', () => {
        const patterns = buildNumberPatterns({ locale: 'underscore' });
        expect(patterns).toBeDefined();
        expect(patterns.integer).toBeDefined();
        expect(patterns.float).toBeDefined();
      });
    });

    describe('numberToString', () => {
      test('should convert numbers to strings', () => {
        expect(numberToString(123)).toBe('123');
        expect(numberToString(123.45)).toBe('123.45');
        expect(numberToString(0)).toBe('0');
        expect(numberToString(-456)).toBe('-456');
      });

      test('should handle edge cases', () => {
        expect(numberToString(NaN)).toBe('NaN');
        expect(numberToString(Infinity)).toBe('Infinity');
        expect(numberToString(-Infinity)).toBe('-Infinity');
      });
    });
  });

  describe('Phone number utilities', () => {
    describe('toPhoneNumber', () => {
      test('should parse phone numbers', () => {
        const result = toPhoneNumber('+1-555-123-4567');
        expect(result).toBeDefined();
        expect(result.countryCode).toBe('+1');
        expect(result.areaCode).toBe('555');
        expect(result.exchange).toBe('123');
        expect(result.number).toBe('4567');
      });

      test('should handle different formats', () => {
        const formats = [
          '(555) 123-4567',
          '555-123-4567',
          '555.123.4567',
          '+1 555 123 4567',
          '5551234567'
        ];

        formats.forEach(format => {
          const result = toPhoneNumber(format);
          expect(result).toBeDefined();
        });
      });

      test('should handle international numbers', () => {
        const result = toPhoneNumber('+44-20-7946-0958');
        expect(result).toBeDefined();
        expect(result.countryCode).toBe('+44');
        expect(result.areaCode).toBe('20');
        expect(result.exchange).toBe('7946');
        expect(result.number).toBe('0958');
      });
    });

    describe('isPhoneNumber', () => {
      test('should validate phone numbers', () => {
        expect(isPhoneNumber('+1-555-123-4567')).toBe(true);
        expect(isPhoneNumber('(555) 123-4567')).toBe(true);
        expect(isPhoneNumber('555-123-4567')).toBe(true);
        expect(isPhoneNumber('555.123.4567')).toBe(true);
        expect(isPhoneNumber('+1 555 123 4567')).toBe(true);
        expect(isPhoneNumber('5551234567')).toBe(true);
      });

      test('should reject invalid phone numbers', () => {
        expect(isPhoneNumber('123')).toBe(false);
        expect(isPhoneNumber('not-a-phone')).toBe(false);
        expect(isPhoneNumber('555-123')).toBe(false);
        expect(isPhoneNumber('555-123-4567-extra')).toBe(false);
      });

      test('should handle international numbers', () => {
        expect(isPhoneNumber('+44-20-7946-0958')).toBe(true);
        expect(isPhoneNumber('+33-1-42-86-83-26')).toBe(true);
      });
    });
  });

  describe('State utilities', () => {
    describe('matchAnyState', () => {
      test('should match state codes', () => {
        const result = matchAnyState('CA');
        expect(result).toBeDefined();
        expect(result.code).toBe('CA');
        expect(result.name).toBe('California');
      });

      test('should match state names', () => {
        const result = matchAnyState('California');
        expect(result).toBeDefined();
        expect(result.code).toBe('CA');
        expect(result.name).toBe('California');
      });

      test('should handle case variations', () => {
        const result = matchAnyState('california');
        expect(result).toBeDefined();
        expect(result.code).toBe('CA');
        expect(result.name).toBe('California');
      });

      test('should handle mixed case', () => {
        const result = matchAnyState('CaLiFoRnIa');
        expect(result).toBeDefined();
        expect(result.code).toBe('CA');
        expect(result.name).toBe('California');
      });

      test('should return null for invalid states', () => {
        const result = matchAnyState('InvalidState');
        expect(result).toBeNull();
      });

      test('should return null for invalid codes', () => {
        const result = matchAnyState('XX');
        expect(result).toBeNull();
      });

      test('should handle empty string', () => {
        const result = matchAnyState('');
        expect(result).toBeNull();
      });

      test('should handle various state formats', () => {
        const testCases = [
          'NY', 'New York',
          'TX', 'Texas',
          'FL', 'Florida',
          'WA', 'Washington',
          'OR', 'Oregon'
        ];

        testCases.forEach(testCase => {
          const result = matchAnyState(testCase);
          expect(result).toBeDefined();
          expect(result.code).toBeDefined();
          expect(result.name).toBeDefined();
        });
      });
    });
  });

  describe('Integration tests', () => {
    test('should work together in complex scenarios', () => {
      // Test escape with dedup
      const specialChars = '.*+?^${}()|[]\\';
      const escaped = escape(specialChars);
      const deduped = dedup(escaped);
      expect(deduped).toBeDefined();

      // Test number utilities together
      const numberString = '123.45';
      const isNumber = isFloat(numberString);
      const number = toFloat(numberString);
      expect(isNumber).toBe(true);
      expect(number).toBe(123.45);

      // Test phone utilities together
      const phoneString = '+1-555-123-4567';
      const isValidPhone = isPhoneNumber(phoneString);
      const phoneData = toPhoneNumber(phoneString);
      expect(isValidPhone).toBe(true);
      expect(phoneData).toBeDefined();

      // Test state utilities
      const stateString = 'California';
      const stateData = matchAnyState(stateString);
      expect(stateData).toBeDefined();
      expect(stateData.code).toBe('CA');
    });
  });

  describe('Edge cases and error handling', () => {
    test('should handle null and undefined inputs', () => {
      expect(toInt(null as any)).toBe(0);
      expect(toFloat(null as any)).toBe(0);
      expect(isInt(null as any)).toBe(false);
      expect(isFloat(null as any)).toBe(false);
      expect(matchAnyState(null as any)).toBeNull();
    });

    test('should handle very large numbers', () => {
      const largeNumber = '999999999999999999';
      expect(isInt(largeNumber)).toBe(true);
      expect(toInt(largeNumber)).toBe(999999999999999999);
    });

    test('should handle very small numbers', () => {
      const smallNumber = '0.000000001';
      expect(isFloat(smallNumber)).toBe(true);
      expect(toFloat(smallNumber)).toBe(0.000000001);
    });

    test('should handle scientific notation', () => {
      const scientific = '1.23e+5';
      expect(isFloat(scientific)).toBe(true);
      expect(toFloat(scientific)).toBe(123000);
    });
  });
});
