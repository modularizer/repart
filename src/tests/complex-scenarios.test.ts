import { re, matchAndExtract, match } from '../repart';
import { matchRaw } from '../repart/match';
import { word, num, space, anyOf, wordList, padded, separator } from '../repart/generic';
import { EMAIL_PATTERN, PHONE_NUMBER_PATTERN, STATE_PATTERN } from '../repart/common';
import { bold, header, li, checkboxLine } from '../repart/md';

describe('Complex Scenarios', () => {
  describe('Cascading parsing', () => {
    test('should handle nested user data parsing', () => {
      const userPattern = re`
        name: ${word.as('name')}, 
        age: ${num.as('age')}, 
        email: ${EMAIL_PATTERN}
      `.withParsers({
        age: parseInt,
        name: (s: string) => s.toUpperCase()
      });

      const pattern = re`users: ${word.as('users')}`.withParsers({
        users: userPattern.withFlags('g')
      });

      const result = matchAndExtract(`
        users: name: john, age: 25, email: john@example.com
        name: jane, age: 30, email: jane@example.com
        name: bob, age: 35, email: bob@example.com
      `, pattern);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(3);
      expect(result[0].name).toBe('JOHN');
      expect(result[0].age).toBe(25);
      expect(result[0].email).toBe('john@example.com');
      expect(result[1].name).toBe('JANE');
      expect(result[1].age).toBe(30);
      expect(result[2].name).toBe('BOB');
      expect(result[2].age).toBe(35);
    });

    test('should handle deeply nested configuration parsing', () => {
      const configPattern = re`
        ${word.as('key')}: ${word.as('value')}
      `.withParsers({
        key: (s: string) => s.toLowerCase(),
        value: (s: string) => s.toLowerCase()
      });

      const sectionPattern = re`
        \\[${word.as('section')}\\]
        ${word.as('content')}
      `.withParsers({
        content: configPattern.withFlags('g')
      });

      const pattern = re`${word.as('config')}`.withParsers({
        config: sectionPattern.withFlags('g')
      });

      const result = matchAndExtract(`
        [database]
        host: localhost
        port: 5432
        name: myapp
        
        [server]
        host: 0.0.0.0
        port: 3000
      `, pattern);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
      expect(result[0].section).toBe('database');
      expect(result[1].section).toBe('server');
    });

    test('should handle markdown document parsing', () => {
      const markdownPattern = re`
        ${header.as('header')}
        ${word.as('content')}
      `.withParsers({
        header: (s: string) => s.replace(/^#+\s*/, ''),
        content: li.withFlags('g')
      });

      const documentPattern = re`${word.as('document')}`.withParsers({
        document: markdownPattern.withFlags('g')
      });

      const result = matchAndExtract(`
        # Introduction
        - This is a test
        - Another item
        
        ## Features
        - Feature 1
        - Feature 2
      `, documentPattern);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
      expect(result[0].header).toBe('Introduction');
      expect(result[1].header).toBe('Features');
    });
  });

  describe('Unnesting scenarios', () => {
    test('should flatten nested user data', () => {
      const userPattern = re`
        name: ${word.as('name')}, 
        age: ${num.as('age')}
      `.withParsers({
        age: parseInt
      });

      const pattern = re`user: ${word.as('userData')}`.withParsers({
        _userData: userPattern // underscore for unnesting
      });

      const result = matchAndExtract('user: name: john, age: 25', pattern);

      expect(result.name).toBe('john');
      expect(result.age).toBe(25);
      expect(result.userData).toBeUndefined();
    });

    test('should handle multiple unnesting levels', () => {
      const innerPattern = re`value: ${num.as('value')}`.withParsers({
        value: parseInt
      });

      const middlePattern = re`data: ${word.as('data')}`.withParsers({
        _data: innerPattern
      });

      const outerPattern = re`config: ${word.as('config')}`.withParsers({
        _config: middlePattern
      });

      const result = matchAndExtract('config: data: value: 123', outerPattern);

      expect(result.value).toBe(123);
      expect(result.data).toBeUndefined();
      expect(result.config).toBeUndefined();
    });

    test('should handle mixed nesting and unnesting', () => {
      const userPattern = re`
        name: ${word.as('name')}, 
        age: ${num.as('age')}
      `.withParsers({
        age: parseInt
      });

      const pattern = re`
        user: ${word.as('userData')}, 
        meta: ${word.as('meta')}
      `.withParsers({
        _userData: userPattern, // unnest user data
        meta: (s: string) => s.toUpperCase() // keep meta nested
      });

      const result = matchAndExtract('user: name: john, age: 25, meta: info', pattern);

      expect(result.name).toBe('john');
      expect(result.age).toBe(25);
      expect(result.meta).toBe('INFO');
      expect(result.userData).toBeUndefined();
    });
  });

  describe('Multiple matches and global patterns', () => {
    test('should handle multiple email extraction', () => {
      const pattern = re`${EMAIL_PATTERN}`.withFlags('g');
      const result = matchAndExtract(`
        Contact us at john@example.com or jane@company.org
        For support, email support@help.com
        Sales inquiries: sales@business.net
      `, pattern);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(4);
      expect(result[0].email).toBe('john@example.com');
      expect(result[1].email).toBe('jane@company.org');
      expect(result[2].email).toBe('support@help.com');
      expect(result[3].email).toBe('sales@business.net');
    });

    test('should handle multiple phone number extraction', () => {
      const pattern = re`${PHONE_NUMBER_PATTERN}`.withFlags('g');
      const result = matchAndExtract(`
        Call us at (555) 123-4567 or +1-555-987-6543
        International: +44-20-7946-0958
        Emergency: 911
      `, pattern);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(3);
      expect(result[0].phone).toBe('(555) 123-4567');
      expect(result[1].phone).toBe('+1-555-987-6543');
      expect(result[2].phone).toBe('+44-20-7946-0958');
    });

    test('should handle mixed content extraction', () => {
      const pattern = re`
        ${word.as('type')}: ${anyOf('email', 'phone', 'address').as('contact')}
      `.withFlags('g').withParsers({
        type: (s: string) => s.toUpperCase()
      });

      const result = matchAndExtract(`
        email: john@example.com
        phone: (555) 123-4567
        address: 123 Main St
        email: jane@company.org
      `, pattern);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(4);
      expect(result[0].type).toBe('EMAIL');
      expect(result[0].contact).toBe('john@example.com');
      expect(result[1].type).toBe('PHONE');
      expect(result[1].contact).toBe('(555) 123-4567');
    });
  });

  describe('Complex custom parsers', () => {
    test('should handle JSON parsing', () => {
      const pattern = re`data: ${word.as('jsonData')}`.withParsers({
        jsonData: (s: string) => {
          try {
            return JSON.parse(s);
          } catch {
            return s;
          }
        }
      });

      const result = matchAndExtract('data: {"name": "john", "age": 25}', pattern);

      expect(result.jsonData).toEqual({ name: 'john', age: 25 });
    });

    test('should handle date parsing', () => {
      const pattern = re`date: ${word.as('dateStr')}`.withParsers({
        dateStr: (s: string) => new Date(s)
      });

      const result = matchAndExtract('date: 2023-12-25', pattern);

      expect(result.dateStr).toBeInstanceOf(Date);
      expect(result.dateStr.getFullYear()).toBe(2023);
      expect(result.dateStr.getMonth()).toBe(11); // December is 11
      expect(result.dateStr.getDate()).toBe(25);
    });

    test('should handle array parsing', () => {
      const pattern = re`items: ${word.as('itemsStr')}`.withParsers({
        itemsStr: (s: string) => s.split(',').map(item => item.trim())
      });

      const result = matchAndExtract('items: apple, banana, cherry', pattern);

      expect(result.itemsStr).toEqual(['apple', 'banana', 'cherry']);
    });

    test('should handle conditional parsing', () => {
      const pattern = re`
        type: ${word.as('type')}, 
        value: ${word.as('value')}
      `.withParsers({
        type: (s: string) => s.toLowerCase(),
        value: (s: string, opts: any) => {
          const type = opts.type || 'string';
          switch (type) {
            case 'number': return parseInt(s);
            case 'boolean': return s === 'true';
            case 'array': return s.split(',').map(item => item.trim());
            default: return s;
          }
        }
      });

      const result1 = matchAndExtract('type: number, value: 123', pattern);
      expect(result1.value).toBe(123);

      const result2 = matchAndExtract('type: boolean, value: true', pattern);
      expect(result2.value).toBe(true);

      const result3 = matchAndExtract('type: array, value: a,b,c', pattern);
      expect(result3.value).toEqual(['a', 'b', 'c']);
    });
  });

  describe('Groups post-processing', () => {
    test('should transform all groups', () => {
      const pattern = re`
        name: ${word.as('name')}, 
        age: ${num.as('age')}, 
        email: ${EMAIL_PATTERN}
      `.withParsers({
        name: (s: string) => s.toUpperCase(),
        age: parseInt,
        groups: (data: any) => ({
          person: {
            name: data.name,
            age: data.age,
            email: data.email,
            isAdult: data.age >= 18
          }
        })
      });

      const result = matchAndExtract('name: john, age: 25, email: john@example.com', pattern);

      expect(result.person.name).toBe('JOHN');
      expect(result.person.age).toBe(25);
      expect(result.person.email).toBe('john@example.com');
      expect(result.person.isAdult).toBe(true);
      expect(result.name).toBeUndefined();
      expect(result.age).toBeUndefined();
      expect(result.email).toBeUndefined();
    });

    test('should handle complex data transformation', () => {
      const pattern = re`
        id: ${num.as('id')}, 
        name: ${word.as('name')}, 
        score: ${num.as('score')}
      `.withParsers({
        id: parseInt,
        score: parseFloat,
        groups: (data: any) => ({
          player: {
            id: data.id,
            name: data.name,
            score: data.score,
            grade: data.score >= 90 ? 'A' : data.score >= 80 ? 'B' : data.score >= 70 ? 'C' : 'F'
          }
        })
      });

      const result = matchAndExtract('id: 123, name: john, score: 95.5', pattern);

      expect(result.player.id).toBe(123);
      expect(result.player.name).toBe('john');
      expect(result.player.score).toBe(95.5);
      expect(result.player.grade).toBe('A');
    });
  });

  describe('Real-world scenarios', () => {
    test('should parse log entries', () => {
      const logPattern = re`
        \\[${word.as('timestamp')}\\] 
        ${word.as('level')}: 
        ${word.as('message')}
      `.withParsers({
        level: (s: string) => s.toUpperCase(),
        timestamp: (s: string) => new Date(s)
      });

      const result = matchAndExtract('[2023-12-25T10:30:00Z] info: User logged in', logPattern);

      expect(result.timestamp).toBeInstanceOf(Date);
      expect(result.level).toBe('INFO');
      expect(result.message).toBe('User logged in');
    });

    test('should parse configuration files', () => {
      const configPattern = re`
        ${word.as('key')}\\s*=\\s*${word.as('value')}
      `.withParsers({
        key: (s: string) => s.toLowerCase(),
        value: (s: string) => {
          if (s === 'true') return true;
          if (s === 'false') return false;
          if (/^\\d+$/.test(s)) return parseInt(s);
          if (/^\\d+\\.\\d+$/.test(s)) return parseFloat(s);
          return s;
        }
      });

      const result = matchAndExtract(`
        HOST = localhost
        PORT = 3000
        DEBUG = true
        TIMEOUT = 30.5
      `, configPattern.withFlags('g'));

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(4);
      expect(result[0].key).toBe('host');
      expect(result[0].value).toBe('localhost');
      expect(result[1].key).toBe('port');
      expect(result[1].value).toBe(3000);
      expect(result[2].key).toBe('debug');
      expect(result[2].value).toBe(true);
      expect(result[3].key).toBe('timeout');
      expect(result[3].value).toBe(30.5);
    });

    test('should parse CSV-like data', () => {
      const csvPattern = re`
        ${word.as('name')},${word.as('age')},${word.as('email')}
      `.withParsers({
        age: parseInt,
        groups: (data: any) => ({
          name: data.name,
          age: data.age,
          email: data.email,
          isAdult: data.age >= 18
        })
      });

      const result = matchAndExtract(`
        john,25,john@example.com
        jane,17,jane@example.com
        bob,30,bob@example.com
      `, csvPattern.withFlags('g'));

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(3);
      expect(result[0].name).toBe('john');
      expect(result[0].age).toBe(25);
      expect(result[0].isAdult).toBe(true);
      expect(result[1].name).toBe('jane');
      expect(result[1].age).toBe(17);
      expect(result[1].isAdult).toBe(false);
    });

    test('should parse markdown task lists', () => {
      const taskPattern = re`
        ${checkboxLine.as('task')}
      `.withParsers({
        task: (s: string) => ({
          completed: s.includes('[x]') || s.includes('[X]'),
          text: s.replace(/^\\[\\sxX\\]\\s*/, '')
        })
      });

      const result = matchAndExtract(`
        - [x] Completed task
        - [ ] Pending task
        - [X] Another completed task
        - [ ] Another pending task
      `, taskPattern.withFlags('g'));

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(4);
      expect(result[0].task.completed).toBe(true);
      expect(result[0].task.text).toBe('Completed task');
      expect(result[1].task.completed).toBe(false);
      expect(result[1].task.text).toBe('Pending task');
    });
  });

  describe('Performance and edge cases', () => {
    test('should handle large datasets efficiently', () => {
      const largeData = Array.from({ length: 1000 }, (_, i) => 
        `user${i},${20 + (i % 50)},user${i}@example.com`
      ).join('\n');

      const csvPattern = re`
        ${word.as('name')},${num.as('age')},${EMAIL_PATTERN}
      `.withParsers({
        age: parseInt
      });

      const result = matchAndExtract(largeData, csvPattern.withFlags('g'));

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1000);
      expect(result[0].name).toBe('user0');
      expect(result[0].age).toBe(20);
      expect(result[999].name).toBe('user999');
    });

    test('should handle malformed input gracefully', () => {
      const pattern = re`
        name: ${word.as('name')}, 
        age: ${num.as('age')}
      `.withParsers({
        age: parseInt
      });

      const result = matchAndExtract('name: john, age: not-a-number', pattern);

      expect(result.name).toBe('john');
      expect(result.age).toBe('not-a-number'); // Should fall back to string
    });

    test('should handle empty matches', () => {
      const pattern = re`${word.as('word')}`.withFlags('g');
      const result = matchAndExtract('', pattern);

      expect(result).toBeNull();
    });

    test('should handle very long strings', () => {
      const longString = 'a'.repeat(10000);
      const pattern = re`${word.as('word')}`;
      const result = matchAndExtract(longString, pattern);

      expect(result.word).toBe(longString);
    });
  });
});
