module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src/tests'],
  testMatch: ['**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/tests/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  moduleNameMapper: {
    '^../repart$': '<rootDir>/src/repart/index.ts',
    '^../repart/(.*)$': '<rootDir>/src/repart/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/src/tests/jest-setup.ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      skipLibCheck: true,
      compilerOptions: {
        strict: false,
        noImplicitAny: false,
        strictNullChecks: false,
        strictFunctionTypes: false,
        strictBindCallApply: false,
        strictPropertyInitialization: false,
        noImplicitReturns: false,
        noImplicitThis: false,
        noUnusedLocals: false,
        noUnusedParameters: false,
        exactOptionalPropertyTypes: false,
        noImplicitOverride: false,
        noPropertyAccessFromIndexSignature: false,
        noUncheckedIndexedAccess: false,
        skipLibCheck: true,
        allowJs: true,
        checkJs: false
      }
    }]
  }
};