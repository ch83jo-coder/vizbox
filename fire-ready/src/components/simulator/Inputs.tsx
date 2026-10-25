"use client";

import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import InputAdornment from "@mui/material/InputAdornment";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import type { FieldErrors, UseFormRegister } from "react-hook-form";
import type { SimulatorFormInput } from "@/lib/fire/schema";
import { FIELD_GROUPS } from "./fields";

type InputsProps = {
  register: UseFormRegister<SimulatorFormInput>;
  errors: FieldErrors<SimulatorFormInput>;
};

export default function Inputs({ register, errors }: InputsProps) {
  return (
    <Paper
      component="form"
      noValidate
      onSubmit={(event) => event.preventDefault()}
      aria-labelledby="simulator-inputs-title"
      sx={{ p: { xs: 2.5, sm: 3.5 }, border: 1, borderColor: "divider" }}
    >
      <Typography variant="h3" component="h3" id="simulator-inputs-title">
        条件を入力
      </Typography>
      <Typography variant="body2" sx={{ mt: 0.5, color: "text.secondary" }}>
        金額は万円、率は%で入力します。入力に合わせて結果がすぐに変わります。
      </Typography>

      {FIELD_GROUPS.map((group, index) => {
        const descriptionId = group.description
          ? `field-group-${index}-description`
          : undefined;
        return (
          <Box
            component="fieldset"
            key={group.title}
            aria-describedby={descriptionId}
            sx={{ m: 0, mt: 3.5, p: 0, border: 0, minWidth: 0 }}
          >
            <Typography component="legend" variant="h4" sx={{ p: 0, mb: 1 }}>
              {group.title}
            </Typography>
            {group.description && (
              <Typography
                id={descriptionId}
                variant="body2"
                sx={{ mb: 2, color: "text.secondary", fontSize: 13 }}
              >
                {group.description}
              </Typography>
            )}
            <Grid
              container
              spacing={2}
              sx={{ mt: group.description ? 0 : 1.5 }}
            >
              {group.fields.map((field) => {
                const { ref, ...registration } = register(field.name, {
                  deps: field.deps,
                });
                const error = errors[field.name]?.message;
                return (
                  <Grid key={field.name} size={{ xs: 12, sm: field.smSize }}>
                    <TextField
                      {...registration}
                      inputRef={ref}
                      id={`field-${field.name}`}
                      label={field.label}
                      fullWidth
                      error={Boolean(error)}
                      helperText={error ?? field.help}
                      slotProps={{
                        inputLabel: { shrink: true },
                        htmlInput: {
                          inputMode: field.allowNegative
                            ? "text"
                            : field.unit === "歳"
                              ? "numeric"
                              : "decimal",
                          autoComplete: "off",
                        },
                        input: {
                          endAdornment: (
                            <InputAdornment position="end">
                              {field.unit}
                            </InputAdornment>
                          ),
                        },
                      }}
                    />
                  </Grid>
                );
              })}
            </Grid>
          </Box>
        );
      })}
    </Paper>
  );
}
