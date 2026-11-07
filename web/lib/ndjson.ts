import Anthropic from "@anthropic-ai/sdk";
import type { Progress } from "./progress";

// A long job as a stream of JSON lines: {"type":"progress",...} as stages really happen, then one
// {"type":"result","data":...} or {"type":"error","error":...}. Lets the page show real progress.
export function ndjson(
  job: (send: (p: Progress) => void) => Promise<unknown>,
): Response {
  const enc = new TextEncoder();
  const body = new ReadableStream({
    async start(controller) {
      const line = (o: object) =>
        controller.enqueue(enc.encode(JSON.stringify(o) + "\n"));
      try {
        const data = await job((p) => line({ type: "progress", ...p }));
        line({ type: "result", data });
      } catch (err) {
        line({ type: "error", error: errorText(err) });
      } finally {
        controller.close();
      }
    },
  });
  return new Response(body, {
    headers: {
      "Content-Type": "application/x-ndjson",
      "Cache-Control": "no-store",
    },
  });
}

function errorText(err: unknown): string {
  if (err instanceof Anthropic.AuthenticationError)
    return "Server is missing a valid ANTHROPIC_API_KEY.";
  if (err instanceof Anthropic.RateLimitError)
    return "Rate limited. Try again in a minute.";
  if (err instanceof Anthropic.APIError)
    return `Claude API error ${err.status}: ${err.message}`;
  return err instanceof Error ? err.message : "Something went wrong.";
}
