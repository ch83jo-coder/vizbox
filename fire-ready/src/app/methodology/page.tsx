import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Link from "@mui/material/Link";
import type { Metadata } from "next";
import PageIntro, { ProseSection } from "@/components/PageIntro";
import { DISCLAIMER, MODEL_ASSUMPTIONS, MODEL_LIMITATIONS } from "@/lib/copy";
import { LIMITS } from "@/lib/fire/schema";

export const metadata: Metadata = {
  title: "計算の前提",
  description:
    "FIRE READYのシミュレーターが使う月単位の計算方法、必要資産の目安、単純基準を満たす時期、資産がゼロになる時期の考え方を説明します。",
};

const formula = {
  component: "code",
  sx: {
    display: "block",
    mt: 1.5,
    px: 2,
    py: 1.5,
    borderRadius: "8px",
    bgcolor: "background.paper",
    border: 1,
    borderColor: "divider",
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
    fontSize: 14,
    whiteSpace: "pre-wrap",
  },
} as const;

export default function MethodologyPage() {
  return (
    <Container maxWidth="lg">
      <PageIntro title="計算の前提">
        シミュレーターは、入力した値だけを使って月単位で計算します。外部のデータや統計、運用成果の予測は使いません。
      </PageIntro>

      <ProseSection title="基本の考え方">
        <ul>
          {MODEL_ASSUMPTIONS.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </ProseSection>

      <ProseSection title="利回りと物価の換算">
        <p>年率の利回り r と物価上昇率 i を、月単位に換算して使います。</p>
        <Box {...formula}>
          {
            "月次利回り rm = (1 + r)^(1/12) − 1\n物価係数 F(t) = (1 + i)^(t/12)　（t は現在からの月数）"
          }
        </Box>
        <p>
          参考として表示する実質利回りは (1 + r) ÷ (1 + i) − 1
          です。計算はすべて名目の円で行い、実質利回りを計算に使うことはありません。
        </p>
      </ProseSection>

      <ProseSection title="リタイアまで（積立期間）">
        <p>
          現在の資産 A[0] から始め、毎月の運用益を反映したあと、月末に積立額 C
          を加えます。
        </p>
        <Box {...formula}>
          {"A[m] = A[m−1] × (1 + rm) + C　（m = 1 … リタイアまでの月数 T）"}
        </Box>
        <p>
          積立額は名目で一定の純貯蓄額です。この期間の生活費は給与などでまかなうと仮定し、資産からは差し引きません。
        </p>
      </ProseSection>

      <ProseSection title="リタイア後（取り崩し期間）">
        <p>
          各月の初めに、その月の生活費 E と追加費用から FIRE 後の収入 I
          を差し引いた額 D
          を取り崩し、そのあとで運用益を反映します。生活費・追加費用・収入は物価係数で増えます。
        </p>
        <Box {...formula}>
          {
            "D = max(0, (生活費 + 追加費用) × F(s) − 収入 × F(s))\nA[m] = (A[m−1] − D) × (1 + rm)　（s = m − 1）"
          }
        </Box>
        <p>
          収入は開始年齢の月から、終了年齢の月の前まで（終了年齢の月は含まない）を対象にします。収入が生活費を上回っても、超過分は再投資しません。
        </p>
      </ProseSection>

      <ProseSection title="必要資産の目安">
        <p>
          年間の不足額を取り崩し率 w
          で割った金額を、必要資産の目安とします。FIRE
          後の収入は、リタイア時点で受け取っている場合だけ差し引きます。
        </p>
        <Box {...formula}>
          {
            "現在の購買力での目安 K0 = max(0, 12 × (生活費 + 追加費用 − 収入)) ÷ w\n目標時点の目安 KT = K0 × F(T)"
          }
        </Box>
        <p>
          期間が限られた収入の場合、この目安はリタイア開始時点の単純な基準です。収入が終わったあとの目安は結果に別に表示します。リタイア後に資産が続くかどうかは、資産の推移で確認してください。
        </p>
      </ProseSection>

      <ProseSection title="目標時点の予想資産と不足額">
        <p>
          目標リタイア時点の予想資産 A[T] と目安 KT を比べ、不足額 max(0, KT −
          A[T])
          を表示します。目安が0円のとき（収入で生活費をまかなえる設定のとき）は、割合や不足額を計算しません。
        </p>
      </ProseSection>

      <ProseSection title="単純基準を満たす時期">
        <p>
          目標リタイアの経路とは別に、リタイアせずに積立を続けた場合の資産 B[t]
          を計算し、その時点の目安 K[t]
          以上になる最初の時期を表示します。現在すでに満たしている場合と、試算の最終年齢までに届かない場合も区別します。
        </p>
        <p>
          この時期に退職しても資産が続くことは保証しません。目標リタイアの経路とは混ぜずに表示します。
        </p>
      </ProseSection>

      <ProseSection title="資産がゼロになる時期">
        <p>
          月初の取り崩し額が資産と同じか上回った最初の月を「資産がゼロになる時期」とします。資産は0円より下にはせず、まかなえなかった支出は別に記録します。その後に収入が始まっても、この時期の表示は消えません。
        </p>
      </ProseSection>

      <ProseSection title="現在の購買力での表示">
        <p>
          各時点の金額を物価係数 F(t)
          で割って、現在の購買力に換算します。グラフ・表・結果カードはすべて同じ換算を使います。年齢や時期は換算しません。
        </p>
      </ProseSection>

      <ProseSection title="利回りの仮定を変えた比較">
        <p>
          入力した利回りから2%ポイント低い場合と高い場合を、ほかの条件は同じにして計算します。入力できる範囲（
          {LIMITS.returnPct.min}〜{LIMITS.returnPct.max}
          %）を超える場合は範囲内に調整し、その旨を表示します。起こる確率や、最悪・最善の結果を示すものではありません。
        </p>
      </ProseSection>

      <ProseSection title="入力できる範囲">
        <ul>
          <li>
            現在の年齢は18〜90歳、目標リタイア年齢は現在の年齢〜100歳、試算の最終年齢は110歳までです。
          </li>
          <li>
            資産は{LIMITS.assetsMaxMan.toLocaleString("ja-JP")}
            万円（100億円）まで、毎月の金額は
            {LIMITS.monthlyMaxMan.toLocaleString("ja-JP")}万円までです。
          </li>
          <li>
            利回りは{LIMITS.returnPct.min}〜{LIMITS.returnPct.max}
            %、物価上昇率は
            {LIMITS.inflationPct.min}〜{LIMITS.inflationPct.max}%、取り崩し率は
            {LIMITS.withdrawalPct.min}〜{LIMITS.withdrawalPct.max}%です。
          </li>
          <li>
            これらは計算できる範囲の制限で、経済的に妥当かどうかの判断ではありません。
          </li>
        </ul>
      </ProseSection>

      <ProseSection title="この試算に含まれないもの">
        <ul>
          {MODEL_LIMITATIONS.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p>{DISCLAIMER}</p>
        <p>
          <Link href="/#simulator">シミュレーターに戻る</Link>
        </p>
      </ProseSection>
    </Container>
  );
}
