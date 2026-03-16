import { NextResponse } from "next/server";
import { runClickUpSync } from "@/lib/clickup/sync";
import { getSyncAdminData } from "@/lib/dashboard";
import { getClickUpOAuthConnection } from "@/lib/local-db";

export async function GET() {
  const data = await getSyncAdminData();

  return NextResponse.json({
    runs: data.runs,
    readyForSync: data.readyForSync
  });
}

export async function POST(request: Request) {
  try {
    const hasOAuthConnection = Boolean(getClickUpOAuthConnection()?.accessToken);
    const hasPersonalToken = Boolean(process.env.CLICKUP_API_TOKEN);
    const hasWorkspace = Boolean(process.env.CLICKUP_WORKSPACE_ID);

    if ((!hasOAuthConnection && !hasPersonalToken) || !hasWorkspace) {
      return NextResponse.json(
        {
          error:
            "ClickUp credentials are missing. Connect ClickUp with OAuth or add CLICKUP_API_TOKEN, and make sure CLICKUP_WORKSPACE_ID is set."
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
