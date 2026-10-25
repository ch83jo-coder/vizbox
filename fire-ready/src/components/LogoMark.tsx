/** デザインシステムシートのロゴ（山＋太陽）をSVGで再現したもの。装飾なので読み上げない */
export default function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="logo-sun" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F0AE30" />
          <stop offset="1" stopColor="#FC8A3C" />
        </linearGradient>
      </defs>
      <circle cx="40" cy="24" r="14" fill="url(#logo-sun)" />
      <path d="M4 54 L24 26 L34 38 L42 30 L60 54 Z" fill="#368466" />
      <path d="M24 26 L34 38 L28 46 L32 54 L20 54 L26 44 Z" fill="#24725A" />
      <path
        d="M24 26 L29 33 L25 38 L27 44"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
