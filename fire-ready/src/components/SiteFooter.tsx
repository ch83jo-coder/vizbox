import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { DISCLAIMER } from "@/lib/copy";

const FOOTER_LINKS = [
  { href: "/methodology", label: "計算の前提" },
  { href: "/guides", label: "FIRE後の準備" },
  { href: "/privacy", label: "プライバシー" },
];

export default function SiteFooter() {
  return (
    <Box
      component="footer"
      sx={{
        mt: 10,
        py: 6,
        bgcolor: "text.primary",
        color: "#FFFFFF",
        "& a:focus-visible": { outlineColor: "#FFFFFF" },
      }}
    >
      <Container maxWidth="lg">
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={3}
          sx={{ justifyContent: "space-between" }}
        >
          <Box sx={{ maxWidth: 640 }}>
            <Typography sx={{ fontWeight: 700, letterSpacing: "0.14em" }}>
              FIRE READY
            </Typography>
            <Typography
              variant="body2"
              sx={{ mt: 1.5, color: "rgba(255,255,255,0.82)" }}
            >
              {DISCLAIMER}
            </Typography>
          </Box>
          <Box component="nav" aria-label="フッターメニュー">
            <Box component="ul" sx={{ m: 0, p: 0, listStyle: "none" }}>
              {FOOTER_LINKS.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    underline="always"
                    sx={{
                      display: "inline-flex",
                      alignItems: "center",
                      minHeight: 44,
                      color: "#FFFFFF",
                      textDecorationColor: "rgba(255,255,255,0.5)",
                    }}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </Box>
          </Box>
        </Stack>
      </Container>
    </Box>
  );
}
