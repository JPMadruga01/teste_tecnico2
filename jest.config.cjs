/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  moduleNameMapper: {
    '^@\/src\/(.*)$': '<rootDir>/src/$1',
    '^@\/(.*)$': '<rootDir>/$1'
  }
};
