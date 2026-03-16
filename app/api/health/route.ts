import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "clairio-mission-control",
    timestamp: new Date().toISOString()
  });
}

