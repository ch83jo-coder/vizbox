import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";

export default function PageIntro({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) {
  return (
    <Box sx={{ pt: { xs: 5, md: 8 }, pb: { xs: 4, md: 6 }, maxWidth: 760 }}>
      <Typography
        variant="h1"
        sx={{ fontSize: "clamp(1.75rem, 1.4rem + 1.6vw, 2.5rem)" }}
      >
        {title}
      </Typography>
      {children && (
        <Typography component="div" sx={{ mt: 2, color: "text.secondary" }}>
          {children}
        </Typography>
      )}
    </Box>
  );
}

export function ProseSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <Box
      component="section"
      sx={{
        mt: 5,
        maxWidth: 760,
        "& > p": { mt: 1.5, mb: 0 },
        "& > ul, & > ol": { mt: 1.5, mb: 0, pl: 3 },
        "& > ul > li + li, & > ol > li + li": { mt: 0.75 },
      }}
    >
      <Typography
        variant="h2"
        sx={{ fontSize: "clamp(1.25rem, 1.1rem + 0.6vw, 1.5rem)" }}
      >
        {title}
      </Typography>
      {children}
    </Box>
  );
}
