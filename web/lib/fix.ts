import Anthropic from "@anthropic-ai/sdk";
import type { Report } from "./types";
import { watchSections, type OnProgress } from "./progress";

const client = new Anthropic();

export interface FixPackage {
  title_sheet_notes: string[];
  fixes: {
    finding: string;
    action: string;
    who: string;
    sheet: string;
    draft_text: string;
  }[];
  cover_letter: string;
}

const obj = (properties: Record<string, unknown>) => ({
  type: "object",
  properties,
  required: Object.keys(properties),
  additionalProperties: false,
});

const SCHEMA = obj({
  title_sheet_notes: { type: "array", items: { type: "string" } },
  fixes: {
    type: "array",
    items: obj({
      finding: { type: "string" },
      action: { type: "string" },
      who: {
        type: "string",
        enum: [
          "Architect",
          "Structural engineer",
          "Fire sprinkler designer",
          "Civil engineer",
          "Applicant",
          "Energy consultant",
        ],
      },
      sheet: { type: "string" },
      draft_text: { type: "string" },
    }),
  },
  cover_letter: { type: "string" },
});

const SYSTEM = `You draft a correction package for a residential plan set before it is submitted to a California city.
You get the pre-check findings (each with its rule and source) and the project data read from the plans.

Rules:
- Fix only the findings given. One entry in "fixes" per finding, in the order given, with "finding" copied from its title.
- "action" says plainly what to change or provide. "sheet" names the sheet to change (for example "A0.0 title sheet") or "Separate document".
- "draft_text" is the exact note, table row or code list line to put on the plans, or the form to complete with its source link.
- Never invent project values (dimensions, areas, setbacks, fire ratings, parcel numbers). Where the designer must decide a value, write [designer to confirm].
- Never claim something complies. These are drafts for a licensed professional to review and stamp.
- "title_sheet_notes" is the updated block of code references and general notes for the title sheet, one line per item.
- "cover_letter" is a short letter to the city plan checker listing what the resubmittal changes. Plain words, no greeting fluff. Leave [Applicant name] and [Date] as placeholders.`;

export async function draftFixes(report: Report, onProgress?: OnProgress): Promise<FixPackage> {
  const toFix = report.findings
    .filter(
      (f) =>
        f.kind === "violation" ||
        f.kind === "missing_document" ||
        f.kind === "unknown",
    )
    .map((f) => ({
      title: f.title,
      kind: f.kind,
      detail: f.detail,
      plans: f.planValue,
      required: f.required,
      source: f.source ? `${f.source.title} ${f.source.url}` : undefined,
    }));

  const stream = client.beta.messages.stream({
    model: "claude-opus-5-5",
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    max_tokens: 64000,
    thinking: { type: "adaptive" },
    output_config: {
      effort: "medium",
      format: { type: "json_schema", schema: SCHEMA },
    },
    system: [
      { type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } },
    ],
    messages: [
      {
        role: "user",
        content: JSON.stringify({
          city: report.city,
          project_type: report.projectType,
          district: report.district,
          project: report.extracted.project,
          site: report.site
            ? {
                address: report.site.matched_address,
                apn: report.site.apn,
                zoning: report.site.zoning,
              }
            : null,
          findings: toFix,
        }),
      },
    ],
  });
  await watchSections(
    stream,
    [
      { key: "title_sheet_notes", stage: "notes" },
      { key: "fixes", stage: "fixes", itemKey: "finding", total: toFix.length },
      { key: "cover_letter", stage: "letter" },
    ],
    onProgress,
  );
  const message = await stream.finalMessage();
  if (message.stop_reason === "refusal")
    throw new Error("The model declined to draft this package.");
  if (message.stop_reason === "max_tokens")
    throw new Error("The package was too long to draft in one pass.");
  const text = message.content.find((b) => b.type === "text");
  if (!text || text.type !== "text") throw new Error("No package returned.");
  return JSON.parse(text.text) as FixPackage;
}
