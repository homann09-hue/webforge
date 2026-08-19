import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";
import globals from "globals";

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
});

export default [
  js.configs.recommended,
  ...compat.extends("next/core-web-vitals"),
  {
    files: ["scripts/**/*.mjs"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      "no-unused-vars": "warn",
      "no-useless-escape": "off",
    },
  },
  {
    ignores: [".next/**", "node_modules/**"],
  },
];
