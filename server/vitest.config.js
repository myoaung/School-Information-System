const { defineConfig } = require('vitest/config');

module.exports = defineConfig({
  test: {
    globals: true,
    testTimeout: 15000,
    setupFiles: ['./tests/setup.js'],
    include: ['tests/**/*.test.js'],
    // Run tests sequentially — SQLite can't handle concurrent writes from
    // multiple test files racing on the same test.db
    fileParallelism: false,
    // Use dynamic import for CommonJS compatibility
    deps: {
      inline: [/vitest/],
    },
  },
});
