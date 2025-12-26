// eslint.config.js (ESLint v9+)
const globals = require('globals');

module.exports = [
  // Ignore folders/files
  {
    ignores: [
      'node_modules/**',
      'uploads/**',
      'logs/**',
      'dist/**',
      'build/**',
      'coverage/**',
      'package-lock.json',
    ],
  },

  // Lint JS files
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
      },
    },
    rules: {
      // בסיס טוב בלי לחפור
      'no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      'no-console': 'off',
      'prefer-const': 'warn',
      'no-undef': 'error',
      'no-unreachable': 'error',
    },
  },
];
