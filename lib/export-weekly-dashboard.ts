import "server-only";

import ExcelJS from "exceljs";

import {
  KPI_FORM_SECTIONS,
  NUMERIC_FIELD_DEFINITIONS,
  aggregateTextItems,
  buildDashboardData,
  formatMetricDelta,
  formatWeekLabelWithYear,
  type DashboardData,
  type MetricFormat,
  type WeeklySnapshot,
} from "@/lib/kpi-dashboard";

const workbookTheme = {
  brand: "FF183B56",
  brandMuted: "FFEAF1F5",
  accent: "FF2F6B8A",
  accentMuted: "FFF4F8FB",
  text: "FF1C2430",
  subtext: "FF5F6B76",
  border: "FFD7E0E8",
  headerText: "FFFFFFFF",
  success: "FF1D7A5A",
  warning: "FFB7791F",
  danger: "FFB64040",
};

const workbookDateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "UTC",
});

function applyTitleBlock(
  sheet: ExcelJS.Worksheet,
  title: string,
  subtitle: string,
  endColumn: string,
) {
  sheet.mergeCells(`A1:${endColumn}1`);
  sheet.getCell("A1").value = title;
  sheet.getCell("A1").font = {
    name: "Aptos Display",
    size: 20,
    bold: true,
    color: { argb: workbookTheme.brand },
  };

  sheet.mergeCells(`A2:${endColumn}2`);
  sheet.getCell("A2").value = subtitle;
  sheet.getCell("A2").font = {
    name: "Aptos",
    size: 11,
    color: { argb: workbookTheme.subtext },
  };

  sheet.getRow(1).height = 28;
  sheet.getRow(2).height = 18;
}

function applySectionHeader(
  sheet: ExcelJS.Worksheet,
  rowNumber: number,
  title: string,
  endColumn: string,
  startColumn = "A",
) {
  sheet.mergeCells(`${startColumn}${rowNumber}:${endColumn}${rowNumber}`);
  const cell = sheet.getCell(`${startColumn}${rowNumber}`);
  cell.value = title;
  cell.font = {
    name: "Aptos",
    size: 11,
    bold: true,
    color: { argb: workbookTheme.brand },
  };
  cell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: workbookTheme.brandMuted },
  };
  cell.border = {
    top: { style: "thin", color: { argb: workbookTheme.border } },
    bottom: { style: "thin", color: { argb: workbookTheme.border } },
  };
}

function styleHeaderRow(row: ExcelJS.Row) {
  row.font = {
    name: "Aptos",
    size: 10,
    bold: true,
    color: { argb: workbookTheme.headerText },
  };
  row.alignment = { vertical: "middle", horizontal: "left" };

  row.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: workbookTheme.brand },
    };
    cell.border = {
      top: { style: "thin", color: { argb: workbookTheme.brand } },
      bottom: { style: "thin", color: { argb: workbookTheme.brand } },
      left: { style: "thin", color: { argb: workbookTheme.brand } },
      right: { style: "thin", color: { argb: workbookTheme.brand } },
    };
  });
}

function styleDataRow(row: ExcelJS.Row, rowIndex: number) {
  const fillColor =
    rowIndex % 2 === 0 ? workbookTheme.accentMuted : "FFFFFFFF";

  row.eachCell((cell) => {
    cell.font = {
      name: "Aptos",
      size: 10,
      color: { argb: workbookTheme.text },
    };
    cell.alignment = { vertical: "top", wrapText: true };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: fillColor },
    };
    cell.border = {
      bottom: { style: "thin", color: { argb: workbookTheme.border } },
    };
  });
}

function applyMetricNumberFormat(
  cell: ExcelJS.Cell,
  format: MetricFormat,
) {
  switch (format) {
    case "currency":
      cell.numFmt = '€#,##0';
      break;
    case "percent":
      cell.numFmt = '0.0"%"';
      break;
    case "days":
      cell.numFmt = '0.0" d"';
      break;
    case "months":
      cell.numFmt = '0.0" mo"';
      break;
    case "ratio":
      cell.numFmt = '0.0"x"';
      break;
    case "count":
    default:
      cell.numFmt = '#,##0';
      break;
  }
}

