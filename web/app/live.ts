// Turns the server's real progress events into the wait panel's steps and bar.
// A step starts on one event and finishes on another; counting steps show "12 of 28".

export type Step = {
  label: string;
  start: string;
  end: string;
  count?: string;
  weight: number;
};
export type Live = {
  seen: Record<string, number>;
  counts: Record<string, { done: number; total: number }>;
};
export type Shown = {
  label: string;
  state: "todo" | "active" | "done";
  detail?: string;
};

export const START = "submit";
export const freshLive = (): Live => ({
  seen: { [START]: Date.now() },
  counts: {},
});

export function addEvent(
  live: Live,
  ev: { stage: string; done?: number; total?: number },
): Live {
  const seen = live.seen[ev.stage]
    ? live.seen
    : { ...live.seen, [ev.stage]: Date.now() };
  const counts =
    ev.done !== undefined && ev.total !== undefined
      ? { ...live.counts, [ev.stage]: { done: ev.done, total: ev.total } }
      : live.counts;
  return { seen, counts };
}

export function show(
  steps: Step[],
  live: Live,
  now: number,
): { steps: Shown[]; fraction: number } {
  const total = steps.reduce((s, x) => s + x.weight, 0);
  let filled = 0;
  const shown = steps.map((s) => {
    const c = s.count ? live.counts[s.count] : undefined;
    const detail = c ? `${Math.min(c.done, c.total)} of ${c.total}` : undefined;
    if (live.seen[s.end]) {
      filled += s.weight;
      return { label: s.label, state: "done" as const, detail };
    }
    if (live.seen[s.start]) {
      // Within the active step: counted items when we have them, otherwise a slow creep that never reaches the end.
      const inner =
        c && c.total
          ? c.done / c.total
          : 0.85 * (1 - Math.exp(-(now - live.seen[s.start]) / 15000));
      filled += s.weight * inner;
      return { label: s.label, state: "active" as const, detail };
    }
    return { label: s.label, state: "todo" as const };
  });
  return { steps: shown, fraction: Math.min(0.99, filled / total) };
}

// Reads an NDJSON response: calls onEvent for each progress line, returns the result, throws the error.
export async function readProgress<T>(
  res: Response,
  onEvent: (ev: { stage: string; done?: number; total?: number }) => void,
): Promise<T> {
  if (!res.ok || !res.body) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? `Request failed (${res.status})`);
  }
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let nl: number;
    while ((nl = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, nl).trim();
      buf = buf.slice(nl + 1);
      if (!line) continue;
      const msg = JSON.parse(line);
      if (msg.type === "progress") onEvent(msg);
      else if (msg.type === "result") return msg.data as T;
      else if (msg.type === "error") throw new Error(msg.error);
    }
  }
  throw new Error("The connection closed before the result arrived.");
}

export const CHECK_STEPS = (withAddress: boolean): Step[] => [
  {
    label: "Uploading your plan set",
    start: START,
    end: "received",
    weight: 3,
  },
  ...(withAddress
    ? [
        {
          label: "Looking up the lot in Irvine's zoning and parcel maps",
          start: "site",
          end: "site_done",
          weight: 4,
        },
      ]
    : []),
  {
    label: "AI is reading every sheet of your plans",
    start: "reading",
    end: "project",
    weight: 30,
  },
  {
    label: "AI is finding the project data: units, height, setbacks, parking",
    start: "project",
    end: "documents",
    weight: 8,
  },
  {
    label: "Checking against Irvine's submittal checklist",
    start: "documents",
    end: "codes",
    count: "documents",
    weight: 25,
  },
  {
    label: "Checking zoning, building code and state housing law",
    start: "codes",
    end: "rules",
    count: "codes",
    weight: 22,
  },
  {
    label: "Linking every finding to its source",
    start: "rules",
    end: "result",
    weight: 8,
  },
];

export const FIX_STEPS: Step[] = [
  {
    label: "Collecting the findings from your report",
    start: START,
    end: "received",
    weight: 3,
  },
  {
    label: "AI is drafting the updated title-sheet notes and code list",
    start: "received",
    end: "fixes",
    weight: 25,
  },
  {
    label: "AI is writing the exact fix for each correction",
    start: "fixes",
    end: "letter",
    count: "fixes",
    weight: 55,
  },
  {
    label: "AI is writing your letter to the plan checker",
    start: "letter",
    end: "assemble",
    weight: 12,
  },
  {
    label: "Putting your package together",
    start: "assemble",
    end: "result",
    weight: 5,
  },
];
