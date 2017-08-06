module.exports = {
  "root": true,
  "env": {
    "es6": true,
    "node": true
  },
  "extends": "airbnb-base",
  "parserOptions": {
    "sourceType": "module"
  },
  "rules": {
    "arrow-parens": ["warn", "always"],
    "arrow-body-style": ["warn", "as-needed"],
    "comma-dangle": "warn", // ["warn", { "functions": "never" }]
    "indent": "warn",
    "max-len": ["warn", 120],
    "no-continue": "off",
    "no-console": "off",
    "padded-blocks": "warn",
    "prefer-const": "warn",
    "prefer-template": "warn",
    "quotes": ["warn", "single", { "avoidEscape": true }],
  }
};
