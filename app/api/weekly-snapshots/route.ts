import { NextResponse } from "next/server";

import { buildDashboardForecast } from "@/lib/dashboard-forecast";
import { deleteWeeklySnapshot, readWeeklySnapshots, upsertWeeklySnapshot } from "@/lib/dashboard-store";
import { auth } from "@/lib/auth";
import { buildDashboardData, weeklySnapshotPayloadSchema } from "@/lib/kpi-dashboard";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const snapshots = await readWeeklySnapshots();
    return NextResponse.json({
      snapshots,
      dashboard: buildDashboardData(snapshots),
      forecast: buildDashboardForecast(snapshots),
    });
  } catch (error) {
    console.error("Failed to load weekly snapshots", error);

    return NextResponse.json(
      {
        message:
          "The weekly snapshot timeline could not be loaded. Please try again in a moment.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { message: "You must be signed in to save weekly snapshots." },
        { status: 401 },
      );
    }

    const payload = await request.json();
    const parsedPayload = weeklySnapshotPayloadSchema.safeParse(payload);

    if (!parsedPayload.success) {
      const fieldErrors: Record<string, string> = {};

      parsedPayload.error.issues.forEach((issue) => {
        const key = issue.path.join(".");

        if (!fieldErrors[key]) {
          fieldErrors[key] = issue.message;
        }
      });

      const firstIssue = parsedPayload.error.issues[0];

      return NextResponse.json(
        {
          message: firstIssue?.message ?? "Please review the weekly snapshot fields.",
          errors: fieldErrors,
        },
        { status: 400 },
      );
    }

    const result = await upsertWeeklySnapshot(parsedPayload.data, {
      authorLabel: `${session.user.name} (@${session.user.username})`,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to upsert weekly snapshot", error);

    return NextResponse.json(
      {
        message:
          "The weekly snapshot could not be saved. Please try again in a moment.",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const weekOf = url.searchParams.get("weekOf");

    if (!weekOf) {
      return NextResponse.json(
        { message: "Missing weekOf parameter." },
        { status: 400 },
      );
    }

    const deleted = await deleteWeeklySnapshot(weekOf);

    if (!deleted) {
      return NextResponse.json(
        { message: "Snapshot not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete weekly snapshot", error);

    return NextResponse.json(
      {
        message:
          "The weekly snapshot could not be deleted. Please try again in a moment.",
      },
      { status: 500 },
    );
  }
}
