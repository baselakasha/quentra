const { createDefaultPreset } = require("ts-jest");

const tsJestTransformCfg = createDefaultPreset().transform;

/** @type {import("jest").Config} **/
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'js'],
  testMatch: ['**/*.test.ts', '**/*.spec.ts'], // Match test files with .test.ts or .spec.ts
  setupFilesAfterEnv: ['<rootDir>/src/tests/env-setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@util/(.*)$': '<rootDir>/src/utils/$1',
  }
};