function addWorkbookOverview(
  sheet: ExcelJS.Worksheet,
  dashboard: DashboardData,
  snapshots: WeeklySnapshot[],
) {
  sheet.columns = [
    { key: "a", width: 30 },
    { key: "b", width: 20 },
    { key: "c", width: 20 },
    { key: "d", width: 24 },
    { key: "e", width: 28 },
    { key: "f", width: 18 },
  ];

  applyTitleBlock(
    sheet,
    "Fitsec KPI Dashboard Export",
    "Weekly operating metrics and trend snapshot",
    "F",
  );

  const latestSnapshot = dashboard.latestSnapshot;
  const previousSnapshot = dashboard.previousSnapshot;

  sheet.getCell("A4").value = "Generated";
  sheet.getCell("B4").value = workbookDateFormatter.format(new Date());
  sheet.getCell("D4").value = "Latest week ending";
  sheet.getCell("E4").value = latestSnapshot
    ? formatWeekLabelWithYear(latestSnapshot.weekOf)
    : "No data yet";
  sheet.getCell("A5").value = "Total snapshots";
  sheet.getCell("B5").value = snapshots.length;
  sheet.getCell("D5").value = "Open alerts";
  sheet.getCell("E5").value = dashboard.healthAlerts.length;

  [sheet.getCell("A4"), sheet.getCell("D4"), sheet.getCell("A5"), sheet.getCell("D5")].forEach(
    (cell) => {
      cell.font = { name: "Aptos", size: 10, bold: true, color: { argb: workbookTheme.subtext } };
    },
  );

  let rowCursor = 7;

  if (!latestSnapshot) {
    applySectionHeader(sheet, rowCursor, "No data available", "F");
    sheet.mergeCells(`A${rowCursor + 1}:F${rowCursor + 2}`);
    const cell = sheet.getCell(`A${rowCursor + 1}`);
    cell.value =
      "No weekly snapshots have been saved yet. Add data in the Weekly Update tab, then export again.";
    cell.alignment = { wrapText: true, vertical: "middle" };
    cell.font = { name: "Aptos", size: 11, color: { argb: workbookTheme.subtext } };
    return;
  }

  KPI_FORM_SECTIONS.forEach((section) => {
    applySectionHeader(sheet, rowCursor, section.title, "F");
    rowCursor += 1;

    const headerRow = sheet.addRow([
      "Metric",
      "Latest",
      "Prior week",
      "Change",
      "Description",
      "Direction",
    ]);
    styleHeaderRow(headerRow);
    rowCursor += 1;

    section.fields.forEach((field) => {
      const latestValue = latestSnapshot[field.key];
      const previousValue = previousSnapshot?.[field.key] ?? null;
      const directionLabel =
        field.betterDirection === "up"
          ? "Higher is better"
          : field.betterDirection === "down"
            ? "Lower is better"
            : "Monitor";

      const row = sheet.addRow([
        field.label,
        latestValue,
        previousValue,
        formatMetricDelta(field.key, latestValue, previousValue),
        field.description,
        directionLabel,
      ]);
      styleDataRow(row, rowCursor);
      applyMetricNumberFormat(row.getCell(2), field.format);

      if (previousValue !== null) {
        applyMetricNumberFormat(row.getCell(3), field.format);
      }

      rowCursor += 1;
    });

    rowCursor += 1;
  });

  applySectionHeader(sheet, rowCursor, "Current watch list", "F");
  rowCursor += 1;

  const watchHeaderRow = sheet.addRow(["Alert", "Severity", "Notes"]);
  styleHeaderRow(watchHeaderRow);
  rowCursor += 1;

  if (dashboard.healthAlerts.length) {
    dashboard.healthAlerts.forEach((alert) => {
      const row = sheet.addRow([
        alert.title,
        alert.variant === "destructive" ? "High" : "Monitor",
        alert.description,
      ]);
      styleDataRow(row, rowCursor);
      row.getCell(2).font = {
        name: "Aptos",
        size: 10,
        bold: true,
        color: {
          argb:
            alert.variant === "destructive"
              ? workbookTheme.danger
              : workbookTheme.warning,
        },
      };
      rowCursor += 1;
    });
  } else {
    const row = sheet.addRow([
      "No active alerts",
      "Healthy",
      "The latest saved week is inside the configured dashboard thresholds.",
    ]);
    styleDataRow(row, rowCursor);
    row.getCell(2).font = {
      name: "Aptos",
      size: 10,
      bold: true,
      color: { argb: workbookTheme.success },
    };
  }

  sheet.views = [{ state: "frozen", ySplit: 6 }];
}

