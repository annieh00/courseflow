module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/__tests__/setupTests.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/android/', '/ios/'],
};