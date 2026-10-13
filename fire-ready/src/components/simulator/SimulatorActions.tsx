"use client";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControlLabel from "@mui/material/FormControlLabel";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import type { Notice } from "./useSimulator";

type SimulatorActionsProps = {
  canAct: boolean;
  savedAt: string | null;
  notice: Notice | null;
  onDismissNotice: () => void;
  onSave: () => void;
  onReset: () => void;
  createShareUrl: () => string | null;
  onExportImage: (includeAmounts: boolean) => Promise<void>;
};

export default function SimulatorActions({
  canAct,
  savedAt,
  notice,
  onDismissNotice,
  onSave,
  onReset,
  createShareUrl,
  onExportImage,
}: SimulatorActionsProps) {
  const [shareOpen, setShareOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  return (
    <Box sx={{ mt: 2.5 }}>
      {notice && (
        <Alert
          severity={notice.severity}
          role={notice.severity === "error" ? "alert" : "status"}
          onClose={onDismissNotice}
          sx={{ mb: 2 }}
        >
          {notice.text}
        </Alert>
      )}
      <Stack direction="row" useFlexGap sx={{ flexWrap: "wrap", gap: 1.5 }}>
        <Button variant="contained" onClick={onSave} disabled={!canAct}>
          この端末に保存
        </Button>
        <Button variant="outlined" onClick={onReset}>
          初期化
        </Button>
        <Button
          variant="outlined"
          onClick={() => setShareOpen(true)}
          disabled={!canAct}
        >
          共有リンクを作成
        </Button>
        <Button
          variant="outlined"
          onClick={() => setExportOpen(true)}
          disabled={!canAct}
        >
          画像で保存
        </Button>
      </Stack>
      <Typography
        variant="body2"
        sx={{ mt: 1.5, color: "text.secondary", fontSize: 13 }}
      >
        {savedAt
          ? `この端末に保存済み（${savedAt}）。初期化すると保存した条件も削除します。`
          : "保存を選ぶまで、入力内容はどこにも保存されません。初期化すると保存した条件も削除します。"}
      </Typography>

      <ShareDialog
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        createShareUrl={createShareUrl}
      />
      <ExportDialog
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        onExport={onExportImage}
      />
    </Box>
  );
}

function ShareDialog({
  open,
  onClose,
  createShareUrl,
}: {
  open: boolean;
  onClose: () => void;
  createShareUrl: () => string | null;
}) {
  const [agreed, setAgreed] = useState(false);
  const [url, setUrl] = useState<string | null>(null);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);

  const close = () => {
    onClose();
    setAgreed(false);
    setUrl(null);
    setCopyMessage(null);
  };

  const copy = async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopyMessage("リンクをコピーしました。");
    } catch (error) {
      console.error(error);
      setCopyMessage(
        "コピーできませんでした。上の欄のリンクを選択してコピーしてください。",
      );
    }
  };

  return (
    <Dialog
      open={open}
      onClose={close}
      aria-labelledby="share-dialog-title"
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle id="share-dialog-title">共有リンクを作成</DialogTitle>
      <DialogContent>
        <Typography variant="body2">
          リンクには、入力した年齢・金額・利回りなどの条件がそのまま含まれます。リンクを知っている人は誰でも、この条件と試算結果を見られます。名前・ログイン情報・口座番号などは含まれません。
        </Typography>
        <Typography variant="body2" sx={{ mt: 1.5 }}>
          条件はURLの「#」以降に入り、このサイトのサーバーには送信されません。共有する相手と場所にご注意ください。
        </Typography>
        <FormControlLabel
          sx={{ mt: 1.5 }}
          control={
            <Checkbox
              checked={agreed}
              onChange={(event) => {
                setAgreed(event.target.checked);
                if (!event.target.checked) setUrl(null);
              }}
            />
          }
          label="上記を理解したうえでリンクを作成します"
        />
        {url && (
          <Box sx={{ mt: 2 }}>
            <TextField
              id="share-url"
              label="共有リンク"
              value={url}
              fullWidth
              slotProps={{
                htmlInput: { readOnly: true },
                inputLabel: { shrink: true },
              }}
              onFocus={(event) => event.target.select()}
            />
            {copyMessage && (
              <Typography role="status" variant="body2" sx={{ mt: 1 }}>
                {copyMessage}
              </Typography>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, flexWrap: "wrap", gap: 1 }}>
        <Button onClick={close}>閉じる</Button>
        {url ? (
          <Button variant="contained" onClick={copy}>
            リンクをコピー
          </Button>
        ) : (
          <Button
            variant="contained"
            disabled={!agreed}
            onClick={() => setUrl(createShareUrl())}
          >
            リンクを作成
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

function ExportDialog({
  open,
  onClose,
  onExport,
}: {
  open: boolean;
  onClose: () => void;
  onExport: (includeAmounts: boolean) => Promise<void>;
}) {
  const [includeAmounts, setIncludeAmounts] = useState(false);
  const [busy, setBusy] = useState(false);

  const exportImage = async () => {
    setBusy(true);
    await onExport(includeAmounts);
    setBusy(false);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="export-dialog-title"
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle id="export-dialog-title">
        試算サマリーを画像で保存
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2">
          単純基準を満たす時期・資産がゼロになる時期・主な仮定・基準日・注意事項をPNG画像にします。画像はこの端末で作成され、サーバーには送信されません。
        </Typography>
        <FormControlLabel
          sx={{ mt: 1.5 }}
          control={
            <Checkbox
              checked={includeAmounts}
              onChange={(event) => setIncludeAmounts(event.target.checked)}
            />
          }
          label="資産・生活費などの金額も含める"
        />
        <Typography
          variant="body2"
          sx={{ color: "text.secondary", fontSize: 13 }}
        >
          初期設定では金額を含めません。画像を共有する場合は内容をご確認ください。
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, flexWrap: "wrap", gap: 1 }}>
        <Button onClick={onClose}>閉じる</Button>
        <Button variant="contained" onClick={exportImage} disabled={busy}>
          {busy ? "作成中…" : "PNGを保存"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
