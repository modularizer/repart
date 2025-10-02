import { re, matchAndExtract } from '../repart';
import {
  tripleBacktick,
  tripleTick,
  tripleQuotation,
  tripleQuote,
  tick,
  backtick,
  quotation,
  anyQuotation,
  quote,
  parenth,
  pa,
  curlyBracket,
  cb,
  squareBracket,
  sb
} from '../repart/generic';

describe('Generic Wrappers', () => {
  describe('Triple quote wrappers', () => {
    describe('tripleBacktick', () => {
      test('should match triple backtick delimiters', () => {
        const pattern = tripleBacktick`code`;
        const result = matchAndExtract('```code```', pattern);
        expect(result).not.toBeNull();
        expect(result.tripleBacktick).toBe('code');
      });

      test('should work with multiline content', () => {
        const pattern = tripleBacktick`code`;
        const result = matchAndExtract('```\nline1\nline2\n```', pattern);
        expect(result).not.toBeNull();
        expect(result.tripleBacktick).toBe('\nline1\nline2\n');
      });

      test('should work in templates', () => {
        const pattern = re`prefix: ${tripleBacktick`code`}`;
        const result = matchAndExtract('prefix: ```code```', pattern);
        expect(result.tripleBacktick).toBe('code');
      });
    });

    describe('tripleTick', () => {
      test('should match triple single quote delimiters', () => {
        const pattern = tripleTick`code`;
        const result = matchAndExtract("'''code'''", pattern);
        expect(result).not.toBeNull();
        expect(result.tripleTick).toBe('code');
      });

      test('should work with multiline content', () => {
        const pattern = tripleTick`code`;
        const result = matchAndExtract("'''\nline1\nline2\n'''", pattern);
        expect(result).not.toBeNull();
        expect(result.tripleTick).toBe('\nline1\nline2\n');
      });
    });

    describe('tripleQuotation', () => {
      test('should match triple double quote delimiters', () => {
        const pattern = tripleQuotation`code`;
        const result = matchAndExtract('"""code"""', pattern);
        expect(result).not.toBeNull();
        expect(result.tripleQuotation).toBe('code');
      });

      test('should work with multiline content', () => {
        const pattern = tripleQuotation`code`;
        const result = matchAndExtract('"""\nline1\nline2\n"""', pattern);
        expect(result).not.toBeNull();
        expect(result.tripleQuotation).toBe('\nline1\nline2\n');
      });
    });

    describe('tripleQuote', () => {
      test('should match any triple quote type', () => {
        const pattern = tripleQuote`code`;
        
        const testCases = [
          '```code```',
          "'''code'''",
          '"""code"""'
        ];

        testCases.forEach(testCase => {
          const result = matchAndExtract(testCase, pattern);
          expect(result).not.toBeNull();
        });
      });

      test('should work with multiline content', () => {
        const pattern = tripleQuote`code`;
        
        const testCases = [
          '```\nline1\nline2\n```',
          "'''\nline1\nline2\n'''",
          '"""\nline1\nline2\n"""'
        ];

        testCases.forEach(testCase => {
          const result = matchAndExtract(testCase, pattern);
          expect(result).not.toBeNull();
        });
      });
    });
  });

  describe('Single quote wrappers', () => {
    describe('backtick', () => {
      test('should match single backtick delimiters', () => {
        const pattern = backtick`code`;
        const result = matchAndExtract('`code`', pattern);
        expect(result).not.toBeNull();
        expect(result.backtick).toBe('code');
      });

      test('should work in templates', () => {
        const pattern = re`prefix: ${backtick`code`}`;
        const result = matchAndExtract('prefix: `code`', pattern);
        expect(result.backtick).toBe('code');
      });
    });

    describe('tick', () => {
      test('should match single quote delimiters', () => {
        const pattern = tick`code`;
        const result = matchAndExtract("'code'", pattern);
        expect(result).not.toBeNull();
        expect(result.tick).toBe('code');
      });

      test('should work in templates', () => {
        const pattern = re`prefix: ${tick`code`}`;
        const result = matchAndExtract("prefix: 'code'", pattern);
        expect(result.tick).toBe('code');
      });
    });

    describe('quotation', () => {
      test('should match double quote delimiters', () => {
        const pattern = quotation`code`;
        const result = matchAndExtract('"code"', pattern);
        expect(result).not.toBeNull();
        expect(result.quotation).toBe('code');
      });

      test('should work in templates', () => {
        const pattern = re`prefix: ${quotation`code`}`;
        const result = matchAndExtract('prefix: "code"', pattern);
        expect(result.quotation).toBe('code');
      });
    });

    describe('anyQuotation', () => {
      test('should match any quote character', () => {
        const pattern = anyQuotation;
        const testCases = ['`', "'", '"'];

        testCases.forEach(testCase => {
          const result = matchAndExtract(testCase, pattern);
          expect(result).not.toBeNull();
          expect(result.anyQuotation).toBe(testCase);
        });
      });
    });

    describe('quote', () => {
      test('should match any quote-wrapped content', () => {
        const pattern = quote`code`;
        const testCases = ['`code`', "'code'", '"code"'];

        testCases.forEach(testCase => {
          const result = matchAndExtract(testCase, pattern);
          expect(result).not.toBeNull();
          expect(result.quote).toBe('code');
        });
      });

      test('should work in templates', () => {
        const pattern = re`prefix: ${quote`code`}`;
        const result = matchAndExtract('prefix: `code`', pattern);
        expect(result.quote).toBe('code');
      });
    });
  });

  describe('Bracket wrappers', () => {
    describe('parenth / pa', () => {
      test('should match parentheses', () => {
        const pattern = parenth`content`;
        const result = matchAndExtract('(content)', pattern);
        expect(result).not.toBeNull();
        expect(result.parenth).toBe('content');
      });

      test('should work with pa alias', () => {
        const pattern = pa`content`;
        const result = matchAndExtract('(content)', pattern);
        expect(result).not.toBeNull();
        expect(result.pa).toBe('content');
      });

      test('should work in templates', () => {
        const pattern = re`prefix: ${parenth`content`}`;
        const result = matchAndExtract('prefix: (content)', pattern);
        expect(result.parenth).toBe('content');
      });

      test('should handle nested parentheses', () => {
        const pattern = parenth`content`;
        const result = matchAndExtract('(outer (inner) content)', pattern);
        expect(result).not.toBeNull();
        expect(result.parenth).toBe('outer (inner) content');
      });
    });

    describe('squareBracket / sb', () => {
      test('should match square brackets', () => {
        const pattern = squareBracket`content`;
        const result = matchAndExtract('[content]', pattern);
        expect(result).not.toBeNull();
        expect(result.squareBracket).toBe('content');
      });

      test('should work with sb alias', () => {
        const pattern = sb`content`;
        const result = matchAndExtract('[content]', pattern);
        expect(result).not.toBeNull();
        expect(result.sb).toBe('content');
      });

      test('should work in templates', () => {
        const pattern = re`prefix: ${squareBracket`content`}`;
        const result = matchAndExtract('prefix: [content]', pattern);
        expect(result.squareBracket).toBe('content');
      });

      test('should handle nested brackets', () => {
        const pattern = squareBracket`content`;
        const result = matchAndExtract('[outer [inner] content]', pattern);
        expect(result).not.toBeNull();
        expect(result.squareBracket).toBe('outer [inner] content');
      });
    });

    describe('curlyBracket / cb', () => {
      test('should match curly brackets', () => {
        const pattern = curlyBracket`content`;
        const result = matchAndExtract('{content}', pattern);
        expect(result).not.toBeNull();
        expect(result.curlyBracket).toBe('content');
      });

      test('should work with cb alias', () => {
        const pattern = cb`content`;
        const result = matchAndExtract('{content}', pattern);
        expect(result).not.toBeNull();
        expect(result.cb).toBe('content');
      });

      test('should work in templates', () => {
        const pattern = re`prefix: ${curlyBracket`content`}`;
        const result = matchAndExtract('prefix: {content}', pattern);
        expect(result.curlyBracket).toBe('content');
      });

      test('should handle nested brackets', () => {
        const pattern = curlyBracket`content`;
        const result = matchAndExtract('{outer {inner} content}', pattern);
        expect(result).not.toBeNull();
        expect(result.curlyBracket).toBe('outer {inner} content');
      });
    });
  });

  describe('Complex wrapper combinations', () => {
    test('should combine different wrapper types', () => {
      const pattern = re`
        code: ${backtick`code`}, 
        data: ${parenth`data`}, 
        list: ${squareBracket`item`}
      `;
      
      const result = matchAndExtract('code: `hello`, data: (world), list: [test]', pattern);
      
      expect(result.backtick).toBe('hello');
      expect(result.parenth).toBe('world');
      expect(result.squareBracket).toBe('test');
    });

    test('should handle mixed quote types', () => {
      const pattern = re`
        backtick: ${backtick`code`}, 
        single: ${tick`code`}, 
        double: ${quotation`code`}
      `;
      
      const result = matchAndExtract('backtick: `hello`, single: \'world\', double: "test"', pattern);
      
      expect(result.backtick).toBe('hello');
      expect(result.tick).toBe('world');
      expect(result.quotation).toBe('test');
    });

    test('should work with triple quotes', () => {
      const pattern = re`
        js: ${tripleBacktick`code`}, 
        py: ${tripleTick`code`}, 
        doc: ${tripleQuotation`code`}
      `;
      
      const result = matchAndExtract(`
        js: \`\`\`console.log('hello')\`\`\`, 
        py: '''print('world')''', 
        doc: """This is a docstring"""
      `, pattern);
      
      expect(result.tripleBacktick).toBe("console.log('hello')");
      expect(result.tripleTick).toBe("print('world')");
      expect(result.tripleQuotation).toBe('This is a docstring');
    });
  });

  describe('Integration with parsers', () => {
    test('should work with quote wrappers and parsers', () => {
      const pattern = re`name: ${quotation`name`}`.withParsers({
        quotation: (s: string) => s.toUpperCase()
      });
      
      const result = matchAndExtract('name: "john"', pattern);
      expect(result.quotation).toBe('JOHN');
    });

    test('should work with bracket wrappers and parsers', () => {
      const pattern = re`data: ${parenth`data`}`.withParsers({
        parenth: (s: string) => s.split(',').map(s => s.trim())
      });
      
      const result = matchAndExtract('data: (a, b, c)', pattern);
      expect(result.parenth).toEqual(['a', 'b', 'c']);
    });

    test('should work with triple quotes and parsers', () => {
      const pattern = re`code: ${tripleBacktick`code`}`.withParsers({
        tripleBacktick: (s: string) => s.split('\n').length
      });
      
      const result = matchAndExtract('code: ```\nline1\nline2\n```', pattern);
      expect(result.tripleBacktick).toBe(3);
    });
  });

  describe('Edge cases', () => {
    test('should handle empty content', () => {
      const pattern = backtick`content`;
      const result = matchAndExtract('``', pattern);
      expect(result.backtick).toBe('');
    });

    test('should handle special characters in content', () => {
      const pattern = quotation`content`;
      const result = matchAndExtract('"hello world!@#$%"', pattern);
      expect(result.quotation).toBe('hello world!@#$%');
    });

    test('should handle unicode content', () => {
      const pattern = backtick`content`;
      const result = matchAndExtract('`café naïve`', pattern);
      expect(result.backtick).toBe('café naïve');
    });

    test('should handle very long content', () => {
      const longContent = 'a'.repeat(1000);
      const pattern = parenth`content`;
      const result = matchAndExtract(`(${longContent})`, pattern);
      expect(result.parenth).toBe(longContent);
    });
  });

  describe('Nested scenarios', () => {
    test('should handle nested quotes', () => {
      const pattern = quotation`content`;
      const result = matchAndExtract('"He said \\"hello\\" to me"', pattern);
      expect(result.quotation).toBe('He said "hello" to me');
    });

    test('should handle nested brackets', () => {
      const pattern = parenth`content`;
      const result = matchAndExtract('(outer (inner) content)', pattern);
      expect(result.parenth).toBe('outer (inner) content');
    });

    test('should handle mixed nesting', () => {
      const pattern = re`${quotation`content`}`;
      const result = matchAndExtract('"(data [item])"', pattern);
      expect(result.quotation).toBe('(data [item])');
    });
  });

  describe('Performance', () => {
    test('should handle large content efficiently', () => {
      const largeContent = 'x'.repeat(10000);
      const pattern = tripleBacktick`content`;
      const result = matchAndExtract(`\`\`\`${largeContent}\`\`\``, pattern);
      expect(result.tripleBacktick).toBe(largeContent);
    });

    test('should handle many nested levels', () => {
      let nested = 'content';
      for (let i = 0; i < 10; i++) {
        nested = `(${nested})`;
      }
      
      const pattern = parenth`content`;
      const result = matchAndExtract(nested, pattern);
      expect(result.parenth).toBe(nested.slice(1, -1));
    });
  });
});
