import Anthropic from "@anthropic-ai/sdk";
import type { ExtractedPlan, RuleSet } from "./types";

const client = new Anthropic();

const num = { anyOf: [{ type: "number" }, { type: "null" }] };
const str = { type: "string" };
const bool = { anyOf: [{ type: "boolean" }, { type: "null" }] };
const obj = (properties: Record<string, unknown>) => ({
  type: "object",
  properties,
  required: Object.keys(properties),
  additionalProperties: false,
});

const SCHEMA = obj({
  project: obj({
    address: str,
    jurisdiction_on_plans: str,
    project_type: {
      type: "string",
      enum: ["duplex", "triplex", "other", "unknown"],
    },
    unit_count: num,
    stories: num,
    building_height_ft: num,
    lot_area_sf: num,
    total_floor_area_sf: num,
    lot_coverage_pct: num,
    zoning_district_on_plans: str,
    occupancy_group: str,
    construction_type: str,
    sprinklered: bool,
    sprinkler_system: str,
    building_footprint_sf: num,
    parking_spaces: num,
    setbacks_ft: obj({ front: num, side: num, rear: num }),
    code_editions_cited: { type: "array", items: { type: "string" } },
  }),
  sheet_index: {
    type: "array",
    items: obj({ sheet_id: { type: "string" }, title: { type: "string" } }),
  },
  required_items: {
    type: "array",
    items: obj({
      id: { type: "string" },
      status: { type: "string", enum: ["present", "missing", "unclear", "not_applicable"] },
      evidence: { type: "string" },
    }),
  },
  code_triggers: {
    type: "array",
    items: obj({
      id: { type: "string" },
      status: {
        type: "string",
        enum: ["addressed", "not_addressed", "unclear", "not_applicable"],
      },
      evidence: { type: "string" },
    }),
  },
  outdated_citations: {
    type: "array",
    items: obj({ text: { type: "string" }, why: { type: "string" } }),
  },
  notes: { type: "string" },
});

function instructions(rules: RuleSet, projectType: string): string {
  const docs = rules.required_documents
    .filter((d) => d.applies_to.includes(projectType))
    .map(
      (d) =>
        `- ${d.id}: ${d.name} — ${d.description} (look for: ${d.detect_hints.join(", ")})`,
    )
    .join("\n");
  const triggers = rules.code_triggers
    .filter((t) => t.applies_to.includes(projectType))
    .map(
      (t) =>
        `- ${t.id}: ${t.rule} Evidence a plan checker looks for: ${t.required_evidence_on_plans}`,
    )
    .join("\n");
  return `You read residential construction plan sets (PDF) for a pre-submittal check in ${rules.city}, California.
Your only job is to report what the document says. Another program applies the rules.

Rules for reading:
- Report a value only if it is printed in the document. Never estimate, compute from a scaled drawing, or assume. If a number or yes/no is not stated, use null; if a text field is not stated, use an empty string.
- sprinkler_system is the standard named on the plans, e.g. "NFPA 13", "NFPA 13R", "NFPA 13D"; null if none is named. building_footprint_sf is the largest single-story or footprint area stated.
- Convert units to feet and square feet. Height means overall building height if stated.
- "evidence" must name the sheet or page and quote the short text you relied on. If nothing was found, say what you looked for.
- A required item is "present" only if the document itself contains it or its sheet index lists it. "unclear" if it is referenced but not included.
- Use "not_applicable" for a required item only when the item itself is conditional ("if ...", "only if ...", "optional") and the plans clearly state the condition does not apply (for example "no lot split", "not in a Fire Hazard Severity Zone").

Required submittal items to look for (report every id, in this order):
${docs}

Code requirements to look for (report every id, in this order):
${triggers}

For a code requirement, use "not_applicable" only when its condition clearly does not match this project (for example a 3+ unit rule on a duplex).

Also list any legal or code citations that look outdated (for example Gov Code 65852.2, which was renumbered to 66310-66342 in 2024, or code editions older than the 2025 California codes).`;
}

export async function extractPlan(
  pdfBase64: string,
  rules: RuleSet,
  projectType: string,
): Promise<ExtractedPlan> {
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
      {
        type: "text",
        text: instructions(rules, projectType),
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [
      {
        role: "user",
        content: [
          {
            type: "document",
            source: {
              type: "base64",
              media_type: "application/pdf",
              data: pdfBase64,
            },
          },
          {
            type: "text",
            text: "Read this plan set and report what it states.",
          },
        ],
      },
    ],
  });
  const message = await stream.finalMessage();
  if (message.stop_reason === "refusal")
    throw new Error("The model declined to read this document.");
  if (message.stop_reason === "max_tokens")
    throw new Error("The plan set was too long to read in one pass.");
  const text = message.content.find((b) => b.type === "text");
  if (!text || text.type !== "text") throw new Error("No extraction returned.");
  const plan = JSON.parse(text.text) as ExtractedPlan;
  // Empty text means "not stated"; the rest of the app expects null for that.
  const p = plan.project as unknown as Record<string, unknown>;
  for (const k of Object.keys(p)) if (p[k] === "") p[k] = null;
  return plan;
}
