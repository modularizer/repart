/**
 * Simple test utilities for running tests
 */

interface TestResult {
  name: string;
  passed: boolean;
  error?: Error;
  duration: number;
}

interface TestSuite {
  name: string;
  tests: TestResult[];
  passed: number;
  failed: number;
  duration: number;
}

class TestRunner {
  private suites: TestSuite[] = [];
  private currentSuite: TestSuite | null = null;

  describe(name: string, fn: () => void) {
    const suite: TestSuite = {
      name,
      tests: [],
      passed: 0,
      failed: 0,
      duration: 0
    };
    
    this.currentSuite = suite;
    this.suites.push(suite);
    
    const startTime = Date.now();
    try {
      fn();
    } catch (error) {
      console.error(`Error in test suite "${name}":`, error);
    }
    suite.duration = Date.now() - startTime;
    this.currentSuite = null;
  }

  test(name: string, fn: () => void) {
    if (!this.currentSuite) {
      throw new Error('test() called outside of describe()');
    }

    const startTime = Date.now();
    const result: TestResult = {
      name,
      passed: false,
      duration: 0
    };

    try {
      fn();
      result.passed = true;
      this.currentSuite.passed++;
    } catch (error) {
      result.error = error as Error;
      this.currentSuite.failed++;
    }

    result.duration = Date.now() - startTime;
    this.currentSuite.tests.push(result);
  }

  run() {
    console.log('Running tests...\n');
    
    let totalPassed = 0;
    let totalFailed = 0;
    let totalDuration = 0;

    for (const suite of this.suites) {
      console.log(`\n${suite.name}`);
      console.log('='.repeat(suite.name.length));
      
      for (const test of suite.tests) {
        const status = test.passed ? '✓' : '✗';
        const duration = `(${test.duration}ms)`;
        console.log(`  ${status} ${test.name} ${duration}`);
        
        if (!test.passed && test.error) {
          console.log(`    Error: ${test.error.message}`);
        }
      }
      
      console.log(`\n  ${suite.passed} passed, ${suite.failed} failed (${suite.duration}ms)`);
      
      totalPassed += suite.passed;
      totalFailed += suite.failed;
      totalDuration += suite.duration;
    }

    console.log('\n' + '='.repeat(50));
    console.log(`Total: ${totalPassed} passed, ${totalFailed} failed (${totalDuration}ms)`);
    
    if (totalFailed > 0) {
      process.exit(1);
    }
  }
}

// Global test functions
let testRunner: TestRunner;

export function runTests() {
  testRunner = new TestRunner();
  
  // Make describe and test available globally
  (global as any).describe = testRunner.describe.bind(testRunner);
  (global as any).test = testRunner.test.bind(testRunner);
  (global as any).expect = expect;
  
  // Run tests after a short delay to allow imports to complete
  setTimeout(() => {
    testRunner.run();
  }, 100);
}

// Simple expect function
export function expect(actual: any) {
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
}