function addMetricsSheet(
  sheet: ExcelJS.Worksheet,
  snapshots: WeeklySnapshot[],
) {
  const columns = [
    { header: "Week ending", key: "weekOf", width: 16 },
    { header: "Updated at (UTC)", key: "updatedAt", width: 22 },
    ...NUMERIC_FIELD_DEFINITIONS.map((field) => ({
      header: field.label,
      key: field.key,
      width: Math.max(14, Math.min(28, field.label.length + 4)),
    })),
  ];

  applyTitleBlock(
    sheet,
    "Weekly Metrics",
    "Full weekly export with all numeric KPI fields",
    "T",
  );

  sheet.columns = columns.map(({ key, width }) => ({ key, width }));

  const headerRow = sheet.getRow(4);
  headerRow.values = columns.map((column) => column.header);
  styleHeaderRow(headerRow);

  snapshots.forEach((snapshot, index) => {
    const row = sheet.addRow([
      formatWeekLabelWithYear(snapshot.weekOf),
      snapshot.updatedAt.replace("T", " ").replace(".000Z", " UTC"),
      ...NUMERIC_FIELD_DEFINITIONS.map((field) => snapshot[field.key]),
    ]);
    styleDataRow(row, 5 + index);

    NUMERIC_FIELD_DEFINITIONS.forEach((field, fieldIndex) => {
      applyMetricNumberFormat(row.getCell(fieldIndex + 3), field.format);
    });
  });

  sheet.autoFilter = {
    from: "A4",
    to: `${sheet.getColumn(columns.length).letter}4`,
  };
  sheet.views = [{ state: "frozen", ySplit: 4 }];
}

