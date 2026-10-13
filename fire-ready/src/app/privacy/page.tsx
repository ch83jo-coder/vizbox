import Container from "@mui/material/Container";
import type { Metadata } from "next";
import PageIntro, { ProseSection } from "@/components/PageIntro";
import { CHECKLIST_STORAGE_PREFIX, SIMULATOR_STORAGE_KEY } from "@/lib/storage";

export const metadata: Metadata = {
  title: "プライバシー（保存と共有）",
  description:
    "FIRE READYでの入力内容の取り扱い、端末への保存、共有リンク、画像保存について説明します。",
};

export default function PrivacyPage() {
  return (
    <Container maxWidth="lg">
      <PageIntro title="プライバシー（保存と共有）">
        FIRE READYは会員登録なしで使えます。入力した内容の取り扱いを説明します。
      </PageIntro>

      <ProseSection title="計算とサーバーへの送信">
        <p>
          シミュレーターの計算はすべてお使いのブラウザーの中で行います。入力した年齢・金額・利回りなどを、このサイトのサーバーに送信・保存することはありません。
        </p>
      </ProseSection>

      <ProseSection title="この端末への保存">
        <ul>
          <li>
            「この端末に保存」を選んだときだけ、入力内容をこのブラウザーの
            localStorage（キー：
            <code>{SIMULATOR_STORAGE_KEY}</code>
            ）に保存します。初期設定では保存しません。
          </li>
          <li>
            保存データには形式のバージョンと保存日時を含みます。形式が古い場合や壊れている場合は使用せず、初期値で表示します。
          </li>
          <li>
            「初期化」を選ぶと、保存した内容をすべて削除して初期値に戻します。
          </li>
          <li>
            ガイドのチェックリストも、保存を選んだときだけ同じ方法で保存します（キー：
            <code>{CHECKLIST_STORAGE_PREFIX}</code>
            ガイド名）。「チェックを消去」で削除できます。
          </li>
          <li>
            共用のパソコンでは、使い終わったら初期化することをおすすめします。
          </li>
        </ul>
      </ProseSection>

      <ProseSection title="共有リンク">
        <ul>
          <li>
            確認画面で同意したときだけ、入力した条件を含むリンクを作成します。
          </li>
          <li>
            条件はURLの「#」以降（フラグメント）に入ります。この部分はブラウザーからサーバーへ送信されません。
          </li>
          <li>
            ただし、リンクを知っている人は誰でも条件と試算結果を見られます。メッセージやSNSに貼ると、相手のサービスに記録される場合があります。共有する相手と場所にご注意ください。
          </li>
          <li>
            名前・ログイン情報・口座番号などは含みません。読み込むときは形式とバージョンを確認し、正しくないリンクは使用しません。
          </li>
        </ul>
      </ProseSection>

      <ProseSection title="画像で保存">
        <p>
          試算サマリーの画像はお使いのブラウザーの中で作成し、サーバーには送信しません。初期設定では資産・生活費などの金額を含めず、含めるかどうかを選べます。
        </p>
      </ProseSection>

      <ProseSection title="アクセス解析">
        <p>
          現在、アクセス解析は導入していません。今後導入する場合も、入力内容・試算結果・共有リンクの内容は収集せず、ボタンの操作などの金融情報を含まない情報に限ります。
        </p>
      </ProseSection>
    </Container>
  );
}
