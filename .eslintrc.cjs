module.exports = {
  root: true,
  env: { browser: true, node: true, es2022: true, jest: true },
  // Ignore problematic files while we fix them incrementally
  ignorePatterns: [
    'node_modules/',
    'dist/',
    'public/',
    'supabase/.temp/',
    'vite.config.*',
    '*.config.*',
    '/*.eslintrc.*',
    'backend/**',
    'tests/e2e/**',

    // Temporarily ignore files with parsing/JSX issues so lint runs are useful.
    // We'll remove these ignores after fixing the files.
    'src/router.jsx',
    'src/page/AdminOrders/**',
    'src/page/Cart/**',
    'src/page/OrderDetail/**'
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    tsconfigRootDir: __dirname,
    ecmaVersion: 2021,
    sourceType: 'module',
    ecmaFeatures: { jsx: true }
  },
  plugins: ['@typescript-eslint'],
  settings: { react: { version: 'detect' } },
  extends: ['plugin:@typescript-eslint/recommended'],
  rules: {},
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      parserOptions: { project: './tsconfig.json' }
    },
    {
      files: ['**/*.js', '**/*.jsx', '**/*.cjs'],
      parser: 'espree',
      parserOptions: { ecmaVersion: 2020, sourceType: 'module', ecmaFeatures: { jsx: true } },
      rules: {
        '@typescript-eslint/no-require-imports': 'off',
        '@typescript-eslint.no-var-requires': 'off'
      }
    },
    {
      files: ['supabase/**', 'scripts/**', 'tools/**'],
      rules: {
        '@typescript-eslint.no-require-imports': 'off',
        '@typescript-eslint.no-var-requires': 'off'
      }
    }
  ]
};
