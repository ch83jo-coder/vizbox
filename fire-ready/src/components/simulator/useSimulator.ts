"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useForm, useWatch } from "react-hook-form";
import { RESULTS_COPY } from "@/lib/copy";
import { downloadBlob, renderSummaryPng } from "@/lib/exportImage";
import { summaryAtRetirement, type ValueMode } from "@/lib/fire/display";
import { buildScenarios } from "@/lib/fire/scenarios";
import {
  DEFAULT_VALUES,
  type SimulatorField,
  type SimulatorFormInput,
  type SimulatorValues,
  simulatorFormSchema,
  toEngineInput,
  toFormInput,
} from "@/lib/fire/schema";
import type { Projection } from "@/lib/fire/types";
import { formatAgeAt, formatYen } from "@/lib/format";
import { buildShareUrl, decodeShareFragment } from "@/lib/share";
import {
  clearSimulatorValues,
  loadSimulatorValues,
  saveSimulatorValues,
} from "@/lib/storage";

export type Notice = {
  severity: "success" | "info" | "warning" | "error";
  text: string;
};

export type FieldIssue = { field: SimulatorField; message: string };

const savedAtFormat = new Intl.DateTimeFormat("ja-JP", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Tokyo",
});

function getLocalStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export function useSimulator() {
  const form = useForm<SimulatorFormInput, unknown, SimulatorValues>({
    resolver: zodResolver(simulatorFormSchema),
    mode: "onChange",
    defaultValues: toFormInput(DEFAULT_VALUES),
  });
  const { control, reset } = form;
  const watched = useWatch({ control });
  const deferred = useDeferredValue(watched);
  const parsed = useMemo(
    () => simulatorFormSchema.safeParse(deferred),
    [deferred],
  );
  const values = parsed.success ? parsed.data : null;
  const issues: FieldIssue[] = parsed.success
    ? []
    : parsed.error.issues.map((issue) => ({
        field: issue.path[0] as SimulatorField,
        message: issue.message,
      }));
  const scenarios = useMemo(
    () => (values ? buildScenarios(toEngineInput(values)) : null),
    [values],
  );
  const base = scenarios?.find((s) => s.id === "base") ?? null;

  const [mode, setMode] = useState<ValueMode>("real");
  const [notice, setNotice] = useState<Notice | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  // 共有リンク → 端末の保存データの順に復元する。どちらもなければ初期値
  useEffect(() => {
    const shared = decodeShareFragment(window.location.hash);
    if (shared.status === "ok") {
      reset(toFormInput(shared.values));
      setNotice({
        severity: "info",
        text: "共有リンクの条件を表示しています。この端末には保存されていません。",
      });
      document.getElementById("simulator")?.scrollIntoView();
      return;
    }
    if (shared.status === "invalid") {
      setNotice({
        severity: "warning",
        text: "共有リンクを読み込めませんでした（形式が古いか、内容が正しくありません）。初期値で表示しています。",
      });
      return;
    }

    const storage = getLocalStorage();
    if (!storage) return;
    const stored = loadSimulatorValues(storage);
    if (stored.status === "loaded") {
      reset(toFormInput(stored.data.values));
      setSavedAt(stored.data.savedAt);
      setNotice({
        severity: "info",
        text: `この端末に保存した条件を読み込みました（${savedAtFormat.format(new Date(stored.data.savedAt))}）。`,
      });
    } else if (stored.status === "invalid") {
      try {
        clearSimulatorValues(storage);
      } catch (error) {
        console.error(error);
      }
      setNotice({
        severity: "warning",
        text: "保存データの形式が古いか壊れていたため使用できませんでした。初期値で表示しています。",
      });
    }
  }, [reset]);

  const save = useCallback(() => {
    if (!values) return;
    const now = new Date();
    try {
      const storage = getLocalStorage();
      if (!storage) throw new Error("localStorage is unavailable");
      saveSimulatorValues(storage, values, now);
      setSavedAt(now.toISOString());
      setNotice({
        severity: "success",
        text: "この端末のブラウザーに保存しました。サーバーには送信されません。",
      });
    } catch (error) {
      console.error(error);
      setNotice({
        severity: "error",
        text: "この端末に保存できませんでした。ブラウザーの設定（プライベートモードなど）をご確認ください。",
      });
    }
  }, [values]);

  const resetAll = useCallback(() => {
    let cleared = true;
    try {
      const storage = getLocalStorage();
      if (storage) clearSimulatorValues(storage);
    } catch (error) {
      console.error(error);
      cleared = false;
    }
    if (window.location.hash.startsWith("#share=")) {
      window.history.replaceState(
        null,
        "",
        window.location.pathname + window.location.search,
      );
    }
    reset(toFormInput(DEFAULT_VALUES));
    setSavedAt(null);
    setNotice(
      cleared
        ? {
            severity: "info",
            text: "保存した条件を削除し、初期値に戻しました。",
          }
        : {
            severity: "error",
            text: "初期値に戻しましたが、保存データを削除できませんでした。ブラウザーの設定をご確認ください。",
          },
    );
  }, [reset]);

  const createShareUrl = useCallback(
    () => (values ? buildShareUrl(window.location.href, values) : null),
    [values],
  );

  const exportImage = useCallback(
    async (includeAmounts: boolean) => {
      if (!values || !base) return;
      try {
        const createdAt = new Date();
        const blob = await renderSummaryPng({
          values,
          projection: base.projection,
          mode,
          includeAmounts,
          createdAt,
        });
        const stamp = createdAt.toISOString().slice(0, 10).replaceAll("-", "");
        downloadBlob(blob, `fire-ready-summary-${stamp}.png`);
        setNotice({
          severity: "success",
          text: "試算サマリーの画像を保存しました。",
        });
      } catch (error) {
        console.error(error);
        setNotice({
          severity: "error",
          text: "画像を作成できませんでした。時間をおいて再度お試しください。",
        });
      }
    },
    [values, base, mode],
  );

  const liveSummary = useDebouncedValue(
    describeResult(values, base?.projection ?? null, mode, issues.length),
    800,
  );

  return {
    form,
    values,
    issues,
    scenarios,
    mode,
    setMode,
    notice,
    dismissNotice: () => setNotice(null),
    savedAt: savedAt ? savedAtFormat.format(new Date(savedAt)) : null,
    save,
    resetAll,
    createShareUrl,
    exportImage,
    liveSummary,
  };
}

/** スクリーンリーダー向けの結果要約（入力が落ち着いてから読み上げる） */
function describeResult(
  values: SimulatorValues | null,
  projection: Projection | null,
  mode: ValueMode,
  issueCount: number,
): string {
  if (!values || !projection) {
    return `入力内容に${issueCount}件の確認事項があります。結果は表示されていません。`;
  }
  const summary = summaryAtRetirement(projection, mode);
  const earliest =
    projection.earliestFire.status === "already"
      ? "現在すでに満たしています"
      : projection.earliestFire.status === "reached"
        ? formatAgeAt(values.currentAge, projection.earliestFire.month)
        : RESULTS_COPY.notReached;
  return [
    `${RESULTS_COPY.required} ${formatYen(summary.required)}`,
    `${RESULTS_COPY.targetBalance} ${formatYen(summary.balance)}`,
    `${RESULTS_COPY.earliest} ${earliest}`,
  ].join("、");
}
