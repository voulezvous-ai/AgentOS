module.exports = {
  testEnvironment: 'jsdom',
  moduleFileExtensions: ['js', 'jsx'],
  transform: {
    '^.+\\.jsx?$': 'babel-jest'
  },
  setupFilesAfterEnv: ['@testing-library/jest-dom/extend-expect']
};