/**
 * Test runner for the repart library
 * This file provides a simple test runner that can execute all tests
 */

import { runTests } from './test-utils';

// Import all test files
import './core.test';
import './builders.test';
import './common.test';
import './generic-patterns.test';
import './generic-builders.test';
import './generic-wrappers.test';
import './generic-templates.test';
import './markdown.test';
import './utilities.test';
import './complex-scenarios.test';

// Run all tests
runTests();
