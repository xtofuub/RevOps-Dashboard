"use client";

import * as React from "react";
import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
} from "recharts";
import {
  ActivityIcon,
  ArrowDownRightIcon,
  ArrowUpRightIcon,
  ChartBarIcon,
  DatabaseIcon,
  FileTextIcon,
  LayoutDashboardIcon,
  ListIcon,
  ShieldCheckIcon,
  TriangleAlertIcon,
} from "lucide-react";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { WeeklyUpdateForm } from "@/components/weekly-update-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Progress, ProgressLabel } from "@/components/ui/progress";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DASHBOARD_TABS,
  formatMetricByKey,
  formatMetricDelta,
  formatMetricValue,
  formatWeekLabelWithYear,
  metricFieldMap,
  type RankedTextItem,
  type DashboardData,
  type DashboardTab,
  type NumericMetricKey,
  type WeeklySnapshot,
} from "@/lib/kpi-dashboard";

type DashboardWorkspaceProps = {
  snapshots: WeeklySnapshot[];
  dashboard: DashboardData;
};

const tabIconMap: Record<DashboardTab, React.ComponentType> = {
  overview: LayoutDashboardIcon,
  "revenue-engine": ChartBarIcon,
  "product-market-signal": ListIcon,
  "delivery-stability": DatabaseIcon,
  "weekly-update": FileTextIcon,
};

const summaryMetricIcons: Partial<
  Record<NumericMetricKey, React.ComponentType>
> = {
  pipelineValue: ChartBarIcon,
  closeRatePct: ActivityIcon,
  netRevenueRetentionPct: ShieldCheckIcon,
  feedSlaQualityScore: DatabaseIcon,
  newCustomersPerMonth: LayoutDashboardIcon,
  pipelineCoverageRatio: ActivityIcon,
  averageDealSize: ChartBarIcon,
  customerAcquisitionCost: TriangleAlertIcon,
  feedRetentionPct: ShieldCheckIcon,
  grossRevenueRetentionPct: ShieldCheckIcon,
  proposalsSent: FileTextIcon,
  ordersWon: ActivityIcon,
  incidentCount: TriangleAlertIcon,
};

