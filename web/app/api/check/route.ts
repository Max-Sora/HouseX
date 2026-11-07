import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { extractPlan } from "@/lib/extract";
import { runCheck } from "@/lib/check";
import { rules } from "@/lib/rules";
import { lookupSite } from "@/lib/site";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get("file");
  const projectType = String(form.get("projectType") ?? "duplex");
  const district = (form.get("district") as string) || null;
  const address = String(form.get("address") ?? "").trim().slice(0, 200);

  if (!(file instanceof File) || file.type !== "application/pdf") {
    return NextResponse.json(
      { error: "Upload a PDF plan set." },
      { status: 400 },
    );
  }
  if (file.size > 30 * 1024 * 1024) {
    return NextResponse.json(
      { error: "PDF is larger than 30 MB." },
      { status: 400 },
    );
  }

  try {
    const pdf = Buffer.from(await file.arrayBuffer()).toString("base64");
    // The site lookup runs while Claude reads the plans.
    const [plan, site] = await Promise.all([
      extractPlan(pdf, rules),
      address ? lookupSite(address) : Promise.resolve(null),
    ]);
    return NextResponse.json(runCheck(rules, plan, district, projectType, site));
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) {
      return NextResponse.json(
        { error: "Server is missing a valid ANTHROPIC_API_KEY." },
        { status: 500 },
      );
    }
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
      { error: err instanceof Error ? err.message : "Check failed." },
      { status: 500 },
    );
  }
}
