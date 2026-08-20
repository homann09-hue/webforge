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
    // supabase/functions is Deno source vendored verbatim from the live
    // project; linting it with the Next config only produces noise.
    ignores: [".next/**", "node_modules/**", "supabase/functions/**"],
  },
];

export default config;
