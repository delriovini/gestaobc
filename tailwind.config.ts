import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "rgb(255 255 255 / 0.1)",
        muted: "rgb(100 116 139)",
      },
    },
  },
  plugins: [],
} satisfies Config;
