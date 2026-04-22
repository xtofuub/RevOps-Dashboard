import { NextResponse } from "next/server";

import { readSnapshotRevisions } from "@/lib/dashboard-store";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ weekOf: string }> },
) {
  try {
    const { weekOf } = await context.params;
    const revisions = await readSnapshotRevisions(decodeURIComponent(weekOf));

    return NextResponse.json({ revisions });
  } catch (error) {
    console.error("Failed to load snapshot revisions", error);

    return NextResponse.json(
      {
        message:
          "The weekly snapshot revision history could not be loaded. Please try again in a moment.",
      },
      { status: 500 },
    );
  }
}
