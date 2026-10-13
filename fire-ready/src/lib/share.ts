import { type SimulatorValues, simulatorValuesSchema } from "./fire/schema";

/** URL フラグメント `#share=v1.<base64url>`。クエリ文字列は使わない */
export const SHARE_PREFIX = "share=";
export const SHARE_VERSION = 1;
export const MAX_SHARE_FRAGMENT_LENGTH = 2000;

export type ShareDecodeResult =
  | { status: "none" }
  | { status: "ok"; values: SimulatorValues }
  | { status: "invalid"; reason: "too_long" | "version" | "format" };

function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function fromBase64Url(encoded: string): string {
  const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64 + "=".repeat((4 - (base64.length % 4)) % 4));
  return new TextDecoder().decode(
    Uint8Array.from(binary, (ch) => ch.charCodeAt(0)),
  );
}

export function encodeShareFragment(values: SimulatorValues): string {
  return `${SHARE_PREFIX}v${SHARE_VERSION}.${toBase64Url(JSON.stringify(values))}`;
}

export function buildShareUrl(
  baseUrl: string,
  values: SimulatorValues,
): string {
  const url = new URL(baseUrl);
  url.search = "";
  url.hash = encodeShareFragment(values);
  return url.toString();
}

export function decodeShareFragment(hash: string): ShareDecodeResult {
  const fragment = hash.startsWith("#") ? hash.slice(1) : hash;
  if (!fragment.startsWith(SHARE_PREFIX)) return { status: "none" };
  if (fragment.length > MAX_SHARE_FRAGMENT_LENGTH)
    return { status: "invalid", reason: "too_long" };

  const match = /^v(\d+)\.([A-Za-z0-9_-]+)$/.exec(
    fragment.slice(SHARE_PREFIX.length),
  );
  if (!match) return { status: "invalid", reason: "format" };
  if (Number(match[1]) !== SHARE_VERSION)
    return { status: "invalid", reason: "version" };

  try {
    const parsed = simulatorValuesSchema.safeParse(
      JSON.parse(fromBase64Url(match[2])),
    );
    return parsed.success
      ? { status: "ok", values: parsed.data }
      : { status: "invalid", reason: "format" };
  } catch {
    return { status: "invalid", reason: "format" };
  }
}
