import { re, matchAndExtract } from '../repart';
import {
  padded,
  p,
  line,
  mline,
  paddedline,
  paddedmline,
  separator,
  sep, gseparator
} from '../repart/generic';

describe('Generic Templates', () => {
  describe('padded / p', () => {
    test('should add optional whitespace padding', () => {
      const pattern = padded`hello`;
      const testCases = [
        'hello',
        ' hello',
        'hello ',
        ' hello ',
        '\thello\t',
        '  hello  '
      ];

      testCases.forEach(testCase => {
        const result = matchAndExtract(testCase, pattern);
        expect(result).not.toBeNull();
        expect(result.padded).toBe('hello');
      });
    });

    test('should work with p alias', () => {
      const pattern = p`world`;
      const result = matchAndExtract(' world ', pattern);
      expect(result.p).toBe('world');
    });

    test('should work in templates', () => {
      const pattern = re`prefix: ${padded`hello`}`;
      const result = matchAndExtract('prefix:  hello  ', pattern);
      expect(result.padded).toBe('hello');
    });

    test('should handle multiple spaces', () => {
      const pattern = padded`test`;
      const result = matchAndExtract('   test   ', pattern);
      expect(result.padded).toBe('test');
    });

    test('should handle tabs', () => {
      const pattern = padded`test`;
      const result = matchAndExtract('\ttest\t', pattern);
      expect(result.padded).toBe('test');
    });
  });

  describe('line', () => {
    test('should match complete line without multiline mode', () => {
      const pattern = line`hello`;
      const result = matchAndExtract('hello', pattern);
      expect(result).not.toBeNull();
      expect(result.line).toBe('hello');
    });

    test('should work with multiline strings', () => {
      const pattern = line`hello`.withFlags('m');
      const result = matchAndExtract('hello\nworld', pattern);
      expect(result).not.toBeNull();
      expect(result.line).toBe('hello');
    });


    test('should handle line with content', () => {
      const pattern = line`hello world`;
      const result = matchAndExtract('hello world', pattern);
      expect(result.line).toBe('hello world');
    });
  });

  describe('mline', () => {
    test('should match complete line with multiline mode', () => {
      const pattern = mline`hello`
      const result = matchAndExtract('hello', pattern);
      expect(result).not.toBeNull();
      expect(result.mline).toBe('hello');
    });

    test('should work with multiline strings', () => {
      const pattern = mline`hello`
      const result = matchAndExtract('hello\nworld', pattern);
      expect(result).not.toBeNull();
      expect(result.mline).toBe('hello');
    });

    test('should handle multiple lines', () => {
      const pattern = mline`hello`.withFlags('g');
      const result = matchAndExtract('hello\nworld\ntest', pattern);
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
      expect(result[0].mline).toBe('hello');
    });
  });

  describe('paddedline', () => {
    test('should match padded line without multiline mode', () => {
      const pattern = paddedline`hello`;
      const testCases = [
        'hello',
        ' hello',
        'hello ',
        ' hello ',
        '\thello\t'
      ];

      testCases.forEach(testCase => {
        const result = matchAndExtract(testCase, pattern);
        expect(result).not.toBeNull();
        expect(result.paddedline).toBe('hello');
      });
    });

    test('should work in templates', () => {
      const pattern = re`prefix:\s*${paddedline`hello`}`;
      const result = matchAndExtract('prefix:  \n hello  ', pattern);
      expect(result.paddedline).toBe('hello');
    });

    test('should handle multiline strings', () => {
      const pattern = paddedline`hello`.withFlags('m');
      const result = matchAndExtract(' hello \nworld', pattern);
      expect(result.paddedline).toBe('hello');
    });
  });

  describe('paddedmline', () => {
    test('should match padded line with multiline mode', () => {
      const pattern = paddedmline`hello`;
      const testCases = [
        'hello',
        ' hello',
        'hello ',
        ' hello ',
        '\thello\t'
      ];

      testCases.forEach(testCase => {
        const result = matchAndExtract(testCase, pattern);
        expect(result).not.toBeNull();
        expect(result.paddedmline).toBe('hello');
      });
    });

    test('should work in templates', () => {
      const pattern = re`prefix:\s*${paddedmline`hello`}`;
      const result = matchAndExtract('prefix:  \n hello  ', pattern);
      expect(result.paddedmline).toBe('hello');
    });

    test('should handle multiple lines', () => {
      const pattern = paddedmline`hello`.withFlags('g');
      const result = matchAndExtract(' hello \n world \n test ', pattern);
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
      expect(result[0].paddedmline).toBe('hello');
    });
  });

  describe('separator / sep', () => {
    test('should capture content around separator', () => {
      const pattern = separator`;`;
      const result = matchAndExtract('hello;world', pattern).separator;
      
      expect(result).not.toBeNull();
      expect(result.before).toBe('hello');
      expect(result.match).toBe(';');
      expect(result.after).toBe('world');
    });

    test('should work with sep alias', () => {
      const pattern = sep`,`;
      const result = matchAndExtract('hello,world', pattern).sep;
      
      expect(result).not.toBeNull();
      expect(result.before).toBe('hello');
      expect(result.match).toBe(',');
      expect(result.after).toBe('world');
    });

    test('should work in templates', () => {
      const pattern = re`data: ${separator`:`}`;
      const result = matchAndExtract('data: key:value', pattern).separator;
      
      expect(result.before).toBe('key');
      expect(result.match).toBe(':');
      expect(result.after).toBe('value');
    });

    test('should handle multiple separators', () => {
      const pattern = gseparator`;`.withFlags('g');
      const result = matchAndExtract('a;b;c;d', pattern);
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(3);
      expect(result[0].before).toBe('a');
      expect(result[0].after).toBe('b');
      expect(result[1].before).toBe('b');
      expect(result[1].after).toBe('c');
      expect(result[2].before).toBe('c');
      expect(result[2].after).toBe('d');
    });

    test('should handle complex separators', () => {
      const pattern = separator`->`;
      const result = matchAndExtract('hello->world', pattern).separator;
      
      expect(result.before).toBe('hello');
      expect(result.match).toBe('->');
      expect(result.after).toBe('world');
    });

    test('should handle whitespace around separators', () => {
      const pattern = separator`=`;
      const result = matchAndExtract('key = value', pattern).separator;
      
      expect(result.before).toBe('key ');
      expect(result.match).toBe('=');
      expect(result.after).toBe(' value');
    });
  });

  describe('Complex template combinations', () => {
    test('should combine padded with line', () => {
      const pattern = re`${padded`hello`}${line`world`}`;
      const result = matchAndExtract(' hello \nworld', pattern);
      
      expect(result.padded).toBe('hello');
      expect(result.line).toBe('world');
    });

    test('should combine separator with padded', () => {
      const pattern = re`${padded`key`.as('positive-lookahead')}${separator`:`}${padded`value`.as('value')}`;
      const result = matchAndExtract(' key : value ', pattern);
      
      expect(result.padded).toBe('key');
      expect(result.separator.before).toBe(' key ');
      expect(result.separator.match).toBe(':');
      expect(result.separator.after).toBe(' value ');
      expect(result.value).toBe('value');
    });


  });



  describe('Edge cases', () => {
    test('should handle empty content', () => {
      const pattern = padded``;
      const result = matchAndExtract('', pattern);
      expect(result.padded).toBe('');
    });

    test('should handle only whitespace', () => {
      const pattern = padded`test`.as('padded');
      const result = matchAndExtract('   ', pattern);
      expect(result).toBeNull();
    });

    test('should handle separator at start', () => {
      const pattern = separator`;`;
      const result = matchAndExtract(';world', pattern);
      
      expect(result.separator.before).toBe('');
      expect(result.separator.match).toBe(';');
      expect(result.separator.after).toBe('world');
    });

    test('should handle separator at end', () => {
      const pattern = separator`;`;
      const result = matchAndExtract('hello;', pattern);
      
      expect(result.separator.before).toBe('hello');
      expect(result.separator.match).toBe(';');
      expect(result.separator.after).toBe('');
    });

    test('should handle no separator', () => {
      const pattern = separator`;`;
      const result = matchAndExtract('hello world', pattern);
      expect(result).toBeNull();
    });
  });

  describe('Multiline scenarios', () => {
    test('should handle complex multiline content', () => {
      const pattern = mline`hello`.withFlags('g');
      const result = matchAndExtract(`
hello
        world
        test
      `, pattern);
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
    });

    test('should handle padded multiline content', () => {
      const pattern = paddedmline`hello`.as('paddedmline').withFlags('g');
      const result = matchAndExtract(`
         hello 
         world 
         test 
      `, pattern);
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
      expect(result[0].paddedmline).toBe('hello');
    });

    test('should handle separator across lines', () => {
      const pattern = separator`\n`.withFlags('s');
      const result = matchAndExtract('hello\nworld', pattern);
      
      expect(result.separator.before).toBe('hello');
      expect(result.separator.match).toBe('\n');
      expect(result.separator.after).toBe('world');
    });
  });

  describe('Performance', () => {
    test('should handle large content efficiently', () => {
      const largeContent = 'x'.repeat(10000);
      const pattern = padded`\w*`;
      const result = matchAndExtract(`  ${largeContent}  `, pattern);
      expect(result.padded).toBe(largeContent);
    });

    test('should handle many separators efficiently', () => {
      const manySeparators = Array.from({ length: 1000 }, (_, i) => `item${i}`).join(';');
      const pattern = separator`;`.withFlags('g');
      const result = matchAndExtract(manySeparators, pattern);
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(999);
    });
  });
});