function addSignalsSheet(
  sheet: ExcelJS.Worksheet,
  snapshots: WeeklySnapshot[],
) {
  sheet.columns = [
    { width: 28 },
    { width: 12 },
    { width: 18 },
    { width: 4 },
    { width: 28 },
    { width: 12 },
    { width: 18 },
  ];

  applyTitleBlock(
    sheet,
    "Signals",
    "Aggregated commercial friction and repeated customer asks",
    "G",
  );

  const lossReasons = aggregateTextItems(snapshots, (snapshot) => snapshot.lossReasonsTop3);
  const repeatedRequests = aggregateTextItems(
    snapshots,
    (snapshot) => snapshot.repeatedRequests,
    6,
  );

  applySectionHeader(sheet, 4, "Top loss reasons", "C");
  applySectionHeader(sheet, 4, "Repeated requests", "G", "E");

  const leftHeader = sheet.getRow(5);
  leftHeader.getCell(1).value = "Signal";
  leftHeader.getCell(2).value = "Count";
  leftHeader.getCell(3).value = "Last seen";
  styleHeaderRow(leftHeader);

  const rightHeader = sheet.getRow(5);
  rightHeader.getCell(5).value = "Signal";
  rightHeader.getCell(6).value = "Count";
  rightHeader.getCell(7).value = "Last seen";
  styleHeaderRow(rightHeader);

  const maxRows = Math.max(lossReasons.length, repeatedRequests.length, 1);

  for (let index = 0; index < maxRows; index += 1) {
    const rowNumber = 6 + index;
    const row = sheet.getRow(rowNumber);
    const lossReason = lossReasons[index];
    const request = repeatedRequests[index];

    row.getCell(1).value = lossReason?.label ?? "";
    row.getCell(2).value = lossReason?.count ?? "";
    row.getCell(3).value = lossReason?.lastSeenLabel ?? "";
    row.getCell(5).value = request?.label ?? "";
    row.getCell(6).value = request?.count ?? "";
    row.getCell(7).value = request?.lastSeenLabel ?? "";
    styleDataRow(row, rowNumber);
  }

  const rawTableStart = 8 + maxRows;
  applySectionHeader(sheet, rawTableStart, "Weekly text signal log", "G");

  const rawHeader = sheet.getRow(rawTableStart + 1);
  rawHeader.values = [
    "Week ending",
    "Loss reason 1",
    "Loss reason 2",
    "Loss reason 3",
    "Repeated requests",
  ];
  styleHeaderRow(rawHeader);

  snapshots.forEach((snapshot, index) => {
    const row = sheet.getRow(rawTableStart + 2 + index);
    row.values = [
      formatWeekLabelWithYear(snapshot.weekOf),
      snapshot.lossReasonsTop3[0] ?? "",
      snapshot.lossReasonsTop3[1] ?? "",
      snapshot.lossReasonsTop3[2] ?? "",
      snapshot.repeatedRequests.join("\n"),
    ];
    styleDataRow(row, rawTableStart + 2 + index);
  });

  sheet.views = [{ state: "frozen", ySplit: 5 }];
}

function addStageSheet(
  sheet: ExcelJS.Worksheet,
  snapshots: WeeklySnapshot[],
) {
  const columns = [
    { header: "Week ending", key: "weekOf", width: 16 },
    { header: "Stage", key: "stage", width: 18 },
    { header: "Conversion %", key: "conversionPct", width: 14 },
    { header: "Avg days in stage", key: "avgDaysInStage", width: 18 },
  ];

  applyTitleBlock(
    sheet,
    "Stage Flow",
    "Stage conversion rates and average time spent in stage",
    "E",
  );

  sheet.columns = columns.map(({ key, width }) => ({ key, width }));

  const headerRow = sheet.getRow(4);
  headerRow.values = columns.map((column) => column.header);
  styleHeaderRow(headerRow);

  let dataRowIndex = 5;

  snapshots.forEach((snapshot) => {
    snapshot.stageMetrics.forEach((metric) => {
      const row = sheet.addRow([
        formatWeekLabelWithYear(snapshot.weekOf),
        metric.stage,
        metric.conversionPct,
        metric.avgDaysInStage,
      ]);
      styleDataRow(row, dataRowIndex);
      row.getCell(3).numFmt = '0.0"%"';
      row.getCell(4).numFmt = '0.0" d"';
      dataRowIndex += 1;
    });
  });

  sheet.autoFilter = {
    from: "A4",
    to: "D4",
  };
  sheet.views = [{ state: "frozen", ySplit: 4 }];
}

export async function buildWeeklyDashboardWorkbook(
  snapshots: WeeklySnapshot[],
) {
  const workbook = new ExcelJS.Workbook();
  const dashboard = buildDashboardData(snapshots);

  workbook.creator = "OpenAI Codex";
  workbook.company = "Fitsec";
  workbook.subject = "Fitsec KPI Dashboard";
  workbook.title = "Fitsec KPI Dashboard Export";
  workbook.created = new Date();
  workbook.modified = new Date();

  addWorkbookOverview(workbook.addWorksheet("Overview"), dashboard, snapshots);
  addMetricsSheet(workbook.addWorksheet("Weekly Metrics"), snapshots);
  addSignalsSheet(workbook.addWorksheet("Signals"), snapshots);
  addStageSheet(workbook.addWorksheet("Stage Flow"), snapshots);

  return Buffer.from(await workbook.xlsx.writeBuffer());
}
