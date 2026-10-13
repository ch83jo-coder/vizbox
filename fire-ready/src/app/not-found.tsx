import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import PageIntro from "@/components/PageIntro";

export default function NotFound() {
  return (
    <Container maxWidth="lg">
      <PageIntro title="ページが見つかりません">
        お探しのページは移動したか、まだ公開されていません。
      </PageIntro>
      <Button variant="contained" href="/">
        トップページへ
      </Button>
    </Container>
  );
}
