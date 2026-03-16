import { NextResponse } from "next/server";
import { runClickUpSync } from "@/lib/clickup/sync";
import { getSyncAdminData } from "@/lib/dashboard";

export async function GET() {
  const data = await getSyncAdminData();

  return NextResponse.json({
    runs: data.runs,
    readyForSync: data.readyForSync
  });
}

export async function POST(request: Request) {
  try {
    if (!process.env.CLICKUP_API_TOKEN || !process.env.CLICKUP_WORKSPACE_ID) {
      return NextResponse.json(
        {
          error: "ClickUp credentials are missing. Add CLICKUP_API_TOKEN and CLICKUP_WORKSPACE_ID to enable sync."
        },
        { status: 400 }
      );
    }

    const body = (await request.json().catch(() => ({}))) as {
      updatedAfter?: string;
    };

    const result = await runClickUpSync({
      updatedAfter: body.updatedAfter ? new Date(body.updatedAfter) : undefined
    });

    return NextResponse.json(result, { status: 202 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown sync error";

    return NextResponse.json(
      {
        error: message
      },
      { status: 500 }
    );
  }
}
