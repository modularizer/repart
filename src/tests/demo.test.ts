/**
 * Demo test file showing core repart functionality
 */

import { re, matchAndExtract } from '../repart';
import { word, num } from '../repart/generic';
import { EMAIL_PATTERN } from '../repart/common';


describe('RePart Demo Tests', () => {
  test('should build basic patterns with re template', () => {
    const pattern = re`hello${'world'}`;
    expect(pattern.source).toBe('helloworld');
    expect(pattern.flags).toContain('d');
  });

  test('should create named groups with .as()', () => {
    const pattern = /\d+/.as('number');
    expect(pattern.source).toBe('(?<number>\\d+)');
  });

  test('should match and extract data', () => {
    const pattern = re`name: ${word.as('name')}, age: ${num.as('age')}`;
    const result = matchAndExtract('name: John, age: 25', pattern);
    
    expect(result).not.toBeNull();
    expect(result.name).toBe('John');
    expect(result.age).toBe('25');
  });

  test('should work with email patterns', () => {
    const result = matchAndExtract('john@example.com', EMAIL_PATTERN);
    
    expect(result).not.toBeNull();
    expect(result.email).toBe('john@example.com');
    expect(result.emailHandle).toBe('john');
    expect(result.emailDomain).toBe('example.com');
    expect(result.emailTLD).toBe('com');
  });

  test('should handle custom parsers', () => {
    const pattern = re`age: ${num.as('age')}`.withParsers({
      age: parseInt
    });
    
    const result = matchAndExtract('age: 25', pattern);
    expect(result.age).toBe(25);
    expect(typeof result.age).toBe('number');
  });

  test('should handle multiple matches', () => {
    const pattern = re`${word.as('word')}`.withFlags('g');
    const result = matchAndExtract('hello world test', pattern);
    
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(3);
    expect(result[0].word).toBe('hello');
    expect(result[1].word).toBe('world');
    expect(result[2].word).toBe('test');
  });

  test('should handle complex parsing', () => {
    const pattern = re`
      name: ${word.as('name')}, 
      email: ${EMAIL_PATTERN}, 
      age: ${num.as('age')}
    `.withParsers({
      name: (s: string) => s.toUpperCase(),
      age: parseInt
    });
    
    const result = matchAndExtract('name: john, email: john@example.com, age: 25', pattern);
    
    expect(result.name).toBe('JOHN');
    expect(result.email).toBe('john@example.com');
    expect(result.age).toBe(25);
    expect(result.emailHandle).toBe('john');
  });
});
