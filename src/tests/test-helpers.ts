/**
 * Test helper functions for RePart tests
 */

/**
 * Checks if two flag strings contain the same flags, ignoring order
 * @param actual - The actual flags string
 * @param expected - The expected flags string
 * @returns true if both strings contain the same flags
 */
export function flagsEqual(actual: string, expected: string): boolean {
  const actualFlags = actual.split('').sort().join('');
  const expectedFlags = expected.split('').sort().join('');
  return actualFlags === expectedFlags;
}

/**
 * Jest matcher for checking flags equality ignoring order
 * @param actual - The actual flags string
 * @param expected - The expected flags string
 */
export function toHaveFlags(actual: string, expected: string) {
  const pass = flagsEqual(actual, expected);
  
  if (pass) {
    return {
      message: () => `Expected flags "${actual}" not to equal "${expected}" (ignoring order)`,
      pass: true,
    };
  } else {
    return {
      message: () => `Expected flags "${actual}" to equal "${expected}" (ignoring order)`,
      pass: false,
    };
  }
}

/**
 * Jest matcher for checking flags contain specific flags
 * @param actual - The actual flags string
 * @param expected - Array of expected flags
 */
export function toContainFlags(actual: string, expected: string[]) {
  const actualFlags = actual.split('');
  const missingFlags = expected.filter(flag => !actualFlags.includes(flag));
  
  if (missingFlags.length === 0) {
    return {
      message: () => `Expected flags "${actual}" not to contain all of [${expected.join(', ')}]`,
      pass: true,
    };
  } else {
    return {
      message: () => `Expected flags "${actual}" to contain all of [${expected.join(', ')}], but missing [${missingFlags.join(', ')}]`,
      pass: false,
    };
  }
}

/**
 * Jest matcher for checking flags don't contain specific flags
 * @param actual - The actual flags string
 * @param unexpected - Array of flags that should not be present
 */
export function notToContainFlags(actual: string, unexpected: string[]) {
  const actualFlags = actual.split('');
  const foundFlags = unexpected.filter(flag => actualFlags.includes(flag));
  
  if (foundFlags.length === 0) {
    return {
      message: () => `Expected flags "${actual}" not to contain any of [${unexpected.join(', ')}]`,
      pass: true,
    };
  } else {
    return {
      message: () => `Expected flags "${actual}" not to contain any of [${unexpected.join(', ')}], but found [${foundFlags.join(', ')}]`,
      pass: false,
    };
  }
}

// Extend Jest matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toHaveFlags(expected: string): R;
      toContainFlags(expected: string[]): R;
      notToContainFlags(unexpected: string[]): R;
    }
  }
}

// Add custom matchers to expect
export function setupCustomMatchers() {
  expect.extend({
    toHaveFlags,
    toContainFlags,
    notToContainFlags,
  });
}
