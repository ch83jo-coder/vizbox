import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

const FAQ_ITEMS = [
  {
    q: "取り崩し率3.5%は安全な数値ですか？",
    a: "いいえ。3.5%は必要資産の目安を出すための初期値で、安全を保証する数値ではありません。ご自身の考えに合わせて1〜8%の範囲で変更できます。",
  },
  {
    q: "「単純基準を満たす時期」とは何ですか？",
    a: "リタイアせずに積立を続けた場合に、資産がその時点の必要資産の目安に届く時期です。その時期に退職しても資産が続くことを示すものではありません。退職後の推移は「資産の推移」で確認してください。",
  },
  {
    q: "「現在の購買力」と「名目」の違いは？",
    a: "名目は将来その時点の額面の金額です。現在の購買力は、物価上昇分を割り引いて今のお金の価値に換算した金額です。計算は名目の円で行い、表示するときだけ換算します。",
  },
  {
    q: "税金・年金・健康保険は計算に含まれますか？",
    a: "制度の自動計算は行いません。税金・社会保険料などは、月額生活費または追加の月額費用にご自身で含めてください。年金を見込む場合は「FIRE後の収入」に手取り額を入力します。",
  },
  {
    q: "入力した内容はどこに保存されますか？",
    a: "計算はすべてお使いのブラウザーの中で行い、サーバーには送信しません。「この端末に保存」を選んだときだけ、このブラウザーに保存します。「初期化」で削除できます。",
  },
  {
    q: "結果はFIREの実現を保証しますか？",
    a: "いいえ。入力した仮定に基づく試算です。一定の利回り・物価を仮定しており、実際の運用成果や制度の変更は反映していません。",
  },
];

export default function Faq() {
  return (
    <Box sx={{ display: "grid", gap: 1.5 }}>
      {FAQ_ITEMS.map((item) => (
        <Box
          component="details"
          key={item.q}
          sx={{
            px: { xs: 2.5, sm: 3 },
            py: 1,
            border: 1,
            borderColor: "divider",
            borderRadius: "12px",
            bgcolor: "background.paper",
            "& summary": {
              cursor: "pointer",
              fontWeight: 700,
              minHeight: 44,
              display: "flex",
              alignItems: "center",
              py: 1,
            },
          }}
        >
          <summary>{item.q}</summary>
          <Typography variant="body2" sx={{ pb: 2, color: "text.secondary" }}>
            {item.a}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}
