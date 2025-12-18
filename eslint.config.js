import js from "@eslint/js";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";
import globals from "globals";

export default tseslint.config(
  {
    ignores: ["dist/**", "node_modules/**", "data/**"],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,
  {
    languageOptions: {
      globals: {
        ...globals.es2022,
        ...globals.node,
        ...globals.browser,
      },
    },
    rules: {
      // Keep behavior-oriented rules; let Prettier handle formatting.
      "no-console": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
    },
  },
  {
    files: ["test/**/*.ts"],
    rules: {
      // Tests commonly use inline helpers/loops/etc.
      "@typescript-eslint/no-explicit-any": "off",
    },
  }
);
