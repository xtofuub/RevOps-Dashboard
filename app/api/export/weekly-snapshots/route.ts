import { NextResponse } from "next/server";

import { readWeeklySnapshots } from "@/lib/dashboard-store";
import { buildWeeklyDashboardWorkbook } from "@/lib/export-weekly-dashboard";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const snapshots = await readWeeklySnapshots();
    const latestWeekEnding = snapshots.at(-1)?.weekOf;
    const workbook = await buildWeeklyDashboardWorkbook(snapshots);
    const fileName = latestWeekEnding
      ? `fitsec-kpi-dashboard-${latestWeekEnding}.xlsx`
      : "fitsec-kpi-dashboard.xlsx";

    return new NextResponse(workbook, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Failed to export weekly dashboard workbook", error);

    return NextResponse.json(
      {
        message:
          "The Excel export could not be generated. Please try again in a moment.",
      },
      { status: 500 },
    );
  }
}
