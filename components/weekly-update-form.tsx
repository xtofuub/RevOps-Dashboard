"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDaysIcon,
  DatabaseIcon,
  RefreshCwIcon,
  SaveIcon,
  Trash2Icon,
} from "lucide-react";
import { toast } from "sonner";

import {
  KPI_FORM_SECTIONS,
  calculatePipelineVelocity,
  NUMERIC_FIELD_DEFINITIONS,
  formatMetricByKey,
  formatWeekLabelWithYear,
  normalizeStageMetrics,
  type NumericMetricKey,
  type StageName,
  type WeeklySnapshot,
  type WeeklySnapshotPayload,
} from "@/lib/kpi-dashboard";
import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type WeeklyUpdateFormProps = {
  latestSnapshot: WeeklySnapshot | null;
  snapshots: WeeklySnapshot[];
  suggestedWeekOf: string;
};

type FormStageMetric = {
  stage: StageName;
  conversionPct: string;
  avgDaysInStage: string;
};

type WeeklyFormState = Record<NumericMetricKey, string> & {
  weekOf: string;
  lossReasonsTop3: string[];
  repeatedRequestsText: string;
  stageMetrics: FormStageMetric[];
};

const blankNumericState = Object.fromEntries(
  NUMERIC_FIELD_DEFINITIONS.map((field) => [field.key, ""]),
) as Record<NumericMetricKey, string>;

function parseOptionalNumberInput(value: string) {
  const parsedValue = Number(value.trim());
  return Number.isFinite(parsedValue) ? parsedValue : null;
}

function syncDerivedMetrics(
  formState: WeeklyFormState,
  snapshots: WeeklySnapshot[],
): WeeklyFormState {
  const pipelineValue = parseOptionalNumberInput(formState.pipelineValue);
  const salesCycleDays = parseOptionalNumberInput(formState.salesCycleDays);
  const ordersWon = parseOptionalNumberInput(formState.ordersWon);
  const proposalsSent = parseOptionalNumberInput(formState.proposalsSent);

  // Auto-calculate close rate from orders won / proposals sent
  const derivedCloseRatePct =
    ordersWon !== null && proposalsSent !== null && proposalsSent > 0
      ? Math.min(100, (ordersWon / proposalsSent) * 100)
      : null;

  const closeRatePct =
    derivedCloseRatePct !== null
      ? derivedCloseRatePct
      : parseOptionalNumberInput(formState.closeRatePct);

  const updatedState: WeeklyFormState = {
    ...formState,
    ...(derivedCloseRatePct !== null
      ? { closeRatePct: String(Math.round(derivedCloseRatePct * 10) / 10) }
      : {}),
  };

  if (
    pipelineValue === null ||
    salesCycleDays === null ||
    closeRatePct === null ||
    salesCycleDays <= 0
  ) {
    return {
      ...updatedState,
      pipelineVelocity: "",
    };
  }

  return {
    ...updatedState,
    pipelineVelocity: String(
      calculatePipelineVelocity(
        {
          pipelineValue,
          salesCycleDays,
          closeRatePct,
        },
        snapshots,
      ),
    ),
  };
}

function buildFormState(
  snapshot: WeeklySnapshot | null,
  weekOf: string,
  snapshots: WeeklySnapshot[],
): WeeklyFormState {
  const stageMetrics = normalizeStageMetrics(snapshot?.stageMetrics ?? []).map(
    (metric) => ({
      stage: metric.stage,
      conversionPct:
        snapshot === null ? "" : String(metric.conversionPct),
      avgDaysInStage:
        snapshot === null ? "" : String(metric.avgDaysInStage),
    }),
  );

  return syncDerivedMetrics(
    {
      ...blankNumericState,
      ...(snapshot
        ? Object.fromEntries(
            NUMERIC_FIELD_DEFINITIONS.map((field) => [
              field.key,
              String(snapshot[field.key]),
            ]),
          )
        : {}),
      weekOf,
      lossReasonsTop3:
        snapshot?.lossReasonsTop3.slice(0, 3) ?? ["", "", ""],
      repeatedRequestsText: snapshot?.repeatedRequests.join("\n") ?? "",
      stageMetrics,
    },
    snapshots,
  );
}

function parseNumberInput(value: string) {
  return Number(value.trim());
}

