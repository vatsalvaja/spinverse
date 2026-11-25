/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require("../_sdk/tailwind.preset.cjs")],
  content: ["./index.html", "./src/**/*.{ts,tsx}", "../_sdk/src/**/*.{ts,tsx}"],
};
