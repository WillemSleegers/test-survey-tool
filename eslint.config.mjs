import coreWebVitals from "eslint-config-next/core-web-vitals"
import typescript from "eslint-config-next/typescript"

const eslintConfig = [
  { ignores: [".next/**", "out/**", "build/**", "next-env.d.ts"] },
  ...coreWebVitals,
  ...typescript,
  {
    // eslint-plugin-react's version autodetection calls APIs removed in ESLint 10
    settings: { react: { version: "19.2" } },
    rules: {
      // Markdown images come from arbitrary survey text, so next/image can't optimize them
      "@next/next/no-img-element": "off",
    },
  },
]

export default eslintConfig
