/** development-prompt.json の design.tokens。accentStrong は文字・線用に濃くした金色（白地で 4.5:1 以上） */
export const tokens = {
  background: "#F7F5EF",
  surface: "#FFFFFF",
  text: "#132D3A",
  primary: "#126C63",
  muted: "#596A70",
  accent: "#B49A67",
  accentStrong: "#75602F",
  border: "#E2E7E3",
  /** シミュレーター帯の背景（muted 文字で 4.5:1 以上） */
  band: "#EFEDE6",
  radius: 16,
  contentMaxWidth: 1200,
} as const;

export const FONT_FALLBACK = [
  "Hiragino Sans",
  "Hiragino Kaku Gothic ProN",
  "Yu Gothic",
  "Meiryo",
  "sans-serif",
];
