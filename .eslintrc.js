module.exports = {
  extends: ["@dcl/eslint-config/dapps"],
  parserOptions: {
    project: ["tsconfig.json"],
  },
  ignorePatterns: ["node_modules/", "cjs/", "esm/", "*.js"],
}
