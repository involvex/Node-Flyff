module.exports = {
  env: {
    es2021: true,
    node: true
  },
  extends: 'standard',
  overrides: [
    {
      env: {
        node: true
      },
      files: [
        '.eslintrc.{js,cjs}'
      ],
      parserOptions: {
        sourceType: 'script'
      }
    }
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  rules: {
  }
};

// Add TypeScript support for ESLint
// Uses @typescript-eslint/parser for .ts/.mts files and enables recommended rules
module.exports.overrides = module.exports.overrides || [];
module.exports.overrides.push({
  files: ['**/*.ts', '**/*.mts', '**/*.tsx'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    // Avoid strict type-checking rules that require type-aware linting in this
    // migration phase; we relax them to make incremental fixes manageable.
    // Remove `project` to skip type-aware rules.
    tsconfigRootDir: __dirname,
    ecmaVersion: 2022,
    sourceType: 'module'
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'plugin:@typescript-eslint/recommended'
  ],
  rules: {
    // Match existing code style to minimise churn during migration
    quotes: ['error', 'double'],
    semi: ['error', 'always'],

    // Relax strict type-safety lint rules for now; we'll address these
    // incrementally in a later pass focused on types.
    '@typescript-eslint/no-unsafe-assignment': 'off',
    '@typescript-eslint/no-unsafe-member-access': 'off',
    '@typescript-eslint/no-unsafe-argument': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-floating-promises': 'off',

    // Allow unused variables that start with underscore
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],

    // Turn off a few strict stylistic rules that produce a lot of churn
    'comma-dangle': ['error', 'never'],
    'space-before-function-paren': ['error', 'never']
  }
});

// Relax a few additional rules that produce many errors across the legacy
// codebase during migration. These are temporary and should be re-enabled
// and fixed in a follow-up type-safety cleanup pass.
module.exports.rules = Object.assign(module.exports.rules || {}, {
  'no-use-before-define': 'off',
  'no-useless-constructor': 'off',
  'no-empty': 'off',
  eqeqeq: 'off',
  '@typescript-eslint/no-duplicate-enum-values': 'off',
  'n/handle-callback-err': 'off'
});

// Enforce semicolons and function-paren spacing across JS/TS files to match
// the TypeScript override and reduce mixed-rule failures during migration.
module.exports.rules.semi = ['error', 'always'];
module.exports.rules['space-before-function-paren'] = ['error', 'never'];
