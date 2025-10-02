/**
 * Test runner script for repart library
 */

import { runner } from './simple-test-runner';

// Import all test files
import './demo.test';

// Run tests
const results = runner.run();

// Exit with appropriate code
if (results.failed > 0) {
  console.log('\nTests failed!');
} else {
  console.log('\nAll tests passed!');
}
