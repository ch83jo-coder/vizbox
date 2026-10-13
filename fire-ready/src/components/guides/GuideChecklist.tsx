"use client";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useEffect, useState } from "react";
import type { Guide } from "@/content/guides/schema";
import {
  clearChecklist,
  loadChecklist,
  loadSimulatorValues,
  saveChecklist,
} from "@/lib/storage";

type GuideChecklistProps = {
  slug: string;
  items: Guide["checklist"];
  /** シミュレーターで保存した生活費を予算の目安として表示できる */
  offerBudget: boolean;
};

type Message = { severity: "success" | "info" | "error"; text: string };

function getLocalStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export default function GuideChecklist({
  slug,
  items,
  offerBudget,
}: GuideChecklistProps) {
  const [checked, setChecked] = useState<string[]>([]);
  const [message, setMessage] = useState<Message | null>(null);
  const [budget, setBudget] = useState<string | null>(null);

  useEffect(() => {
    const storage = getLocalStorage();
    if (!storage) return;
    const stored = loadChecklist(storage, slug);
    if (stored.status === "loaded") {
      const ids = new Set(items.map((item) => item.id));
      setChecked(stored.data.checked.filter((id) => ids.has(id)));
    }
  }, [slug, items]);

  const toggle = (id: string) =>
    setChecked((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  const save = () => {
    try {
      const storage = getLocalStorage();
      if (!storage) throw new Error("localStorage is unavailable");
      saveChecklist(storage, slug, checked);
      setMessage({
        severity: "success",
        text: "チェック状況をこの端末に保存しました。",
      });
    } catch (error) {
      console.error(error);
      setMessage({
        severity: "error",
        text: "この端末に保存できませんでした。ブラウザーの設定をご確認ください。",
      });
    }
  };

  const clear = () => {
    try {
      const storage = getLocalStorage();
      if (storage) clearChecklist(storage, slug);
      setChecked([]);
      setMessage({
        severity: "info",
        text: "チェックと保存内容を消去しました。",
      });
    } catch (error) {
      console.error(error);
      setMessage({
        severity: "error",
        text: "保存内容を消去できませんでした。ブラウザーの設定をご確認ください。",
      });
    }
  };

  const showBudget = () => {
    const storage = getLocalStorage();
    const stored = storage
      ? loadSimulatorValues(storage)
      : ({ status: "unavailable" } as const);
    if (stored.status !== "loaded") {
      setBudget(
        "シミュレーターで「この端末に保存」を選ぶと、ここに生活費の予算の目安を表示できます。",
      );
      return;
    }
    const { monthlyExpensesMan, monthlyExtraCostsMan } = stored.data.values;
    setBudget(
      `保存した条件：月額生活費 ${monthlyExpensesMan.toLocaleString("ja-JP")}万円・追加の月額費用 ${monthlyExtraCostsMan.toLocaleString("ja-JP")}万円（現在の購買力）。家賃がこの予算に含まれているか確認しましょう。`,
    );
  };

  return (
    <Box>
      <Box component="ul" sx={{ m: 0, p: 0, listStyle: "none" }}>
        {items.map((item) => (
          <Box
            component="li"
            key={item.id}
            sx={{ borderTop: 1, borderColor: "divider", py: 0.5 }}
          >
            <FormControlLabel
              sx={{
                alignItems: "flex-start",
                m: 0,
                "& .MuiFormControlLabel-label": { pt: 1.25 },
              }}
              control={
                <Checkbox
                  checked={checked.includes(item.id)}
                  onChange={() => toggle(item.id)}
                />
              }
              label={
                item.optional ? `${item.label}（必要に応じて）` : item.label
              }
            />
          </Box>
        ))}
      </Box>
      <Typography
        variant="body2"
        sx={{ mt: 1.5, color: "text.secondary", fontSize: 13 }}
      >
        チェック状況は、保存を選ぶまでどこにも保存されません。審査の結果を予測するものではありません。
      </Typography>
      <Stack
        direction="row"
        useFlexGap
        sx={{ mt: 2, flexWrap: "wrap", gap: 1.5 }}
      >
        <Button variant="contained" onClick={save}>
          この端末に保存
        </Button>
        <Button variant="outlined" onClick={clear}>
          チェックを消去
        </Button>
        {offerBudget && (
          <Button variant="outlined" onClick={showBudget}>
            保存した生活費を表示
          </Button>
        )}
      </Stack>
      {message && (
        <Alert
          severity={message.severity}
          role={message.severity === "error" ? "alert" : "status"}
          sx={{ mt: 2 }}
        >
          {message.text}
        </Alert>
      )}
      {budget && (
        <Typography role="status" variant="body2" sx={{ mt: 2 }}>
          {budget}
        </Typography>
      )}
    </Box>
  );
}
