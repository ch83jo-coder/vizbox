import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Link from "@mui/material/Link";

const NAV_ITEMS = [
  { href: "/#simulator", label: "シミュレーター" },
  { href: "/methodology", label: "計算の前提" },
  { href: "/guides", label: "FIRE後の準備" },
];

export default function SiteHeader() {
  return (
    <Box component="header" sx={{ borderBottom: 1, borderColor: "divider" }}>
      <Container
        maxWidth="lg"
        sx={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          columnGap: 2,
          py: 1,
        }}
      >
        <Link
          href="/"
          underline="none"
          sx={{
            display: "inline-flex",
            alignItems: "center",
            minHeight: 44,
            color: "text.primary",
            fontWeight: 700,
            fontSize: 18,
            letterSpacing: "0.14em",
          }}
        >
          FIRE READY
        </Link>
        <Box component="nav" aria-label="メインメニュー">
          <Box
            component="ul"
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: { xs: 0, sm: 1 },
              m: 0,
              p: 0,
              listStyle: "none",
            }}
          >
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  underline="hover"
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    minHeight: 44,
                    px: { xs: 1, sm: 1.5 },
                    color: "text.primary",
                    fontSize: { xs: 14, sm: 15 },
                    fontWeight: 500,
                  }}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
