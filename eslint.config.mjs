import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const STRUCTURAL_RULES = [
  {
    selector:
      "Literal[value=/-\\[(?:#[0-9a-fA-F]{3,8}|rgba?\\(|hsla?\\()/]",
    message:
      "DS 위반: Tailwind arbitrary 색 값 금지. 토큰 사용 (bg-primary-50 등). 새 색은 globals.css @theme 블록에 토큰으로 추가.",
  },
  {
    selector:
      "Literal[value=/\\btext-\\[[0-9.]+(?:px|rem|em)\\]/]",
    message:
      "DS 위반: Tailwind arbitrary font-size 금지. 타이포 스케일 토큰 사용 (text-display, text-heading-1, text-body 등).",
  },
  {
    selector:
      "JSXAttribute[name.name='style'] ObjectExpression > Property[key.name=/^(color|backgroundColor|borderColor|outlineColor|fill|stroke)$/] > Literal[value=/^#/]",
    message:
      "DS 위반: 인라인 style에 hex 색 값 직접 지정 금지. var(--color-...) 참조 또는 className 사용.",
  },
  {
    selector:
      "JSXAttribute[name.name='style'] ObjectExpression > Property[key.name=/^(fontSize|fontFamily|fontWeight|letterSpacing|lineHeight)$/] > Literal",
    message:
      "DS 위반: 인라인 style로 폰트 관련 속성 금지. 타이포 토큰 className 사용.",
  },
];

const HEX_LITERAL_RULE = {
  selector:
    "Literal[value=/^#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/]",
  message:
    "DS 위반: hex 컬러 리터럴 금지. Design System 토큰 사용. 정당한 사용은 해당 파일을 exempt 경로로 두거나 eslint-disable-next-line 주석.",
};

const EXEMPT_HEX_PATHS = [
  "src/components/ui/acorn-icon.tsx",
  "src/components/**/icons/**",
  "src/components/**/illustrations/**",
  "src/components/**/*-chart.tsx",
  "src/components/**/*.chart.tsx",
];

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),

  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-syntax": [
        "error",
        ...STRUCTURAL_RULES,
        HEX_LITERAL_RULE,
      ],
    },
  },

  {
    files: EXEMPT_HEX_PATHS,
    rules: {
      "no-restricted-syntax": ["error", ...STRUCTURAL_RULES],
    },
  },

  {
    files: ["src/__tests__/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-syntax": "off",
    },
  },
]);

export default eslintConfig;
