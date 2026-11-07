import { NextResponse } from "next/server";
import { draftFixes } from "@/lib/fix";
import { ndjson } from "@/lib/ndjson";
import type { Report } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: Request) {
  let report: Report;
  try {
    report = (await req.json()) as Report;
    if (!Array.isArray(report?.findings) || !report.extracted)
      throw new Error();
  } catch {
    return NextResponse.json(
      { error: "Send the pre-check report as JSON." },
      { status: 400 },
    );
  }
  return ndjson(async (send) => {
    send({ stage: "received" });
    const pkg = await draftFixes(report, send);
    send({ stage: "assemble" });
    return pkg;
  });
}
