/**
 * Simple test runner for the repart library
 * This provides a basic testing framework without external dependencies
 */

interface TestCase {
  name: string;
  fn: () => void;
}

interface TestSuite {
  name: string;
  tests: TestCase[];
}

class SimpleTestRunner {
  private suites: TestSuite[] = [];
  private currentSuite: TestSuite | null = null;
  private results: Array<{suite: string, test: string, passed: boolean, error?: Error}> = [];

  describe(name: string, fn: () => void) {
    const suite: TestSuite = { name, tests: [] };
    this.currentSuite = suite;
    this.suites.push(suite);
    
    try {
      fn();
    } catch (error) {
      console.error(`Error in test suite "${name}":`, error);
    }
    
    this.currentSuite = null;
  }

  test(name: string, fn: () => void) {
    if (!this.currentSuite) {
      throw new Error('test() called outside of describe()');
    }
    
    this.currentSuite.tests.push({ name, fn });
  }

  run() {
    console.log('Running tests...\n');
    
    let totalPassed = 0;
    let totalFailed = 0;

    for (const suite of this.suites) {
      console.log(`\n${suite.name}`);
      console.log('='.repeat(suite.name.length));
      
      for (const test of suite.tests) {
        try {
          test.fn();
          console.log(`  ✓ ${test.name}`);
          this.results.push({ suite: suite.name, test: test.name, passed: true });
          totalPassed++;
        } catch (error) {
          console.log(`  ✗ ${test.name}`);
          console.log(`    Error: ${(error as Error).message}`);
          this.results.push({ suite: suite.name, test: test.name, passed: false, error: error as Error });
          totalFailed++;
        }
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log(`Total: ${totalPassed} passed, ${totalFailed} failed`);
    
    return { passed: totalPassed, failed: totalFailed, results: this.results };
  }
}

// Create global test functions
const runner = new SimpleTestRunner();

// Simple expect function
const expect = function(actual: any) {
  return {
    toBe(expected: any) {
      if (actual !== expected) {
        throw new Error(`Expected ${expected}, but got ${actual}`);
      }
    },
    
    toEqual(expected: any) {
      if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(`Expected ${JSON.stringify(expected)}, but got ${JSON.stringify(actual)}`);
      }
    },
    
    toBeNull() {
      if (actual !== null) {
        throw new Error(`Expected null, but got ${actual}`);
      }
    },
    
    toBeDefined() {
      if (actual === undefined) {
        throw new Error(`Expected defined value, but got undefined`);
      }
    },
    
    toBeUndefined() {
      if (actual !== undefined) {
        throw new Error(`Expected undefined, but got ${actual}`);
      }
    },
    
    toBeInstanceOf(expected: any) {
      if (!(actual instanceof expected)) {
        throw new Error(`Expected instance of ${expected.name}, but got ${typeof actual}`);
      }
    },
    
    toContain(expected: any) {
      if (Array.isArray(actual)) {
        if (!actual.includes(expected)) {
          throw new Error(`Expected array to contain ${expected}, but got ${JSON.stringify(actual)}`);
        }
      } else if (typeof actual === 'string') {
        if (!actual.includes(expected)) {
          throw new Error(`Expected string to contain "${expected}", but got "${actual}"`);
        }
      } else {
        throw new Error(`Expected array or string, but got ${typeof actual}`);
      }
    },
    
    not: {
      toBe(expected: any) {
        if (actual === expected) {
          throw new Error(`Expected not to be ${expected}, but got ${actual}`);
        }
      },
      
      toContain(expected: any) {
        if (Array.isArray(actual)) {
          if (actual.includes(expected)) {
            throw new Error(`Expected array not to contain ${expected}, but got ${JSON.stringify(actual)}`);
          }
        } else if (typeof actual === 'string') {
          if (actual.includes(expected)) {
            throw new Error(`Expected string not to contain "${expected}", but got "${actual}"`);
          }
        } else {
          throw new Error(`Expected array or string, but got ${typeof actual}`);
        }
      },
      
      toBeNull() {
        if (actual === null) {
          throw new Error(`Expected not to be null, but got null`);
        }
      }
    }
  };
};

export { runner, expect };

// Make functions available globally
(globalThis as any).describe = runner.describe.bind(runner);
(globalThis as any).test = runner.test.bind(runner);
(globalThis as any).expect = expect;
