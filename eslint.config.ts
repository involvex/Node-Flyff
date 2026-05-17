import js from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";

export default tseslint.config(
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "web-client/node_modules/**",
      "coverage/**",
      "tmp/**",
      "**/*.js",
      "**/*.mjs"
    ]
  },

  js.configs.recommended,

  ...tseslint.configs.recommended,

  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.es2021,
        ...globals.browser
      },
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: "module"
      }
    },
    rules: {
      quotes: ["error", "double"],
      semi: ["error", "always"],
      "comma-dangle": ["error", "never"],
      "no-use-before-define": "off",
      "no-useless-constructor": "off",
      "no-empty": "off",
      eqeqeq: "off",
      "no-useless-assignment": "off",
      "no-unassigned-vars": "off",
      "preserve-caught-error": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_"
        }
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-floating-promises": "off",
      "@typescript-eslint/no-duplicate-enum-values": "off",
      "@typescript-eslint/no-this-alias": "off"
    }
  }
);
