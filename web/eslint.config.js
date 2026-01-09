import vue from "eslint-plugin-vue";
import vueParser from "vue-eslint-parser";
import babelParser from "@babel/eslint-parser";

/**
 * Globals available in Android WebView / browser runtime
 * Explicit on purpose to keep no-undef useful.
 */
const browserGlobals = {
  // Web / DOM
  window: "readonly",
  document: "readonly",
  navigator: "readonly",
  console: "readonly",

  // Timers & animation
  setTimeout: "readonly",
  setInterval: "readonly",
  clearInterval: "readonly",
  requestAnimationFrame: "readonly",
  cancelAnimationFrame: "readonly",

  // APIs
  Event: "readonly",
  CustomEvent: "readonly",
  ResizeObserver: "readonly",
  performance: "readonly",
  matchMedia: "readonly",
  getComputedStyle: "readonly",

  // Android WebView bridges
  Android: "readonly",
  AndroidBridge: "readonly",

  // File paths
  process: "readonly",
  __dirname: "readonly",
  __filename: "readonly"
};

export default [
  // Ignore generated stuff
  {
    ignores: ["dist/**", "node_modules/**"]
  },

  // Vue SFCs
  {
    files: ["**/*.vue"],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: babelParser,
        requireConfigFile: false,
        ecmaVersion: 2023,
        sourceType: "module"
      },
      globals: browserGlobals
    },
    plugins: { vue },
    rules: {
      // Real bugs
      "no-undef": "error",
      "no-unreachable": "error",

      // Signal, not noise
      "no-unused-vars": "warn",
      "vue/no-unused-components": "warn",
      "vue/no-unused-vars": "warn",

      // No formatting opinions
      "semi": "off",
      "quotes": "off"
    }
  },

  // Plain JS files
  {
    files: ["**/*.js"],
    languageOptions: {
      parser: babelParser,
      parserOptions: {
        requireConfigFile: false,
        ecmaVersion: 2023,
        sourceType: "module"
      },
      globals: browserGlobals
    },
    rules: {
      "no-undef": "error",
      "no-unreachable": "error",
      "no-unused-vars": "warn"
    }
  }
];
