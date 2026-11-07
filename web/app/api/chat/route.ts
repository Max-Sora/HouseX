import Anthropic from "@anthropic-ai/sdk";
import { rules } from "@/lib/rules";
import type { Report } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 120;

const client = new Anthropic();

const INSTRUCTIONS = `You are the HouseX assistant, inside a web app that pre-checks residential plan sets for the City of Irvine, California, before they are submitted for a permit.

How HouseX works, so you can explain it:
- Check page: the user enters the project address, uploads a plan set PDF and picks the project type (single-family home, SFR + ADU, duplex, triplex, mixed use) and zoning district.
- The address is looked up in public map data: City of Irvine geocoder, zoning and parcel maps, FEMA flood zones and CAL FIRE fire hazard zones.
- Claude reads the PDF and reports only what is printed. A plain rule engine then decides each finding; the AI never decides pass or fail.
- Report page: a PASS / FAIL / INCOMPLETE stamp, then missing documents (filterable by type), corrections, values not stated, items for a human plan checker, and passed items, each with a source link.
- Savings pages: weeks and dollars saved by catching problems before submittal, from editable assumptions. Fix my plan: a drafted correction package for an architect to review and stamp.
- Cost benefit page: interest saved on an interest-only construction loan (amount × rate ÷ 12 × months saved) plus consultant hours saved (pages × hours per page × hourly rate).
- Requirements page: every rule HouseX checks, by project type, with sources.

How to answer:
- Answer from the HouseX rule data and the user's report below. Cite the source title and URL for any rule you state.
- If the rule data does not cover the question, say you don't know and point to who would (Irvine Planning, Building & Safety, OCFA, a licensed architect). Never invent section numbers, fees, deadlines, dimensions or forms.
- Rules marked UNVERIFIED are leads, not facts; say so when you use one.
- Keep answers short and plain: two to five sentences or a short list. No legal advice; you are not the city.
- Answer in the language the user writes in.`;

// The rule data is the same for every request, so it sits in a cached block.
const KNOWLEDGE = `HouseX rule data for ${rules.city} (checked ${rules.checked}), as JSON:\n${JSON.stringify(rules)}`;

function reportContext(r: Report | null): string {
  if (!r) return "The user has not run a pre-check yet.";
  const brief = {
    result: r.result,
    projectType: r.projectType,
    district: r.district,
    project: r.extracted.project,
    site: r.site && {
      address: r.site.matched_address,
      apn: r.site.apn,
      lot_area_sf: r.site.lot_area_sf,
      zoning: r.site.zoning,
      flood_zone: r.site.flood_zone,
      fire_hazard: r.site.fire_hazard,
    },
    findings: r.findings
      .filter((f) => f.kind !== "passed")
      .map((f) => ({
        kind: f.kind,
        title: f.title,
        detail: f.detail,
        plans: f.planValue,
        required: f.required,
        source: f.source?.url,
      })),
  };
  return `The user's current pre-check report:\n${JSON.stringify(brief)}`;
}

type Msg = { role: "user" | "assistant"; content: string };

export async function POST(req: Request) {
  let messages: Msg[];
  let report: Report | null;
  try {
    const body = await req.json();
    messages = (body.messages as Msg[])
      .filter(
        (m) =>
          (m.role === "user" || m.role === "assistant") &&
          typeof m.content === "string" &&
          m.content.trim(),
      )
      .slice(-20)
      .map((m) => ({ role: m.role, content: m.content.slice(0, 4000) }));
    report = body.report ?? null;
    if (
      !messages.length ||
      messages[0].role !== "user" ||
      messages.at(-1)!.role !== "user"
    )
      throw new Error();
  } catch {
    return Response.json(
      {
        error:
          "Send the conversation as messages, starting and ending with the user.",
      },
      { status: 400 },
    );
  }

  const stream = client.beta.messages.stream({
    model: "claude-opus-5-5",
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    max_tokens: 8000,
    output_config: { effort: "low" },
    system: [
      {
        type: "text",
        text: `${INSTRUCTIONS}\n\n${KNOWLEDGE}`,
        cache_control: { type: "ephemeral" },
      },
      { type: "text", text: reportContext(report) },
    ],
    messages,
  });

  const encoder = new TextEncoder();
  const body = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
        const final = await stream.finalMessage();
        if (final.stop_reason === "refusal")
          controller.enqueue(encoder.encode("\n\nI can't help with that one."));
      } catch (err) {
        const msg =
          err instanceof Anthropic.RateLimitError
            ? "Too many questions at once. Try again in a minute."
            : "Sorry, the assistant is unavailable right now.";
        controller.enqueue(encoder.encode(`\n\n${msg}`));
      } finally {
        controller.close();
      }
    },
  });
  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
