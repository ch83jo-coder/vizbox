import { z } from "zod";
import { type SimulatorValues, simulatorValuesSchema } from "./fire/schema";

export const SIMULATOR_STORAGE_KEY = "fire-ready:simulator";
export const CHECKLIST_STORAGE_PREFIX = "fire-ready:checklist:";
export const STORAGE_SCHEMA_VERSION = 1;

export type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

const storedSimulatorSchema = z.object({
  schemaVersion: z.literal(STORAGE_SCHEMA_VERSION),
  savedAt: z.string(),
  values: simulatorValuesSchema,
});

const storedChecklistSchema = z.object({
  schemaVersion: z.literal(STORAGE_SCHEMA_VERSION),
  checked: z.array(z.string().max(64)).max(100),
});

export type LoadResult<T> =
  | { status: "empty" }
  | { status: "loaded"; data: T }
  /** 旧形式・破損データ */
  | { status: "invalid" }
  /** ブラウザーの設定などで localStorage を使えない */
  | { status: "unavailable" };

function load<T>(
  storage: StorageLike,
  key: string,
  schema: z.ZodType<T>,
): LoadResult<T> {
  let raw: string | null;
  try {
    raw = storage.getItem(key);
  } catch {
    return { status: "unavailable" };
  }
  if (raw === null) return { status: "empty" };
  try {
    const parsed = schema.safeParse(JSON.parse(raw));
    return parsed.success
      ? { status: "loaded", data: parsed.data }
      : { status: "invalid" };
  } catch {
    return { status: "invalid" };
  }
}

/** 利用者が「この端末に保存」を選んだときだけ呼ぶ。失敗時は例外を投げる */
export function saveSimulatorValues(
  storage: StorageLike,
  values: SimulatorValues,
  savedAt: Date,
) {
  const data: z.infer<typeof storedSimulatorSchema> = {
    schemaVersion: STORAGE_SCHEMA_VERSION,
    savedAt: savedAt.toISOString(),
    values,
  };
  storage.setItem(SIMULATOR_STORAGE_KEY, JSON.stringify(data));
}

export function loadSimulatorValues(storage: StorageLike) {
  return load(storage, SIMULATOR_STORAGE_KEY, storedSimulatorSchema);
}

export function clearSimulatorValues(storage: StorageLike) {
  storage.removeItem(SIMULATOR_STORAGE_KEY);
}

export function saveChecklist(
  storage: StorageLike,
  slug: string,
  checked: string[],
) {
  const data: z.infer<typeof storedChecklistSchema> = {
    schemaVersion: STORAGE_SCHEMA_VERSION,
    checked,
  };
  storage.setItem(CHECKLIST_STORAGE_PREFIX + slug, JSON.stringify(data));
}

export function loadChecklist(storage: StorageLike, slug: string) {
  return load(storage, CHECKLIST_STORAGE_PREFIX + slug, storedChecklistSchema);
}

export function clearChecklist(storage: StorageLike, slug: string) {
  storage.removeItem(CHECKLIST_STORAGE_PREFIX + slug);
}
