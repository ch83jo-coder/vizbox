"use client";

import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import AssetChart from "./AssetChart";
import Assumptions from "./Assumptions";
import Inputs from "./Inputs";
import Results from "./Results";
import ScenarioComparison from "./ScenarioComparison";
import SimulatorActions from "./SimulatorActions";
import { useSimulator } from "./useSimulator";

export default function Simulator() {
  const simulator = useSimulator();
  const { form, values, scenarios, mode } = simulator;
  const base = scenarios?.find((s) => s.id === "base");

  return (
    <>
      <Grid container spacing={{ xs: 3, md: 4 }}>
        <Grid size={{ xs: 12, md: 5 }}>
          <Inputs register={form.register} errors={form.formState.errors} />
        </Grid>
        <Grid size={{ xs: 12, md: 7 }}>
          <Box>
            <Results
              scenarios={scenarios}
              values={values}
              issues={simulator.issues}
              mode={mode}
              onModeChange={simulator.setMode}
            />
            <SimulatorActions
              canAct={values !== null}
              savedAt={simulator.savedAt}
              notice={simulator.notice}
              onDismissNotice={simulator.dismissNotice}
              onSave={simulator.save}
              onReset={simulator.resetAll}
              createShareUrl={simulator.createShareUrl}
              onExportImage={simulator.exportImage}
            />
          </Box>
        </Grid>
        {scenarios && values && (
          <>
            <Grid size={12}>
              <AssetChart
                scenarios={scenarios}
                currentAge={values.currentAge}
                targetAge={values.targetRetirementAge}
                endAge={values.projectionEndAge}
                mode={mode}
              />
            </Grid>
            <Grid size={12}>
              <ScenarioComparison
                scenarios={scenarios}
                currentAge={values.currentAge}
                endAge={values.projectionEndAge}
                mode={mode}
              />
            </Grid>
          </>
        )}
        <Grid size={12}>
          <Assumptions
            realReturn={base?.projection.realReturnDisplay ?? null}
          />
        </Grid>
      </Grid>
      <output className="visually-hidden" aria-live="polite">
        {simulator.liveSummary}
      </output>
    </>
  );
}