const pipelineMomentumConfig = {
  pipelineValue: {
    label: "Pipeline value",
    color: "var(--chart-1)",
  },
  pipelineVelocity: {
    label: "Pipeline velocity",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

const conversionConfig = {
  marketingSourcedPipelinePct: {
    label: "Marketing-sourced pipeline",
    color: "var(--chart-1)",
  },
  leadToOpportunityConversionPct: {
    label: "Lead to opportunity",
    color: "var(--chart-2)",
  },
  closeRatePct: {
    label: "Close rate",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig;

const retentionConfig = {
  feedRetentionPct: {
    label: "Feed retention",
    color: "var(--chart-1)",
  },
  netRevenueRetentionPct: {
    label: "NRR",
    color: "var(--chart-2)",
  },
  grossRevenueRetentionPct: {
    label: "GRR",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig;

const deliveryVolumeConfig = {
  proposalsSent: {
    label: "Proposals sent",
    color: "var(--chart-1)",
  },
  ordersWon: {
    label: "Orders won",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

const deliveryReliabilityConfig = {
  feedSlaQualityScore: {
    label: "Feed SLA",
    color: "var(--chart-1)",
  },
  incidentCount: {
    label: "Incident count",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig;

const overviewMetricKeys: NumericMetricKey[] = [
  "pipelineValue",
  "closeRatePct",
  "netRevenueRetentionPct",
  "feedSlaQualityScore",
];

const revenueMetricKeys: NumericMetricKey[] = [
  "newCustomersPerMonth",
  "pipelineCoverageRatio",
  "averageDealSize",
  "customerAcquisitionCost",
];

const productMetricKeys: NumericMetricKey[] = [
  "feedRetentionPct",
  "netRevenueRetentionPct",
  "grossRevenueRetentionPct",
];

const deliveryMetricKeys: NumericMetricKey[] = [
  "proposalsSent",
  "ordersWon",
  "feedSlaQualityScore",
  "incidentCount",
];

export function DashboardWorkspace({
  snapshots,
  dashboard,
}: DashboardWorkspaceProps) {
  const [activeTab, setActiveTab] = React.useState<DashboardTab>("overview");
  const activeTabMeta =
    DASHBOARD_TABS.find((tab) => tab.id === activeTab) ?? DASHBOARD_TABS[0];
  const latestSnapshot = dashboard.latestSnapshot;
  const previousSnapshot = dashboard.previousSnapshot;
  const hasData = Boolean(latestSnapshot);

  const summarySentence = latestSnapshot
    ? `Week ending ${formatWeekLabelWithYear(
        latestSnapshot.weekOf,
      )} closed at ${formatMetricByKey(
        "closeRatePct",
        latestSnapshot.closeRatePct,
      )}, ${formatMetricByKey(
        "pipelineCoverageRatio",
        latestSnapshot.pipelineCoverageRatio,
      )} coverage, and ${formatMetricByKey(
        "feedRetentionPct",
        latestSnapshot.feedRetentionPct,
      )} feed retention.`
    : "No weekly snapshots have been saved yet.";

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "18rem",
          "--header-height": "4.25rem",
        } as React.CSSProperties
      }
      className="min-h-svh bg-transparent"
    >
      <AppSidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        dashboard={dashboard}
      />
      <SidebarInset className="min-h-svh overflow-hidden border border-border bg-background">
        <SiteHeader
          activeTab={activeTab}
          onTabChange={setActiveTab}
          lastUpdatedLabel={dashboard.lastUpdatedLabel}
          totalWeeks={dashboard.totalWeeks}
        />

        <Tabs
          value={activeTab}
          onValueChange={(value) => {
            if (value !== null) {
              setActiveTab(value as DashboardTab);
            }
          }}
          className="@container/main flex flex-1 flex-col gap-0"
        >
          <div className="sticky top-0 z-20 border-b border-border bg-background px-4 py-4 lg:px-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex max-w-2xl flex-col gap-1">
                <h2 className="font-heading text-xl font-semibold tracking-tight">
                  {activeTabMeta.label}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {activeTabMeta.description}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">
                  {dashboard.totalWeeks} weekly snapshots
                </Badge>
                {dashboard.lastUpdatedLabel ? (
                  <Badge variant="outline">
                    Updated {dashboard.lastUpdatedLabel}
                  </Badge>
                ) : null}
              </div>
            </div>
            <div className="mt-4 overflow-x-auto">
              <TabsList variant="line" className="gap-3 bg-transparent p-0">
                {DASHBOARD_TABS.map((tab) => {
                  const Icon = tabIconMap[tab.id];

                  return (
                    <TabsTrigger key={tab.id} value={tab.id}>
                      <Icon data-icon="inline-start" />
                      {tab.label}
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </div>
          </div>

          <div className="flex flex-1 flex-col overflow-y-auto px-4 py-5 lg:px-6 lg:py-6">
            <TabsContent value="overview" className="flex flex-col gap-6">
              {hasData ? (
                <>
                  <Card className="border-border bg-card shadow-none">
                    <CardHeader className="gap-3">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex flex-col gap-1">
                          <CardTitle>Operating signal</CardTitle>
                          <CardDescription>{summarySentence}</CardDescription>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Week ending {formatWeekLabelWithYear(latestSnapshot!.weekOf)}
                        </div>
                      </div>
                    </CardHeader>
                  </Card>

                  <OverviewSection dashboard={dashboard} />

                  <MetricCardGrid
                    metricKeys={overviewMetricKeys}
                    latestSnapshot={latestSnapshot!}
                    previousSnapshot={previousSnapshot}
                  />
                </>
              ) : (
                <EmptyDashboardState onOpenWeeklyUpdate={() => setActiveTab("weekly-update")} />
              )}
            </TabsContent>

            <TabsContent value="revenue-engine" className="flex flex-col gap-6">
              {hasData ? (
                <>
                  <MetricCardGrid
                    metricKeys={revenueMetricKeys}
                    latestSnapshot={latestSnapshot!}
                    previousSnapshot={previousSnapshot}
                  />
                  <RevenueSection dashboard={dashboard} />
                </>
              ) : (
                <EmptyDashboardState onOpenWeeklyUpdate={() => setActiveTab("weekly-update")} />
              )}
            </TabsContent>

            <TabsContent
              value="product-market-signal"
              className="flex flex-col gap-6"
            >
              {hasData ? (
                <>
                  <MetricCardGrid
                    metricKeys={productMetricKeys}
                    latestSnapshot={latestSnapshot!}
                    previousSnapshot={previousSnapshot}
                  />
                  <ProductSignalSection dashboard={dashboard} />
                </>
              ) : (
                <EmptyDashboardState onOpenWeeklyUpdate={() => setActiveTab("weekly-update")} />
              )}
            </TabsContent>

            <TabsContent value="delivery-stability" className="flex flex-col gap-6">
              {hasData ? (
                <>
                  <MetricCardGrid
                    metricKeys={deliveryMetricKeys}
                    latestSnapshot={latestSnapshot!}
                    previousSnapshot={previousSnapshot}
                  />
                  <DeliverySection dashboard={dashboard} />
                </>
              ) : (
                <EmptyDashboardState onOpenWeeklyUpdate={() => setActiveTab("weekly-update")} />
              )}
            </TabsContent>

            <TabsContent value="weekly-update" className="flex flex-col gap-6">
              <WeeklyUpdateSection dashboard={dashboard} snapshots={snapshots} />
            </TabsContent>
          </div>
        </Tabs>
      </SidebarInset>
    </SidebarProvider>
  );
}

function EmptyDashboardState({
  onOpenWeeklyUpdate,
}: {
  onOpenWeeklyUpdate: () => void;
}) {
  return (
    <Card className="border-border bg-card shadow-none">
      <CardContent className="p-6">
        <Empty className="min-h-[22rem] border border-dashed border-border bg-background">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <LayoutDashboardIcon />
            </EmptyMedia>
            <EmptyTitle>No weekly history yet</EmptyTitle>
            <EmptyDescription>
              Save the first weekly snapshot to unlock trends, ranked signals,
              and delivery monitoring.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <button
              type="button"
              className="inline-flex h-8 items-center justify-center rounded-lg border border-border bg-background px-3 text-sm font-medium shadow-sm transition-colors hover:bg-muted"
              onClick={onOpenWeeklyUpdate}
            >
              Open weekly update
            </button>
          </EmptyContent>
        </Empty>
      </CardContent>
    </Card>
  );
}

function MetricCardGrid({
  metricKeys,
  latestSnapshot,
  previousSnapshot,
}: {
  metricKeys: NumericMetricKey[];
  latestSnapshot: WeeklySnapshot;
  previousSnapshot: WeeklySnapshot | null;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {metricKeys.map((key) => (
        <MetricCard
          key={key}
          metricKey={key}
          latestSnapshot={latestSnapshot}
          previousSnapshot={previousSnapshot}
        />
      ))}
    </div>
  );
}

function MetricCard({
  metricKey,
  latestSnapshot,
  previousSnapshot,
}: {
  metricKey: NumericMetricKey;
  latestSnapshot: WeeklySnapshot;
  previousSnapshot: WeeklySnapshot | null;
}) {
  const field = metricFieldMap[metricKey];
  const Icon = summaryMetricIcons[metricKey] ?? ActivityIcon;
  const latestValue = latestSnapshot[metricKey];
  const previousValue = previousSnapshot?.[metricKey] ?? null;
  const delta = previousValue === null ? null : latestValue - previousValue;
  const DeltaIcon =
    delta === null || delta === 0
      ? null
      : delta > 0
        ? ArrowUpRightIcon
        : ArrowDownRightIcon;

  return (
    <Card className="border-border bg-card shadow-none">
      <CardHeader className="gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-muted">
              <Icon />
            </div>
            <div className="min-w-0">
              <CardDescription>{field.shortLabel}</CardDescription>
              <CardTitle className="mt-1 text-xl">
                {formatMetricByKey(metricKey, latestValue)}
              </CardTitle>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-sm text-muted-foreground">{field.description}</p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {DeltaIcon ? <DeltaIcon className="size-4" /> : null}
            <span>{formatMetricDelta(metricKey, latestValue, previousValue)}</span>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}

function OverviewSection({ dashboard }: { dashboard: DashboardData }) {
  const hasAlerts = dashboard.healthAlerts.length > 0;

  return (
    <div
      className={
        hasAlerts
          ? "grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(18rem,0.95fr)]"
          : "grid gap-4"
      }
    >
      <PipelineMomentumCard timeline={dashboard.timeline} compact />
      {hasAlerts ? (
        <div className="flex flex-col gap-3">
          {dashboard.healthAlerts.map((alert) => (
            <Alert key={alert.id} variant={alert.variant}>
              <TriangleAlertIcon />
              <AlertTitle>{alert.title}</AlertTitle>
              <AlertDescription>{alert.description}</AlertDescription>
            </Alert>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function RevenueSection({ dashboard }: { dashboard: DashboardData }) {
  return (
    <>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <PipelineMomentumCard timeline={dashboard.timeline} />
        <RevenueConversionCard timeline={dashboard.timeline} />
      </div>
      <StageFlowCard stageMetrics={dashboard.latestStageMetrics} />
    </>
  );
}

function ProductSignalSection({ dashboard }: { dashboard: DashboardData }) {
  return (
    <>
      <RetentionSignalCard timeline={dashboard.timeline} />
      <div className="grid gap-4 xl:grid-cols-2">
        <RankedSignalsCard
          title="Why deals are lost"
          description="Aggregated top reasons from the weekly snapshots."
          items={dashboard.lossReasonCounts}
        />
        <RankedSignalsCard
          title="What customers repeatedly ask for"
          description="Recurring asks normalized across all saved weekly updates."
          items={dashboard.repeatedRequestCounts}
        />
      </div>
    </>
  );
}

function DeliverySection({ dashboard }: { dashboard: DashboardData }) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <DeliveryVolumeCard timeline={dashboard.timeline} />
      <DeliveryReliabilityCard timeline={dashboard.timeline} />
    </div>
  );
}

function WeeklyUpdateSection({
  dashboard,
  snapshots,
}: {
  dashboard: DashboardData;
  snapshots: WeeklySnapshot[];
}) {
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_22rem]">
      <WeeklyUpdateForm
        latestSnapshot={dashboard.latestSnapshot}
        snapshots={snapshots}
        suggestedWeekOf={dashboard.suggestedWeekOf}
      />

      <div className="flex flex-col gap-4">
        <Card className="border-border bg-card shadow-none">
          <CardHeader className="gap-1.5">
            <CardTitle className="text-base">Update rules</CardTitle>
            <CardDescription>
              Keep manual entry consistent from week to week.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm text-muted-foreground">
            <p>Use one full snapshot per week-ending date.</p>
            <p>
              Re-saving the same week replaces the existing record instead of
              creating duplicates.
            </p>
            <p>
              Keep lost reasons tight and specific, and add recurring requests
              one request per line.
            </p>
          </CardContent>
        </Card>

        <RecentSnapshotsCard snapshots={snapshots} />
      </div>
    </div>
  );
}

function PipelineMomentumCard({
  timeline,
  compact = false,
}: {
  timeline: DashboardData["timeline"];
  compact?: boolean;
}) {
  return (
    <Card className="border-border bg-card shadow-none">
      <CardHeader className="gap-1.5">
        <CardTitle>Pipeline momentum</CardTitle>
        <CardDescription>
          Pipeline value and pipeline velocity across the weekly operating
          history.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-2">
        <ChartContainer
          config={pipelineMomentumConfig}
          className={compact ? "h-[280px] w-full" : "h-[340px] w-full"}
        >
          <ComposedChart data={timeline}>
            <defs>
              <linearGradient id="pipelineValueFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-pipelineValue)" stopOpacity={0.24} />
                <stop offset="95%" stopColor="var(--color-pipelineValue)" stopOpacity={0.04} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={10} />
            <YAxis
              yAxisId="left"
              tickLine={false}
              axisLine={false}
              width={72}
              tickFormatter={formatCurrencyTick}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tickLine={false}
              axisLine={false}
              width={64}
              tickFormatter={formatCurrencyTick}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(label) => `Week ending ${label}`}
                  formatter={(value, name) => (
                    <div className="flex flex-1 items-center justify-between gap-3">
                      <span className="text-muted-foreground">
                        {
                          pipelineMomentumConfig[
                            String(name) as keyof typeof pipelineMomentumConfig
                          ]?.label
                        }
                      </span>
                      <span className="font-mono font-medium text-foreground">
                        {formatMetricByKey(
                          String(name) as NumericMetricKey,
                          Number(value),
                        )}
                      </span>
                    </div>
                  )}
                  indicator="dot"
                />
              }
            />
            <ChartLegend content={<ChartLegendContent />} />
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="pipelineValue"
              stroke="var(--color-pipelineValue)"
              fill="url(#pipelineValueFill)"
              strokeWidth={2}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="pipelineVelocity"
              stroke="var(--color-pipelineVelocity)"
              strokeWidth={2.5}
              dot={false}
            />
          </ComposedChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

function RevenueConversionCard({
  timeline,
}: {
  timeline: DashboardData["timeline"];
}) {
  return (
    <Card className="border-border bg-card shadow-none">
      <CardHeader className="gap-1.5">
        <CardTitle>Funnel quality mix</CardTitle>
        <CardDescription>
          Conversion quality across sourced pipeline, lead conversion, and close
          rate.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-2">
        <ChartContainer config={conversionConfig} className="h-[340px] w-full">
          <ComposedChart data={timeline}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={10} />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={56}
              tickFormatter={(value) => `${value}%`}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(label) => `Week ending ${label}`}
                  formatter={(value, name) => (
                    <div className="flex flex-1 items-center justify-between gap-3">
                      <span className="text-muted-foreground">
                        {conversionConfig[String(name) as keyof typeof conversionConfig]?.label}
                      </span>
                      <span className="font-mono font-medium text-foreground">
                        {formatMetricByKey(
                          String(name) as NumericMetricKey,
                          Number(value),
                        )}
                      </span>
                    </div>
                  )}
                />
              }
            />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar
              dataKey="marketingSourcedPipelinePct"
              fill="var(--color-marketingSourcedPipelinePct)"
              radius={[8, 8, 0, 0]}
            />
            <Bar
              dataKey="leadToOpportunityConversionPct"
              fill="var(--color-leadToOpportunityConversionPct)"
              radius={[8, 8, 0, 0]}
            />
            <Line
              dataKey="closeRatePct"
              stroke="var(--color-closeRatePct)"
              strokeWidth={2.5}
              dot={false}
            />
          </ComposedChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

function StageFlowCard({
  stageMetrics,
}: {
  stageMetrics: DashboardData["latestStageMetrics"];
}) {
  return (
    <Card className="border-border bg-card shadow-none">
      <CardHeader className="gap-1.5">
        <CardTitle>Stage flow</CardTitle>
        <CardDescription>
          Current-stage conversion and average time in stage for the latest
          snapshot.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Stage</TableHead>
              <TableHead>Conversion</TableHead>
              <TableHead>Time in stage</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stageMetrics.map((metric) => (
              <TableRow key={metric.stage}>
                <TableCell className="font-medium">{metric.stage}</TableCell>
                <TableCell className="w-[45%] min-w-[14rem] whitespace-normal">
                  <Progress value={metric.conversionPct} className="w-full">
                    <ProgressLabel>{formatMetricValue(metric.conversionPct, "percent")}</ProgressLabel>
                    <span className="ml-auto text-sm text-muted-foreground tabular-nums">
                      {formatMetricValue(metric.conversionPct, "percent")}
                    </span>
                  </Progress>
                </TableCell>
                <TableCell>{formatMetricValue(metric.avgDaysInStage, "days")}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function RetentionSignalCard({
  timeline,
}: {
  timeline: DashboardData["timeline"];
}) {
  return (
    <Card className="border-border bg-card shadow-none">
      <CardHeader className="gap-1.5">
        <CardTitle>Retention signal</CardTitle>
        <CardDescription>
          Feed retention, net revenue retention, and gross revenue retention on
          a weekly trendline.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-2">
        <ChartContainer config={retentionConfig} className="h-[340px] w-full">
          <ComposedChart data={timeline}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={10} />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={56}
              tickFormatter={(value) => `${value}%`}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(label) => `Week ending ${label}`}
                  formatter={(value, name) => (
                    <div className="flex flex-1 items-center justify-between gap-3">
                      <span className="text-muted-foreground">
                        {retentionConfig[String(name) as keyof typeof retentionConfig]?.label}
                      </span>
                      <span className="font-mono font-medium text-foreground">
                        {formatMetricByKey(
                          String(name) as NumericMetricKey,
                          Number(value),
                        )}
                      </span>
                    </div>
                  )}
                />
              }
            />
            <ChartLegend content={<ChartLegendContent />} />
            <Line dataKey="feedRetentionPct" stroke="var(--color-feedRetentionPct)" strokeWidth={2.5} dot={false} />
            <Line dataKey="netRevenueRetentionPct" stroke="var(--color-netRevenueRetentionPct)" strokeWidth={2.5} dot={false} />
            <Line dataKey="grossRevenueRetentionPct" stroke="var(--color-grossRevenueRetentionPct)" strokeWidth={2.5} dot={false} />
          </ComposedChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

function RankedSignalsCard({
  description,
  items,
  title,
}: {
  title: string;
  description: string;
  items: RankedTextItem[];
}) {
  return (
    <Card className="border-border/60 bg-card/90 shadow-sm">
      <CardHeader className="gap-1.5">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {items.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Signal</TableHead>
                <TableHead>Count</TableHead>
                <TableHead>Last seen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.label}>
                  <TableCell className="max-w-0 whitespace-normal font-medium">
                    {item.label}
                  </TableCell>
                  <TableCell>{item.count}</TableCell>
                  <TableCell>{item.lastSeenLabel}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <Empty className="min-h-[14rem] border border-dashed border-border bg-background">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <ListIcon />
              </EmptyMedia>
              <EmptyTitle>No ranked signals yet</EmptyTitle>
              <EmptyDescription>
                Repeated requests and loss reasons will appear here after the
                first weekly snapshot is saved.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </CardContent>
    </Card>
  );
}

function DeliveryVolumeCard({
  timeline,
}: {
  timeline: DashboardData["timeline"];
}) {
  return (
    <Card className="border-border bg-card shadow-none">
      <CardHeader className="gap-1.5">
        <CardTitle>Proposal throughput</CardTitle>
        <CardDescription>
          Weekly proposal volume compared with orders won.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-2">
        <ChartContainer config={deliveryVolumeConfig} className="h-[320px] w-full">
          <ComposedChart data={timeline}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={10} />
            <YAxis tickLine={false} axisLine={false} width={48} />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(label) => `Week ending ${label}`}
                  formatter={(value, name) => (
                    <div className="flex flex-1 items-center justify-between gap-3">
                      <span className="text-muted-foreground">
                        {deliveryVolumeConfig[String(name) as keyof typeof deliveryVolumeConfig]?.label}
                      </span>
                      <span className="font-mono font-medium text-foreground">
                        {formatMetricByKey(
                          String(name) as NumericMetricKey,
                          Number(value),
                        )}
                      </span>
                    </div>
                  )}
                />
              }
            />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar dataKey="proposalsSent" fill="var(--color-proposalsSent)" radius={[8, 8, 0, 0]} />
            <Line dataKey="ordersWon" stroke="var(--color-ordersWon)" strokeWidth={2.5} dot={false} />
          </ComposedChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

function DeliveryReliabilityCard({
  timeline,
}: {
  timeline: DashboardData["timeline"];
}) {
  return (
    <Card className="border-border bg-card shadow-none">
      <CardHeader className="gap-1.5">
        <CardTitle>Reliability watch</CardTitle>
        <CardDescription>
          Feed SLA against the incident count for each tracked week.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-2">
        <ChartContainer config={deliveryReliabilityConfig} className="h-[320px] w-full">
          <ComposedChart data={timeline}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={10} />
            <YAxis
              yAxisId="left"
              tickLine={false}
              axisLine={false}
              width={48}
              tickFormatter={(value) => `${value}%`}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tickLine={false}
              axisLine={false}
              width={40}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(label) => `Week ending ${label}`}
                  formatter={(value, name) => (
                    <div className="flex flex-1 items-center justify-between gap-3">
                      <span className="text-muted-foreground">
                        {deliveryReliabilityConfig[String(name) as keyof typeof deliveryReliabilityConfig]?.label}
                      </span>
                      <span className="font-mono font-medium text-foreground">
                        {formatMetricByKey(
                          String(name) as NumericMetricKey,
                          Number(value),
                        )}
                      </span>
                    </div>
                  )}
                />
              }
            />
            <ChartLegend content={<ChartLegendContent />} />
            <Line
              yAxisId="left"
              dataKey="feedSlaQualityScore"
              stroke="var(--color-feedSlaQualityScore)"
              strokeWidth={2.5}
              dot={false}
            />
            <Bar
              yAxisId="right"
              dataKey="incidentCount"
              fill="var(--color-incidentCount)"
              radius={[8, 8, 0, 0]}
            />
          </ComposedChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

function RecentSnapshotsCard({
  snapshots,
}: {
  snapshots: WeeklySnapshot[];
}) {
  const recentSnapshots = [...snapshots]
    .sort((left, right) => right.weekOf.localeCompare(left.weekOf))
    .slice(0, 6);

  return (
    <Card className="border-border bg-card shadow-none">
      <CardHeader className="gap-1.5">
        <CardTitle className="text-base">Recent snapshots</CardTitle>
        <CardDescription>
          The latest saved weeks in the local dashboard history.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {recentSnapshots.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Week ending</TableHead>
                <TableHead>Pipeline</TableHead>
                <TableHead>SLA</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentSnapshots.map((snapshot) => (
                <TableRow key={snapshot.weekOf}>
                  <TableCell>{formatWeekLabelWithYear(snapshot.weekOf)}</TableCell>
                  <TableCell>{formatMetricByKey("pipelineValue", snapshot.pipelineValue)}</TableCell>
                  <TableCell>{formatMetricByKey("feedSlaQualityScore", snapshot.feedSlaQualityScore)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <Empty className="min-h-[14rem] border border-dashed border-border bg-background">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <DatabaseIcon />
              </EmptyMedia>
              <EmptyTitle>No saved weeks yet</EmptyTitle>
              <EmptyDescription>
                The first weekly snapshot will appear here immediately after it
                is saved.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </CardContent>
    </Card>
  );
}

function formatCurrencyTick(value: number) {
  const absoluteValue = Math.abs(value);

  if (absoluteValue >= 1_000_000) {
    return `€${(value / 1_000_000).toFixed(1)}M`;
  }

  if (absoluteValue >= 1_000) {
    return `€${Math.round(value / 1_000)}k`;
  }

  return `€${value}`;
}
