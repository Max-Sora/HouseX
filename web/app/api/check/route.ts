import { NextResponse } from "next/server";
import { extractPlan } from "@/lib/extract";
import { runCheck } from "@/lib/check";
import { rules } from "@/lib/rules";
import { lookupSite } from "@/lib/site";
import { ndjson } from "@/lib/ndjson";

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

  const pdf = Buffer.from(await file.arrayBuffer()).toString("base64");
  return ndjson(async (send) => {
    send({ stage: "received" });
    // The site lookup runs while Claude reads the plans.
    const site = address
      ? (send({ stage: "site" }),
        lookupSite(address).then((s) => {
          send({ stage: "site_done" });
          return s;
        }))
      : Promise.resolve(null);
    send({ stage: "reading" });
    const [plan, siteFacts] = await Promise.all([extractPlan(pdf, rules, projectType, send), site]);
    send({ stage: "rules" });
    return runCheck(rules, plan, district, projectType, siteFacts);
  });
}
