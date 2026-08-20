import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";
import globals from "globals";

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
});

const config = [
  js.configs.recommended,
  ...compat.extends("next/core-web-vitals"),
  {
    files: ["**/*.{js,mjs,ts,tsx}"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        React: "readonly",
        RequestInfo: "readonly",
        RequestInit: "readonly",
      },
    },
    rules: {
      "@next/next/no-html-link-for-pages": "off",
      "react-hooks/exhaustive-deps": "warn",
      "no-unused-vars": "warn",
      "no-useless-escape": "off",
    },
  },
  {
    // The base no-unused-vars rule does not understand TypeScript type
    // positions: it flags the parameter names inside a function *type*
    // annotation, e.g. `(message: string) => void`. TypeScript itself already
    // reports genuinely unused values, so turn the base rule off for TS.
    files: ["**/*.ts", "**/*.tsx"],
    rules: { "no-unused-vars": "off" },
  },
  {
    // supabase/functions is Deno source vendored verbatim from the live
    // project; linting it with the Next config only produces noise.
    ignores: [".next/**", "node_modules/**", "supabase/functions/**"],
  },
];

export default config;
