// Captures demo screens from the running app (http://localhost:3000) with headless Chrome over CDP.
// Usage: node video/capture.mjs <outDir>
// The /api/check call is answered with video/demo-report.json, the saved result of a real check of the same
// plan set and address, so the 1-2 minute wait is cut, like "cut past the wait" in the script.
import { spawn } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const out = process.argv[2] ?? join(here, "frames");
mkdirSync(out, { recursive: true });
const report = readFileSync(join(here, "demo-report.json"), "utf8");
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PORT = 9333;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const chrome = spawn(CHROME, [
  "--headless=new",
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${join(out, ".chrome-profile")}`,
  "--no-first-run",
  "--hide-scrollbars",
  "about:blank",
]);

let ws;
try {
  let targets;
  for (let i = 0; i < 50 && !targets; i++) {
    try {
      targets = await (
        await fetch(`http://127.0.0.1:${PORT}/json/list`)
      ).json();
    } catch {
      await wait(200);
    }
  }
  const page = targets.find((t) => t.type === "page");
  ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener("open", r, { once: true }));

  let id = 0;
  const pending = new Map();
  ws.addEventListener("message", (e) => {
    const msg = JSON.parse(e.data);
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)(msg);
      pending.delete(msg.id);
    }
  });
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const n = ++id;
      pending.set(n, (m) =>
        m.error
          ? reject(new Error(`${method}: ${m.error.message}`))
          : resolve(m.result),
      );
      ws.send(JSON.stringify({ id: n, method, params }));
    });
  const js = async (expression) => {
    const r = await send("Runtime.evaluate", {
      expression,
      awaitPromise: true,
      returnByValue: true,
    });
    if (r.exceptionDetails)
      throw new Error(
        r.exceptionDetails.exception?.description ?? "eval failed",
      );
    return r.result.value;
  };
  // Each shot can record where its key element sits, in screenshot pixels (CSS px × 1.5).
  const rects = {};
  const shot = async (name, targetJs) => {
    await wait(400);
    if (targetJs) {
      rects[name] = await js(`(() => { const r = (${targetJs}).getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom].map((v) => Math.round(v * 1.5)); })()`);
    }
    const { data } = await send("Page.captureScreenshot", { format: "png" });
    writeFileSync(join(out, `${name}.png`), Buffer.from(data, "base64"));
    console.log("saved", name);
  };
  const go = async (url) => {
    await send("Page.navigate", { url });
    await wait(2500);
  };
  const scrollTo = (selectorJs, offset = 24) =>
    js(
      `(() => { const el = ${selectorJs}; el.scrollIntoView({block: "start"}); window.scrollBy(0, -${offset}); return true; })()`,
    );

  await send("Page.enable");
  await send("Runtime.enable");
  // 1280x720 layout rendered at 1.5x = a sharp 1920x1080 frame
  await send("Emulation.setDeviceMetricsOverride", {
    width: 1280,
    height: 720,
    deviceScaleFactor: 1.5,
    mobile: false,
  });
  await send("Emulation.setEmulatedMedia", {
    features: [{ name: "prefers-color-scheme", value: "light" }],
  });
  // Hide the Next.js dev-server badge; it is not part of the product.
  await send("Page.addScriptToEvaluateOnNewDocument", {
    source: `document.addEventListener("DOMContentLoaded", () => {
      const st = document.createElement("style");
      st.textContent = "nextjs-portal { display: none !important; }";
      document.head.appendChild(st);
    });`,
  });
  // Answer /api/check with the saved real result after a short pause.
  await send("Page.addScriptToEvaluateOnNewDocument", {
    source: `(() => {
      const saved = ${JSON.stringify(report)};
      const real = window.fetch.bind(window);
      window.fetch = async (input, init) => {
        const url = typeof input === "string" ? input : input.url;
        if (url.includes("/api/check")) {
          await new Promise((r) => setTimeout(r, 2500));
          return new Response(saved, { status: 200, headers: { "Content-Type": "application/json" } });
        }
        return real(input, init);
      };
    })();`,
  });

  // Fresh session
  await go("http://localhost:3000/");
  await js(`sessionStorage.clear(); true`);
  await go("http://localhost:3000/");
  await shot("01-home");

  // Type the address, load the real duplex sample
  await js(`(() => {
    const el = document.querySelector('input[type=text]');
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(el, "1 Civic Center Plaza, Irvine, CA 92606");
    el.dispatchEvent(new Event("input", { bubbles: true }));
    return true;
  })()`);
  await scrollTo(`document.querySelector('form')`, 16);
  await shot("02-address", `document.querySelector("input[type=text]")`);
  await js(`(async () => {
    [...document.querySelectorAll("button")].find((b) => b.innerText.startsWith("Try a real duplex")).click();
    for (let i = 0; i < 50; i++) {
      if (document.querySelector("label span")?.innerText.includes("fresno")) break;
      await new Promise((r) => setTimeout(r, 200));
    }
    return true;
  })()`);
  await wait(1500);
  await scrollTo(`document.querySelector('form')`, 16);
  await shot("03-loaded", `[...document.querySelectorAll("button")].find((b) => b.innerText.startsWith("Try a real duplex"))`);

  // Run
  await js(
    `(() => { document.querySelector("button[type=submit]").click(); return true; })()`,
  );
  await wait(700);
  await shot("04-running", `document.querySelector("button[type=submit]")`);
  await wait(4500);

  // Report
  await js(`window.scrollTo(0, 0); true`);
  await shot("05-report", `document.querySelector("[class*=titleBlock]")`);
  await scrollTo(
    `[...document.querySelectorAll("summary")].find((s) => s.innerText.startsWith("Lot facts")).parentElement`,
  );
  await shot("06-lot-facts");

  // Missing documents filtered by Fees
  await js(
    `(() => { [...document.querySelectorAll('[aria-label="Filter by document type"] button')].find((b) => b.innerText.startsWith("Fees")).click(); return true; })()`,
  );
  await scrollTo(
    `[...document.querySelectorAll("summary")].find((s) => s.innerText.startsWith("Missing documents")).parentElement`,
  );
  await shot("07-fees", `[...document.querySelectorAll('[aria-label="Filter by document type"] button')].find((b) => b.innerText.startsWith("Fees"))`);

  // Open one correction's details and its source
  await js(`(() => {
    const sec = [...document.querySelectorAll("summary")].find((s) => s.innerText.startsWith("Corrections needed")).parentElement;
    const item = [...sec.querySelectorAll("li")].find((li) => li.querySelector('details a[href^="http"]'));
    item.querySelector("details").open = true;
    item.setAttribute("data-demo", "1");
    return true;
  })()`);
  await scrollTo(`document.querySelector('[data-demo="1"]')`, 120);
  await shot("08-correction", `document.querySelector('[data-demo="1"]')`);
  writeFileSync(join(out, "rects.json"), JSON.stringify(rects, null, 1));
  const src = await js(
    `document.querySelector('[data-demo="1"] details a').href`,
  );
  console.log("source", src);
} finally {
  ws?.close();
  chrome.kill();
}
