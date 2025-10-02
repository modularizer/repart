import { re, matchAndExtract } from '../repart';
import {
  li,
  bold,
  b,
  italics,
  i,
  header,
  h1,
  h2,
  h3,
  h4,
  h5,
  h6,
  s1,
  s2,
  s3,
  s4,
  s5,
  s6,
  checkbox,
  checkboxChecked,
  checkboxUnchecked,
  checkboxLine,
  agreement,
  previewAgreement,
  linkto,
  link
} from '../repart/md';

describe('Markdown Patterns', () => {
  describe('List items', () => {
    describe('li', () => {
      test('should match list items', () => {
        const testCases = [
          '- item',
          '* item',
          '+ item',
          '1. item',
          '2. item'
        ];

        testCases.forEach(testCase => {
          const result = matchAndExtract(testCase, li);
          expect(result).not.toBeNull();
          expect(result.li).toBe(testCase);
        });
      });

      test('should work in templates', () => {
        const pattern = re`prefix: ${li}`;
        const result = matchAndExtract('prefix: - item', pattern);
        expect(result.li).toBe('- item');
      });

      test('should handle nested content', () => {
        const pattern = li;
        const result = matchAndExtract('- **bold** item', pattern);
        expect(result.li).toBe('- **bold** item');
      });
    });
  });

  describe('Text formatting', () => {
    describe('bold / b', () => {
      test('should match bold text', () => {
        const testCases = [
          '**bold**',
          '__bold__'
        ];

        testCases.forEach(testCase => {
          const result = matchAndExtract(testCase, bold);
          expect(result).not.toBeNull();
          expect(result.bold).toBe(testCase);
        });
      });

      test('should work with b alias', () => {
        const result = matchAndExtract('**bold**', b);
        expect(result.b).toBe('**bold**');
      });

      test('should work in templates', () => {
        const pattern = re`prefix: ${bold}`;
        const result = matchAndExtract('prefix: **bold**', pattern);
        expect(result.bold).toBe('**bold**');
      });

      test('should handle bold content', () => {
        const pattern = bold;
        const result = matchAndExtract('**hello world**', pattern);
        expect(result.bold).toBe('**hello world**');
      });
    });

    describe('italics / i', () => {
      test('should match italic text', () => {
        const testCases = [
          '*italic*',
          '_italic_'
        ];

        testCases.forEach(testCase => {
          const result = matchAndExtract(testCase, italics);
          expect(result).not.toBeNull();
          expect(result.italics).toBe(testCase);
        });
      });

      test('should work with i alias', () => {
        const result = matchAndExtract('*italic*', i);
        expect(result.i).toBe('*italic*');
      });

      test('should work in templates', () => {
        const pattern = re`prefix: ${italics}`;
        const result = matchAndExtract('prefix: *italic*', pattern);
        expect(result.italics).toBe('*italic*');
      });

      test('should handle italic content', () => {
        const pattern = italics;
        const result = matchAndExtract('*hello world*', pattern);
        expect(result.italics).toBe('*hello world*');
      });
    });
  });

  describe('Headers', () => {
    describe('header', () => {
      test('should match generic headers', () => {
        const testCases = [
          '# Header',
          '## Header',
          '### Header',
          '#### Header',
          '##### Header',
          '###### Header'
        ];

        testCases.forEach(testCase => {
          const result = matchAndExtract(testCase, header);
          expect(result).not.toBeNull();
          expect(result.header).toBe(testCase);
        });
      });

      test('should work in templates', () => {
        const pattern = re`prefix: ${header}`;
        const result = matchAndExtract('prefix: # Header', pattern);
        expect(result.header).toBe('# Header');
      });
    });

    describe('specific header levels (h1-h6)', () => {
      test('should match h1 headers', () => {
        const result = matchAndExtract('# Header', h1);
        expect(result.h1).toBe('# Header');
      });

      test('should match h2 headers', () => {
        const result = matchAndExtract('## Header', h2);
        expect(result.h2).toBe('## Header');
      });

      test('should match h3 headers', () => {
        const result = matchAndExtract('### Header', h3);
        expect(result.h3).toBe('### Header');
      });

      test('should match h4 headers', () => {
        const result = matchAndExtract('#### Header', h4);
        expect(result.h4).toBe('#### Header');
      });

      test('should match h5 headers', () => {
        const result = matchAndExtract('##### Header', h5);
        expect(result.h5).toBe('##### Header');
      });

      test('should match h6 headers', () => {
        const result = matchAndExtract('###### Header', h6);
        expect(result.h6).toBe('###### Header');
      });

      test('should not match wrong levels', () => {
        const result1 = matchAndExtract('## Header', h1);
        expect(result1).toBeNull();

        const result2 = matchAndExtract('# Header', h2);
        expect(result2).toBeNull();
      });
    });

    describe('specific header counts (s1-s6)', () => {
      test('should match s1 (exactly 1 #)', () => {
        const result = matchAndExtract('# Header', s1);
        expect(result.s1).toBe('# Header');
      });

      test('should match s2 (exactly 2 #)', () => {
        const result = matchAndExtract('## Header', s2);
        expect(result.s2).toBe('## Header');
      });

      test('should match s3 (exactly 3 #)', () => {
        const result = matchAndExtract('### Header', s3);
        expect(result.s3).toBe('### Header');
      });

      test('should match s4 (exactly 4 #)', () => {
        const result = matchAndExtract('#### Header', s4);
        expect(result.s4).toBe('#### Header');
      });

      test('should match s5 (exactly 5 #)', () => {
        const result = matchAndExtract('##### Header', s5);
        expect(result.s5).toBe('##### Header');
      });

      test('should match s6 (exactly 6 #)', () => {
        const result = matchAndExtract('###### Header', s6);
        expect(result.s6).toBe('###### Header');
      });

      test('should not match wrong counts', () => {
        const result1 = matchAndExtract('## Header', s1);
        expect(result1).toBeNull();

        const result2 = matchAndExtract('# Header', s2);
        expect(result2).toBeNull();
      });
    });
  });

  describe('Checkboxes', () => {
    describe('checkbox', () => {
      test('should match any checkbox', () => {
        const testCases = [
          '[ ]',
          '[x]',
          '[X]'
        ];

        testCases.forEach(testCase => {
          const result = matchAndExtract(testCase, checkbox);
          expect(result).not.toBeNull();
          expect(result.checkbox).toBe(testCase);
        });
      });

      test('should work in templates', () => {
        const pattern = re`prefix: ${checkbox}`;
        const result = matchAndExtract('prefix: [x]', pattern);
        expect(result.checkbox).toBe('[x]');
      });
    });

    describe('checkboxChecked', () => {
      test('should match checked checkboxes', () => {
        const testCases = [
          '[x]',
          '[X]'
        ];

        testCases.forEach(testCase => {
          const result = matchAndExtract(testCase, checkboxChecked);
          expect(result).not.toBeNull();
          expect(result.checkboxChecked).toBe(testCase);
        });
      });

      test('should not match unchecked checkboxes', () => {
        const result = matchAndExtract('[ ]', checkboxChecked);
        expect(result).toBeNull();
      });
    });

    describe('checkboxUnchecked', () => {
      test('should match unchecked checkboxes', () => {
        const result = matchAndExtract('[ ]', checkboxUnchecked);
        expect(result).not.toBeNull();
        expect(result.checkboxUnchecked).toBe('[ ]');
      });

      test('should not match checked checkboxes', () => {
        const result = matchAndExtract('[x]', checkboxUnchecked);
        expect(result).toBeNull();
      });
    });

    describe('checkboxLine', () => {
      test('should match checkbox with content', () => {
        const testCases = [
          '[ ] task',
          '[x] completed task',
          '[X] DONE TASK'
        ];

        testCases.forEach(testCase => {
          const result = matchAndExtract(testCase, checkboxLine);
          expect(result).not.toBeNull();
          expect(result.checkboxLine).toBe(testCase);
        });
      });

      test('should work in templates', () => {
        const pattern = re`prefix: ${checkboxLine}`;
        const result = matchAndExtract('prefix: [x] task', pattern);
        expect(result.checkboxLine).toBe('[x] task');
      });
    });
  });

  describe('Agreements', () => {
    describe('agreement', () => {
      test('should match agreement patterns', () => {
        const testCases = [
          '**key** notes',
          '**important** details',
          '**warning** message'
        ];

        testCases.forEach(testCase => {
          const result = matchAndExtract(testCase, agreement);
          expect(result).not.toBeNull();
          expect(result.agreement).toBe(testCase);
        });
      });

      test('should work in templates', () => {
        const pattern = re`prefix: ${agreement}`;
        const result = matchAndExtract('prefix: **key** notes', pattern);
        expect(result.agreement).toBe('**key** notes');
      });
    });

    describe('previewAgreement', () => {
      test('should match preview agreement format', () => {
        const result = matchAndExtract('**key** notes', previewAgreement);
        expect(result).not.toBeNull();
        expect(result.previewAgreement).toBe('**key** notes');
      });

      test('should work in templates', () => {
        const pattern = re`prefix: ${previewAgreement}`;
        const result = matchAndExtract('prefix: **key** notes', pattern);
        expect(result.previewAgreement).toBe('**key** notes');
      });
    });
  });

  describe('Links', () => {
    describe('linkto', () => {
      test('should match link destinations', () => {
        const testCases = [
          '(https://example.com)',
          '(mailto:test@example.com)',
          '(./relative/path)',
          '(#anchor)'
        ];

        testCases.forEach(testCase => {
          const result = matchAndExtract(testCase, linkto);
          expect(result).not.toBeNull();
          expect(result.linkto).toBe(testCase);
        });
      });

      test('should work in templates', () => {
        const pattern = re`prefix: ${linkto}`;
        const result = matchAndExtract('prefix: (https://example.com)', pattern);
        expect(result.linkto).toBe('(https://example.com)');
      });
    });

    describe('link', () => {
      test('should match complete links', () => {
        const testCases = [
          '[text](https://example.com)',
          '[bold text](https://example.com)',
          '[email](mailto:test@example.com)',
          '[relative](./path)',
          '[anchor](#section)'
        ];

        testCases.forEach(testCase => {
          const result = matchAndExtract(testCase, link);
          expect(result).not.toBeNull();
          expect(result.link).toBe(testCase);
        });
      });

      test('should work in templates', () => {
        const pattern = re`prefix: ${link}`;
        const result = matchAndExtract('prefix: [text](https://example.com)', pattern);
        expect(result.link).toBe('[text](https://example.com)');
      });
    });
  });

  describe('Complex markdown combinations', () => {
    test('should combine multiple markdown elements', () => {
      const pattern = re`
        ${header.as('header')}
        ${li.as('item')}
        ${bold.as('bold')}
        ${link.as('link')}
      `;
      
      const result = matchAndExtract(`
        # Header
        - **bold** item
        [link](https://example.com)
      `, pattern);
      
      expect(result.header).toBe('# Header');
      expect(result.item).toBe('- **bold** item');
      expect(result.bold).toBe('**bold**');
      expect(result.link).toBe('[link](https://example.com)');
    });

    test('should handle nested markdown', () => {
      const pattern = re`${li}`;
      const result = matchAndExtract('- **bold** and *italic* text', pattern);
      expect(result.li).toBe('- **bold** and *italic* text');
    });

    test('should work with multiple items', () => {
      const pattern = re`${li}`.withFlags('g');
      const result = matchAndExtract(`
        - item 1
        - item 2
        - item 3
      `, pattern);
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(3);
      expect(result[0].li).toBe('- item 1');
      expect(result[1].li).toBe('- item 2');
      expect(result[2].li).toBe('- item 3');
    });
  });

  describe('Integration with parsers', () => {
    test('should work with header parsers', () => {
      const pattern = re`${header.as('header')}`.withParsers({
        header: (s: string) => s.replace(/^#+\s*/, '')
      });
      
      const result = matchAndExtract('# Header', pattern);
      expect(result.header).toBe('Header');
    });

    test('should work with checkbox parsers', () => {
      const pattern = re`${checkboxLine.as('task')}`.withParsers({
        task: (s: string) => ({
          completed: s.includes('[x]') || s.includes('[X]'),
          text: s.replace(/^\[[ xX]\]\s*/, '')
        })
      });
      
      const result = matchAndExtract('[x] completed task', pattern);
      expect(result.task.completed).toBe(true);
      expect(result.task.text).toBe('completed task');
    });

    test('should work with link parsers', () => {
      const pattern = re`${link.as('link')}`.withParsers({
        link: (s: string) => {
          const match = s.match(/\[([^\]]+)\]\(([^)]+)\)/);
          return match ? { text: match[1], url: match[2] } : null;
        }
      });
      
      const result = matchAndExtract('[text](https://example.com)', pattern);
      expect(result.link.text).toBe('text');
      expect(result.link.url).toBe('https://example.com');
    });
  });

  describe('Edge cases', () => {
    test('should handle empty content', () => {
      const result = matchAndExtract('', header);
      expect(result).toBeNull();
    });

    test('should handle malformed markdown', () => {
      const result1 = matchAndExtract('**bold', bold);
      expect(result1).toBeNull();

      const result2 = matchAndExtract('[text](url', link);
      expect(result2).toBeNull();
    });

    test('should handle special characters', () => {
      const result = matchAndExtract('**hello world!**', bold);
      expect(result.bold).toBe('**hello world!**');
    });

    test('should handle unicode characters', () => {
      const result = matchAndExtract('**café naïve**', bold);
      expect(result.bold).toBe('**café naïve**');
    });
  });

  describe('Performance', () => {
    test('should handle large markdown documents efficiently', () => {
      const largeContent = '# Header\n' + '- item\n'.repeat(1000);
      const pattern = re`${li}`.withFlags('g');
      const result = matchAndExtract(largeContent, pattern);
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1000);
    });

    test('should handle complex nested markdown', () => {
      const complexContent = `
        # Header
        - **bold** item with [link](https://example.com)
        - *italic* item with \`code\`
        - [x] completed task
        - [ ] pending task
      `;
      
      const pattern = re`${li}`.withFlags('g');
      const result = matchAndExtract(complexContent, pattern);
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(4);
    });
  });
});