function extractLines(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function toPayload(
  formState: WeeklyFormState,
  snapshots: WeeklySnapshot[],
): WeeklySnapshotPayload {
  const numericValues = Object.fromEntries(
    NUMERIC_FIELD_DEFINITIONS.map((field) => [
      field.key,
      parseNumberInput(formState[field.key]),
    ]),
  ) as Record<NumericMetricKey, number>;

  return {
    weekOf: formState.weekOf,
    ...numericValues,
    pipelineVelocity: calculatePipelineVelocity(
      {
        pipelineValue: numericValues.pipelineValue,
        salesCycleDays: numericValues.salesCycleDays,
        closeRatePct: numericValues.closeRatePct,
      },
      snapshots,
    ),
    lossReasonsTop3: formState.lossReasonsTop3.map((reason) => reason.trim()),
    repeatedRequests: extractLines(formState.repeatedRequestsText),
    stageMetrics: formState.stageMetrics.map((metric) => ({
      stage: metric.stage,
      conversionPct: parseNumberInput(metric.conversionPct),
      avgDaysInStage: parseNumberInput(metric.avgDaysInStage),
    })),
  } as WeeklySnapshotPayload;
}

function findGroupError(errors: Record<string, string>, prefix: string) {
  const match = Object.entries(errors).find(
    ([key]) => key === prefix || key.startsWith(`${prefix}.`),
  );

  return match?.[1];
}

export function WeeklyUpdateForm({
  latestSnapshot,
  snapshots,
  suggestedWeekOf,
}: WeeklyUpdateFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isRefreshing, startTransition] = React.useTransition();
  const [templateSelection, setTemplateSelection] =
    React.useState("today");
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>(
    {},
  );
  const [formState, setFormState] = React.useState<WeeklyFormState>(() =>
    buildFormState(latestSnapshot, suggestedWeekOf, snapshots),
  );
  const [deletingWeekOf, setDeletingWeekOf] = React.useState<string | null>(null);

  React.useEffect(() => {
    setTemplateSelection("today");
    setFieldErrors({});
    setFormState(buildFormState(latestSnapshot, suggestedWeekOf, snapshots));
  }, [latestSnapshot, snapshots, suggestedWeekOf]);

  const currentStoredSnapshot =
    snapshots.find((snapshot) => snapshot.weekOf === formState.weekOf) ?? null;
  const isSaving = isSubmitting || isRefreshing;

  const isCloseRateAutoCalc =
    parseOptionalNumberInput(formState.proposalsSent) !== null &&
    (parseOptionalNumberInput(formState.proposalsSent) ?? 0) > 0 &&
    parseOptionalNumberInput(formState.ordersWon) !== null;

  async function handleDeleteSnapshot(weekOf: string) {
    setDeletingWeekOf(weekOf);
    try {
      const response = await fetch(`/api/weekly-snapshots?weekOf=${encodeURIComponent(weekOf)}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const body = await response.json();
        toast.error(body.message ?? "Failed to delete snapshot.");
        return;
      }

      toast.success(`Deleted snapshot for week ending ${formatWeekLabelWithYear(weekOf)}.`);

      if (formState.weekOf === weekOf) {
        startTransition(() => {
          router.refresh();
        });
      } else {
        startTransition(() => {
          router.refresh();
        });
      }
    } catch (error) {
      console.error("Failed to delete weekly snapshot", error);
      toast.error("The weekly snapshot could not be deleted.");
    } finally {
      setDeletingWeekOf(null);
    }
  }

  function updateNumericField(key: NumericMetricKey, value: string) {
    setFormState((currentState) =>
      syncDerivedMetrics(
        {
          ...currentState,
          [key]: value,
        },
        snapshots,
      ),
    );
  }

  function updateLossReason(index: number, value: string) {
    setFormState((currentState) => ({
      ...currentState,
      lossReasonsTop3: currentState.lossReasonsTop3.map((reason, reasonIndex) =>
        reasonIndex === index ? value : reason,
      ),
    }));
  }

  function updateStageMetric(
    index: number,
    key: "conversionPct" | "avgDaysInStage",
    value: string,
  ) {
    setFormState((currentState) => ({
      ...currentState,
      stageMetrics: currentState.stageMetrics.map((metric, metricIndex) =>
        metricIndex === index ? { ...metric, [key]: value } : metric,
      ),
    }));
  }

  function loadTemplate(selection: string) {
    setTemplateSelection(selection);
    setFieldErrors({});

    if (selection === "today") {
      setFormState(buildFormState(latestSnapshot, suggestedWeekOf, snapshots));
      return;
    }

    const selectedSnapshot =
      snapshots.find((snapshot) => snapshot.weekOf === selection) ?? null;

    setFormState(buildFormState(selectedSnapshot, selection, snapshots));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setFieldErrors({});

    try {
      const response = await fetch("/api/weekly-snapshots", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(toPayload(formState, snapshots)),
      });

      const body = await response.json();

      if (!response.ok) {
        setFieldErrors(body.errors ?? {});
        toast.error(
          body.message ?? "Please review the weekly snapshot before saving.",
        );
        return;
      }

      toast.success(
        currentStoredSnapshot
          ? `Updated the snapshot for week ending ${formatWeekLabelWithYear(formState.weekOf)}.`
          : `Saved a new weekly snapshot for week ending ${formatWeekLabelWithYear(formState.weekOf)}.`,
      );

      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      console.error("Failed to save the weekly snapshot", error);
      toast.error("The weekly snapshot could not be saved.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="border-border/60 bg-card/90 shadow-sm backdrop-blur">
      <CardHeader className="gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <CardTitle>Weekly update</CardTitle>
            <CardDescription>
              Push the full KPI snapshot for any reporting date. Saving the
              same date again creates a new revision so the prior version stays
              in history.
            </CardDescription>
          </div>
          <Badge variant="outline">
            <CalendarDaysIcon data-icon="inline-start" />
            Date-based history
          </Badge>
        </div>
        <Alert>
          <DatabaseIcon />
          <AlertTitle>
            {currentStoredSnapshot
              ? `${formatWeekLabelWithYear(formState.weekOf)} already exists`
              : `You are creating ${formatWeekLabelWithYear(formState.weekOf)}`}
          </AlertTitle>
          <AlertDescription>
            {currentStoredSnapshot
              ? "Saving now will create a fresh revision for this reporting week while keeping earlier saved versions available."
              : "Saving now will append a new weekly snapshot to the local dashboard history."}
          </AlertDescription>
          <AlertAction>
            <Badge variant="outline">
              {currentStoredSnapshot ? "New revision" : "Create"}
            </Badge>
          </AlertAction>
        </Alert>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="flex flex-col gap-6">
          <FieldGroup>
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
              <Field data-invalid={Boolean(fieldErrors.weekOf)}>
                <FieldLabel htmlFor="weekOf">Week ending date</FieldLabel>
                <FieldContent>
                  <Input
                    id="weekOf"
                    type="date"
                    value={formState.weekOf}
                    aria-invalid={Boolean(fieldErrors.weekOf)}
                    onChange={(event) =>
                      setFormState((currentState) => ({
                        ...currentState,
                        weekOf: event.target.value,
                      }))
                    }
                  />
                  <FieldDescription>
                    Defaults to today. Any date is valid.
                  </FieldDescription>
                  <FieldError>{fieldErrors.weekOf}</FieldError>
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel>Load from saved week</FieldLabel>
                <FieldContent>
                  <Select
                    value={templateSelection}
                    onValueChange={(value) => {
                      if (value !== null) {
                        loadTemplate(value);
                      }
                    }}
                  >
                    <SelectTrigger aria-label="Load a saved weekly template">
                      <SelectValue placeholder="Choose a source" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Starting point</SelectLabel>
                        <SelectItem value="today">
                          Today&apos;s date
                        </SelectItem>
                        {[...snapshots]
                          .sort((left, right) =>
                            right.weekOf.localeCompare(left.weekOf),
                          )
                          .map((snapshot) => (
                            <SelectItem
                              key={snapshot.weekOf}
                              value={snapshot.weekOf}
                            >
                              {formatWeekLabelWithYear(snapshot.weekOf)}
                            </SelectItem>
                          ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <FieldDescription>
                    Load an existing date to edit it, or start fresh from
                    today&apos;s date.
                  </FieldDescription>
                </FieldContent>
              </Field>

              <div className="flex items-end">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full lg:w-auto"
                  onClick={() => loadTemplate("today")}
                >
                  <RefreshCwIcon data-icon="inline-start" />
                  Use latest template
                </Button>
              </div>
            </div>
          </FieldGroup>

          {KPI_FORM_SECTIONS.map((section) => (
            <Card
              key={section.id}
              className="border-border/60 bg-background/70 shadow-none"
            >
              <CardHeader className="gap-1.5">
                <CardTitle className="text-base">{section.title}</CardTitle>
                <CardDescription>{section.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-6">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {section.fields.map((field) => {
                    const isAutoCalc =
                      field.key === "pipelineVelocity" ||
                      (field.key === "closeRatePct" && isCloseRateAutoCalc);

                    return (
                      <Field
                        key={field.key}
                        data-invalid={Boolean(fieldErrors[field.key])}
                        data-disabled={isAutoCalc}
                      >
                        <FieldLabel htmlFor={field.key}>{field.label}</FieldLabel>
                        <FieldContent>
                          <Input
                            id={field.key}
                            type="number"
                            inputMode="decimal"
                            min={field.min}
                            max={field.max}
                            step={field.step}
                            value={formState[field.key]}
                            disabled={isAutoCalc}
                            aria-invalid={Boolean(fieldErrors[field.key])}
                            onChange={(event) =>
                              updateNumericField(field.key, event.target.value)
                            }
                          />
                          <FieldDescription>
                            {field.key === "pipelineVelocity"
                              ? "Calculated automatically from saved history using pipeline value, close rate, and sales cycle."
                              : field.key === "closeRatePct"
                                ? isCloseRateAutoCalc
                                  ? "Calculated automatically from orders won ÷ proposals sent."
                                  : "Win rate. Auto-fills when proposals sent and orders won are both entered."
                                : field.description}
                          </FieldDescription>
                          <FieldError>{fieldErrors[field.key]}</FieldError>
                        </FieldContent>
                      </Field>
                    );
                  })}
                </div>

                {section.id === "revenue-engine" ? (
                  <>
                    <FieldSeparator>Stage flow</FieldSeparator>
                    <FieldSet>
                      <FieldLegend>Stage conversion and time in stage</FieldLegend>
                      <div className="grid gap-4 lg:grid-cols-2">
                        {formState.stageMetrics.map((metric, index) => (
                          <div
                            key={metric.stage}
                            className="grid gap-4 rounded-xl border border-border/60 bg-card p-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"
                          >
                            <div className="flex flex-col gap-1">
                              <div className="text-sm font-medium">
                                {metric.stage}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Latest saved:{" "}
                                {latestSnapshot
                                  ? `${formatMetricByKey(
                                      "closeRatePct",
                                      latestSnapshot.stageMetrics[index]?.conversionPct ?? 0,
                                    )} / ${latestSnapshot.stageMetrics[
                                      index
                                    ]?.avgDaysInStage.toFixed(1)} days`
                                  : "No history yet"}
                              </div>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                              <Field
                                data-invalid={Boolean(
                                  fieldErrors[`stageMetrics.${index}.conversionPct`],
                                )}
                              >
                                <FieldLabel htmlFor={`${metric.stage}-conversion`}>
                                  Conversion %
                                </FieldLabel>
                                <FieldContent>
                                  <Input
                                    id={`${metric.stage}-conversion`}
                                    type="number"
                                    inputMode="decimal"
                                    min={0}
                                    max={100}
                                    step={0.1}
                                    value={metric.conversionPct}
                                    aria-invalid={Boolean(
                                      fieldErrors[`stageMetrics.${index}.conversionPct`],
                                    )}
                                    onChange={(event) =>
                                      updateStageMetric(
                                        index,
                                        "conversionPct",
                                        event.target.value,
                                      )
                                    }
                                  />
                                </FieldContent>
                              </Field>
                              <Field
                                data-invalid={Boolean(
                                  fieldErrors[`stageMetrics.${index}.avgDaysInStage`],
                                )}
                              >
                                <FieldLabel htmlFor={`${metric.stage}-days`}>
                                  Avg days
                                </FieldLabel>
                                <FieldContent>
                                  <Input
                                    id={`${metric.stage}-days`}
                                    type="number"
                                    inputMode="decimal"
                                    min={0}
                                    max={365}
                                    step={0.1}
                                    value={metric.avgDaysInStage}
                                    aria-invalid={Boolean(
                                      fieldErrors[`stageMetrics.${index}.avgDaysInStage`],
                                    )}
                                    onChange={(event) =>
                                      updateStageMetric(
                                        index,
                                        "avgDaysInStage",
                                        event.target.value,
                                      )
                                    }
                                  />
                                </FieldContent>
                              </Field>
                            </div>
                          </div>
                        ))}
                      </div>
                      <FieldError>{findGroupError(fieldErrors, "stageMetrics")}</FieldError>
                    </FieldSet>
                  </>
                ) : null}

                {section.id === "product-market-signal" ? (
                  <>
                    <FieldSeparator>Voice of customer</FieldSeparator>
                    <FieldSet>
                      <FieldLegend>Why deals are lost (top 3)</FieldLegend>
                      <div className="grid gap-4 md:grid-cols-3">
                        {formState.lossReasonsTop3.map((reason, index) => (
                          <Field
                            key={`loss-reason-${index}`}
                            data-invalid={Boolean(
                              fieldErrors[`lossReasonsTop3.${index}`],
                            )}
                          >
                            <FieldLabel htmlFor={`lossReason-${index + 1}`}>
                              Reason {index + 1}
                            </FieldLabel>
                            <FieldContent>
                              <Input
                                id={`lossReason-${index + 1}`}
                                value={reason}
                                aria-invalid={Boolean(
                                  fieldErrors[`lossReasonsTop3.${index}`],
                                )}
                                onChange={(event) =>
                                  updateLossReason(index, event.target.value)
                                }
                              />
                              <FieldError>
                                {fieldErrors[`lossReasonsTop3.${index}`]}
                              </FieldError>
                            </FieldContent>
                          </Field>
                        ))}
                      </div>
                      <FieldDescription>
                        Capture the most common reasons deals were lost this
                        week.
                      </FieldDescription>
                    </FieldSet>

                    <FieldSet>
                      <FieldLegend>What customers repeatedly ask for</FieldLegend>
                      <Field
                        data-invalid={Boolean(fieldErrors.repeatedRequests)}
                      >
                        <FieldLabel htmlFor="repeatedRequests">
                          One request per line
                        </FieldLabel>
                        <FieldContent>
                          <Textarea
                            id="repeatedRequests"
                            rows={5}
                            value={formState.repeatedRequestsText}
                            aria-invalid={Boolean(fieldErrors.repeatedRequests)}
                            onChange={(event) =>
                              setFormState((currentState) => ({
                                ...currentState,
                                repeatedRequestsText: event.target.value,
                              }))
                            }
                          />
                          <FieldDescription>
                            Add the recurring asks you want to track this week,
                            up to six lines.
                          </FieldDescription>
                          <FieldError>{fieldErrors.repeatedRequests}</FieldError>
                        </FieldContent>
                      </Field>
                    </FieldSet>
                  </>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </CardContent>

        <CardFooter className="flex flex-wrap items-center justify-end gap-3 border-t border-border/60 bg-muted/20">
          <div className="mr-auto text-sm text-muted-foreground">
            Values are validated on save and stored in durable weekly history
            with immutable revisions.
          </div>
          {currentStoredSnapshot ? (
            <Dialog>
              <DialogTrigger render={
                <Button
                  variant="outline"
                  size="sm"
                  className="border-destructive/50 text-destructive hover:bg-destructive/10 hover:border-destructive"
                  disabled={isSaving}
                >
                  <Trash2Icon data-icon="inline-start" className="size-3.5" />
                  Delete
                </Button>
              } />
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Delete snapshot?</DialogTitle>
                  <DialogDescription>
                    This will permanently delete the snapshot for{" "}
                    <span className="font-medium text-foreground">
                      {formatWeekLabelWithYear(currentStoredSnapshot.weekOf)}
                    </span>
                    . This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter showCloseButton>
                  <Button
                    variant="outline"
                    className="border-destructive/50 text-destructive hover:bg-destructive/10"
                    onClick={() => handleDeleteSnapshot(currentStoredSnapshot.weekOf)}
                    disabled={deletingWeekOf === currentStoredSnapshot.weekOf || isSaving}
                  >
                    {deletingWeekOf === currentStoredSnapshot.weekOf ? "Deleting..." : "Delete snapshot"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          ) : null}
          <Button type="submit" disabled={isSaving}>
            <SaveIcon data-icon="inline-start" />
            {isSaving ? "Saving..." : "Save snapshot"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
