export function AcornIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* 도토리 꼭지 */}
      <path
        d="M32 6 C30 6 28 8 28 10 L28 14 C28 14 30 13 32 13 C34 13 36 14 36 14 L36 10 C36 8 34 6 32 6Z"
        fill="#6B8E23"
      />
      {/* 도토리 모자 */}
      <path
        d="M18 18 C18 14 24 12 32 12 C40 12 46 14 46 18 L46 24 C46 26 44 28 42 28 L22 28 C20 28 18 26 18 24 Z"
        fill="#8B7355"
      />
      <path
        d="M20 20 L44 20"
        stroke="#7A6245"
        strokeWidth="1.5"
      />
      <path
        d="M20 24 L44 24"
        stroke="#7A6245"
        strokeWidth="1.5"
      />
      {/* 도토리 몸통 */}
      <path
        d="M20 28 C20 28 18 42 22 50 C26 58 38 58 42 50 C46 42 44 28 44 28 Z"
        fill="#C8A26E"
      />
      <path
        d="M26 32 C26 32 28 46 32 50"
        stroke="#B8924E"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
