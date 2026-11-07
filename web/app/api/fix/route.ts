import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { draftFixes } from "@/lib/fix";
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
  try {
    return NextResponse.json(await draftFixes(report));
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) {
      return NextResponse.json(
        { error: "Rate limited. Try again in a minute." },
        { status: 429 },
      );
    }
    if (err instanceof Anthropic.APIError) {
      return NextResponse.json(
        { error: `Claude API error ${err.status}: ${err.message}` },
        { status: 502 },
      );
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Drafting failed." },
      { status: 500 },
    );
  }
}
