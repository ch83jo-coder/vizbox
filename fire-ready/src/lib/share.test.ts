import { describe, expect, it } from "vitest";
import { DEFAULT_VALUES } from "./fire/schema";
import {
  buildShareUrl,
  decodeShareFragment,
  encodeShareFragment,
} from "./share";
import {
  clearSimulatorValues,
  loadSimulatorValues,
  SIMULATOR_STORAGE_KEY,
  type StorageLike,
  saveSimulatorValues,
} from "./storage";

function memoryStorage(initial: Record<string, string> = {}): StorageLike {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => void map.set(key, value),
    removeItem: (key) => void map.delete(key),
  };
}

describe("共有フラグメント", () => {
  it("往復で同じ値に戻る", () => {
    const hash = `#${encodeShareFragment(DEFAULT_VALUES)}`;
    expect(decodeShareFragment(hash)).toEqual({
      status: "ok",
      values: DEFAULT_VALUES,
    });
  });

  it("クエリ文字列を使わずフラグメントに入れる", () => {
    const url = new URL(
      buildShareUrl("https://example.com/?utm=x#simulator", DEFAULT_VALUES),
    );
    expect(url.search).toBe("");
    expect(url.hash.startsWith("#share=v1.")).toBe(true);
  });

  it("共有でないフラグメントは無視", () => {
    expect(decodeShareFragment("#simulator")).toEqual({ status: "none" });
    expect(decodeShareFragment("")).toEqual({ status: "none" });
  });

  it("壊れたデータ・別バージョン・長すぎるデータは invalid", () => {
    expect(decodeShareFragment("#share=v1.!!!")).toMatchObject({
      reason: "format",
    });
    expect(decodeShareFragment("#share=v1.bm90LWpzb24")).toMatchObject({
      reason: "format",
    });
    expect(decodeShareFragment("#share=v2.e30")).toMatchObject({
      reason: "version",
    });
    expect(decodeShareFragment(`#share=v1.${"a".repeat(3000)}`)).toMatchObject({
      reason: "too_long",
    });
  });

  it("範囲外の値は Zod 検査で拒否", () => {
    const tampered = encodeShareFragment({
      ...DEFAULT_VALUES,
      withdrawalRatePct: 0,
    });
    expect(decodeShareFragment(tampered)).toMatchObject({
      status: "invalid",
      reason: "format",
    });
  });

  it("余分な項目（名前など）は取り込まない", () => {
    const json = JSON.stringify({ ...DEFAULT_VALUES, name: "山田" });
    const encoded = btoa(String.fromCharCode(...new TextEncoder().encode(json)))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    const result = decodeShareFragment(`#share=v1.${encoded}`);
    expect(result).toEqual({ status: "ok", values: DEFAULT_VALUES });
  });
});

describe("ローカル保存", () => {
  it("保存 → 復元 → 初期化", () => {
    const storage = memoryStorage();
    expect(loadSimulatorValues(storage)).toEqual({ status: "empty" });
    saveSimulatorValues(
      storage,
      DEFAULT_VALUES,
      new Date("2026-10-13T00:00:00Z"),
    );
    expect(loadSimulatorValues(storage)).toEqual({
      status: "loaded",
      data: {
        schemaVersion: 1,
        savedAt: "2026-10-13T00:00:00.000Z",
        values: DEFAULT_VALUES,
      },
    });
    clearSimulatorValues(storage);
    expect(loadSimulatorValues(storage)).toEqual({ status: "empty" });
  });

  it("旧バージョン・破損データは invalid として扱う", () => {
    const old = memoryStorage({
      [SIMULATOR_STORAGE_KEY]: JSON.stringify({
        schemaVersion: 0,
        values: DEFAULT_VALUES,
      }),
    });
    expect(loadSimulatorValues(old)).toEqual({ status: "invalid" });
    const broken = memoryStorage({ [SIMULATOR_STORAGE_KEY]: "{" });
    expect(loadSimulatorValues(broken)).toEqual({ status: "invalid" });
  });

  it("localStorage が使えない環境は unavailable", () => {
    const blocked: StorageLike = {
      getItem: () => {
        throw new Error("SecurityError");
      },
      setItem: () => {},
      removeItem: () => {},
    };
    expect(loadSimulatorValues(blocked)).toEqual({ status: "unavailable" });
  });
});
