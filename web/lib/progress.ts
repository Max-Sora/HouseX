import type Anthropic from "@anthropic-ai/sdk";

// Real progress from Claude's streamed JSON: its output follows the schema's key order, so the section being
// written tells us the stage, and counting a key that starts each item tells us how far into that section we are.

export type Progress = { stage: string; done?: number; total?: number };
export type OnProgress = (p: Progress) => void;

export type Section = {
  key: string;
  stage: string;
  itemKey?: string;
  total?: number;
};


export async function watchSections(
  stream: AsyncIterable<Anthropic.Beta.Messages.BetaRawMessageStreamEvent>,
  sections: Section[],
  onProgress?: OnProgress,
) {
  let text = "";
  let last = "";
  for await (const event of stream) {
    if (event.type !== "content_block_delta" || event.delta.type !== "text_delta") continue;
    text += event.delta.text;
    if (!onProgress) continue;
    let cur = -1;
    sections.forEach((s, i) => {
      if (text.includes(`"${s.key}"`)) cur = i;
    });
    if (cur < 0) continue;
    const s = sections[cur];
    const from = text.indexOf(`"${s.key}"`);
    const done = s.itemKey
      ? (text.slice(from).match(new RegExp(`"${s.itemKey}"\\s*:`, "g")) ?? [])
          .length
      : undefined;
    const sig = `${s.stage}:${done ?? ""}`;
    if (sig !== last) {
      last = sig;
      onProgress({ stage: s.stage, done, total: s.total });
    }
  }
}
