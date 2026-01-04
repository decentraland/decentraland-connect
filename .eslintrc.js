module.exports = {
  extends: ['@dcl/eslint-config/dapps'],
  parserOptions: {
    project: ['tsconfig.json'],
    tsconfigRootDir: __dirname
  },
  ignorePatterns: ['node_modules/', 'cjs/', 'esm/', '*.js'],
  rules: {
    'import/export': 'off',
    'import/group-exports': 'off',
    'import/exports-last': 'off'
  },
  overrides: [
    {
      files: ['test/**/*.ts'],
      rules: {
        '@typescript-eslint/unbound-method': 'off'
      }
    }
  ]
}
