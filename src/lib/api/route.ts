import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0] ||
    req.headers.get("x-real-ip") ||
    "unknown";

  console.log("IP:", ip);

  return NextResponse.json({ ok: true });
}