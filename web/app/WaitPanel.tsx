"use client";

import { useEffect, useState } from "react";
import { START, show, type Live, type Step } from "./live";
import styles from "./wait.module.css";

// Shown while a long request runs. Steps and the bar follow the server's real progress events (live.ts);
// the clock, scan line and facts keep the wait from feeling stuck.

const FACTS = [
  "Irvine requires fire sprinklers in all new residential buildings.",
  "In Irvine, every new roof must be Class A fire-rated.",
  "Irvine requires outside wiring on private property to run underground.",
  "New homes must divert 75% of concrete and asphalt and 65% of other construction waste.",
  "Irvine's plan review clock doesn't start until the review fees are paid.",
  "A school fee certificate is needed before Irvine issues a building permit.",
  "State law caps ADU side and rear setbacks at 4 feet.",
  "Cities must say whether an ADU application is complete within 15 business days.",
];

export default function WaitPanel({
  title,
  steps,
  live,
  typical,
}: {
  title: string;
  steps: Step[];
  live: Live;
  typical: string;
}) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, []);

  const elapsed = Math.max(0, (now - live.seen[START]) / 1000);
  const view = show(steps, live, now);
  const progress = view.fraction * 100;
  const fact = FACTS[Math.floor(elapsed / 7) % FACTS.length];
  const mm = Math.floor(elapsed / 60);
  const ss = String(Math.floor(elapsed % 60)).padStart(2, "0");

  return (
    <div className={styles.panel} role="status" aria-live="polite">
      <div className={styles.top}>
        <div className={styles.sheet} aria-hidden="true">
          <svg viewBox="0 0 120 84" className={styles.plan}>
            <rect x="2" y="2" width="116" height="80" rx="3" />
            <path d="M14 14h56v40H14z M70 14h36v26H70z M70 40h36v14H70z M14 54h40v18H14z M54 54h52v18H54z" />
            <path
              d="M40 14v12 M70 30h-8 M88 40v-6 M30 54v8 M78 54v6"
              className={styles.thin}
            />
            <rect
              x="96"
              y="66"
              width="16"
              height="10"
              className={styles.titleBlock}
            />
          </svg>
          <span className={styles.scan} />
        </div>
        <div>
          <p className={styles.title}>{title}</p>
          <p className={styles.meta}>
            {mm}:{ss} · usually {typical}
          </p>
        </div>
      </div>

      <div className={styles.bar}>
        <span style={{ width: `${progress}%` }} />
      </div>

      <ol className={styles.steps}>
        {view.steps.map(({ label, state, detail }) => (
          <li key={label} className={styles[state]}>
            <span className={styles.mark} aria-hidden="true">
              {state === "done" ? "✓" : ""}
            </span>
            {label}
            {detail && <span className={styles.detail}>{detail}</span>}
            {state === "active" && !detail && <span className={styles.dots} aria-hidden="true" />}
          </li>
        ))}
      </ol>

      <p key={fact} className={styles.fact}>
        <span>While you wait</span> {fact}
      </p>
    </div>
  );
}
