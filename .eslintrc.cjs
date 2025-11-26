module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    es2021: true
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true
    }
  },
  plugins: ['@typescript-eslint', 'react', 'unused-imports'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'prettier'
  ],
  settings: {
    react: {
      version: 'detect'
    }
  },
  rules: {
    // Fail on unused imports (removal enforced)
    'unused-imports/no-unused-imports': 'error',

    // Disable core/TS unused-vars handling (we rely on unused-imports)
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': 'off',

    // Allow explicit any for incremental migration
    '@typescript-eslint/no-explicit-any': 'off',

    // Projects using TypeScript or modern patterns may not use prop-types
    'react/prop-types': 'off'
  },
  overrides: [
    {
      files: ['*.js', '*.jsx'],
      rules: {
        'no-unused-vars': 'off',
        '@typescript-eslint/no-unused-vars': 'off'
      }
    },
    {
      files: ['*.ts', '*.tsx'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off'
      }
    }
  ]
};

