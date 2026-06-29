const { defineConfig } = require('vitest/config');

module.exports = defineConfig({
  test: {
    globals: true,
    testTimeout: 15000,
    setupFiles: ['./tests/setup.js'],
    include: ['tests/**/*.test.js'],
    // Use dynamic import for CommonJS compatibility
    deps: {
      inline: [/vitest/],
    },
  },
});
