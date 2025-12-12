/** @type {import('tailwindcss').Config} */
module.exports = {
  // 👇 ADD "./src/**/*.{js,jsx,ts,tsx}" TO THIS LIST
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: "#0066CC", dark: "#4D94FF" },
        action: { DEFAULT: "#10B981", dark: "#34D399" },
        alert: { DEFAULT: "#DC2626", dark: "#F87171" },
        surface: { DEFAULT: "#FFFFFF", dark: "#1F2937" },
        background: { DEFAULT: "#F3F4F6", dark: "#111827" },
      },
      fontFamily: {
        sans: ["PlusJakartaSans_400Regular"],
        medium: ["PlusJakartaSans_500Medium"],
        bold: ["PlusJakartaSans_700Bold"],
      },
    },
  },
  plugins: [],
};
